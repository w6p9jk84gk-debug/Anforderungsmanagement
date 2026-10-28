import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Administration } from "./Administration";
import { Icon } from "./Icon";
import { RequirementEditor } from "./RequirementEditor";
import {
  applyConfiguration,
  exportRequirements,
  isWorkspace,
  legacyStorageKey,
  loadWorkspace,
  priorities,
  requirementId,
  roleNames,
  storageKey,
} from "./model";
import type {
  Configuration,
  Requirement,
  RequirementInput,
  Workspace,
} from "./model";

type Page = "requirements" | "administration";
function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function App() {
  const [initial] = useState(() => loadWorkspace());
  const [workspace, setWorkspace] = useState(initial.workspace);
  const [error, setError] = useState<string | null>(initial.error);
  const snapshot = useRef(initial.raw);
  const [page, setPage] = useState<Page>(() =>
    window.location.hash === "#administration"
      ? "administration"
      : "requirements",
  );
  const [configurationDirty, setConfigurationDirty] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [editor, setEditor] = useState<{ item: Requirement | null } | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const { configuration, requirements } = workspace;
  const readOnly = Boolean(initial.error);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    if (!configurationDirty) return;
    const protectChanges = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectChanges);
    return () => window.removeEventListener("beforeunload", protectChanges);
  }, [configurationDirty]);
  useEffect(() => {
    document.title = `${page === "administration" ? "Administration" : "Anforderungen"} · zAMBI`;
  }, [page]);
  function navigate(event: MouseEvent<HTMLAnchorElement>, next: Page) {
    event.preventDefault();
    if (page === next) return;
    if (
      configurationDirty &&
      !window.confirm(
        "Ungespeicherte Änderungen an der Konfiguration verwerfen und die Seite wechseln?",
      )
    )
      return;
    setConfigurationDirty(false);
    setPage(next);
    window.history.replaceState(
      null,
      "",
      next === "administration" ? "#administration" : "#anforderungen",
    );
    window.requestAnimationFrame(() => {
      document.getElementById("page-content")?.focus();
      window.scrollTo({ top: 0 });
    });
  }
  function persist(next: Workspace) {
    if (readOnly) return false;
    try {
      if (
        localStorage.getItem(storageKey) !== snapshot.current ||
        (snapshot.current === null &&
          localStorage.getItem(legacyStorageKey) !== initial.legacyRaw)
      ) {
        setError(
          "Die Daten wurden in einem anderen Tab geändert. Bitte sichere deine Eingabe und lade diese Seite neu, bevor du speicherst.",
        );
        return false;
      }
      if (!isWorkspace(next)) {
        setError(
          "Die Änderung ist unvollständig und wurde nicht gespeichert. Bitte prüfe Status, Rollen und Workflow-Zuweisungen.",
        );
        return false;
      }
      const raw = JSON.stringify(next);
      localStorage.setItem(storageKey, raw);
      snapshot.current = raw;
      setWorkspace(next);
      setError(null);
      return true;
    } catch {
      setError(
        "Speichern fehlgeschlagen. Der Browserspeicher ist voll oder nicht verfügbar. Deine Eingaben bleiben erhalten.",
      );
      return false;
    }
  }
  function saveRequirement(value: RequirementInput) {
    const now = new Date().toISOString();
    const current = editor?.item;
    const status = configuration.steps.find(
      (step) => step.id === value.workflowStepId,
    )!.statusId;
    const next = current
      ? requirements.map((item) =>
          item.id === current.id
            ? { ...item, ...value, status, updatedAt: now }
            : item,
        )
      : [
          ...requirements,
          {
            ...value,
            id: crypto.randomUUID(),
            number: workspace.nextNumber,
            status,
            createdAt: now,
            updatedAt: now,
          },
        ];
    if (
      !persist({
        ...workspace,
        requirements: next,
        nextNumber: workspace.nextNumber + (current ? 0 : 1),
      })
    )
      return false;
    setNotice(current ? "Änderungen gespeichert." : "Anforderung angelegt.");
    return true;
  }
  function removeRequirement() {
    if (
      !editor?.item ||
      !window.confirm(
        `„${editor.item.title}“ wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`,
      )
    )
      return;
    if (
      persist({
        ...workspace,
        requirements: requirements.filter(
          (item) => item.id !== editor.item!.id,
        ),
      })
    ) {
      setEditor(null);
      setNotice("Anforderung gelöscht.");
    }
  }
  function saveConfiguration(next: Configuration) {
    try {
      if (!persist(applyConfiguration(workspace, next))) return false;
      setConfigurationDirty(false);
      setStatusFilter("all");
      setNotice("Konfiguration gespeichert.");
      return true;
    } catch (issue) {
      setError(
        issue instanceof Error
          ? issue.message
          : "Die Konfiguration konnte nicht gespeichert werden.",
      );
      return false;
    }
  }
  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("de");
    return requirements
      .filter((item) => {
        const step = configuration.steps.find(
          (step) => step.id === item.workflowStepId,
        )!;
        return (
          (statusFilter === "all" || item.status === statusFilter) &&
          (priorityFilter === "all" || item.priority === priorityFilter) &&
          `${requirementId(item.number)} ${item.title} ${item.description} ${item.criteria} ${step.name} ${roleNames(configuration, step).join(" ")}`
            .toLocaleLowerCase("de")
            .includes(text)
        );
      })
      .sort((a, b) =>
        sort === "priority"
          ? priorities.indexOf(a.priority) - priorities.indexOf(b.priority) ||
            b.number - a.number
          : sort === "title"
            ? a.title.localeCompare(b.title, "de")
            : b.number - a.number,
      );
  }, [requirements, configuration, query, statusFilter, priorityFilter, sort]);
  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
  }
  const today = () => new Date().toISOString().slice(0, 10);
  const categoryCount = (category: string) =>
    requirements.filter(
      (item) =>
        configuration.statuses.find((status) => status.id === item.status)
          ?.category === category,
    ).length;
  const completed = categoryCount("done");
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#anforderungen"
          onClick={(event) => navigate(event, "requirements")}
          aria-label="zAMBI Startseite"
        >
          <span className="brand-icon">
            <Icon name="building" size={27} />
          </span>
          <span className="brand-name">
            zAMBI<small>Bauten &amp; Immobilien</small>
          </span>
        </a>
        <p className="brand-description">
          zentrales Anforderungsmanagement
          <br />
          Bauten Immobilien
        </p>
        <div className="nav-label">Arbeitsbereich</div>
        <nav aria-label="Hauptnavigation">
          <a
            className={"nav-item " + (page === "requirements" ? "active" : "")}
            href="#anforderungen"
            aria-current={page === "requirements" ? "page" : undefined}
            onClick={(event) => navigate(event, "requirements")}
          >
            <Icon name="file" />
            Anforderungen<span className="count">{requirements.length}</span>
          </a>
          <a
            className={
              "nav-item " + (page === "administration" ? "active" : "")
            }
            href="#administration"
            aria-current={page === "administration" ? "page" : undefined}
            onClick={(event) => navigate(event, "administration")}
          >
            <Icon name="settings" />
            Administration
          </a>
        </nav>
        <div className="sidebar-footer">
          <span className="local-dot" />
          <div>
            <strong>In diesem Browser</strong>
            <p>
              Anforderungen und Konfiguration werden auf diesem Gerät
              gespeichert.
            </p>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            Bauten &amp; Immobilien <span className="breadcrumb-slash">/</span>{" "}
            <strong>
              {page === "requirements" ? "Anforderungen" : "Administration"}
            </strong>
          </span>
          <span className="local-label">
            <span className="local-dot" />
            Lokale Arbeitsversion
          </span>
        </header>
        <main id="page-content" tabIndex={-1}>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {page === "administration" ? (
            <Administration
              configuration={configuration}
              requirements={requirements}
              readOnly={readOnly}
              onSave={saveConfiguration}
              onDirtyChange={setConfigurationDirty}
              onExport={() => {
                downloadJson(
                  configuration,
                  `zambi-konfiguration-${today()}.json`,
                );
                setNotice("Konfiguration exportiert.");
              }}
            />
          ) : (
            <>
              <section className="page-heading">
                <div>
                  <span className="eyebrow">zAMBI · Übersicht</span>
                  <h1>Anforderungen</h1>
                  <p>
                    Bedarf erfassen. Zuständigkeiten klären. Fortschritt
                    verfolgen.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setEditor({ item: null })}
                  disabled={readOnly}
                >
                  <Icon name="plus" />
                  Neue Anforderung
                </button>
              </section>
              <section
                className="stats"
                aria-label="Übersicht der Anforderungen"
              >
                {[
                  {
                    title: "Gesamt",
                    value: requirements.length,
                    icon: "file" as const,
                    category: "total",
                    hint: "Alle Anforderungen",
                  },
                  {
                    title: "Offen",
                    value: categoryCount("open"),
                    icon: "clock" as const,
                    category: "open",
                    hint: "Noch nicht in Bearbeitung",
                  },
                  {
                    title: "In Bearbeitung",
                    value: categoryCount("active"),
                    icon: "workflow" as const,
                    category: "active",
                    hint: "Aktuell im Prozess",
                  },
                  {
                    title: "Abgeschlossen",
                    value: completed,
                    icon: "check" as const,
                    category: "done",
                    hint: requirements.length
                      ? `${Math.round((completed / requirements.length) * 100)} % aller Anforderungen`
                      : "Noch keine Abschlüsse",
                  },
                ].map((stat) => (
                  <article className="stat-card" key={stat.title}>
                    <div className="stat-top">
                      <span>{stat.title}</span>
                      <span className={"stat-icon status-" + stat.category}>
                        <Icon name={stat.icon} size={20} />
                      </span>
                    </div>
                    <strong>{stat.value}</strong>
                    <small>{stat.hint}</small>
                  </article>
                ))}
              </section>
              <section className="panel" aria-labelledby="list-heading">
                <div className="panel-heading">
                  <div>
                    <h2 id="list-heading">
                      Meine Anforderungen{" "}
                      <span className="count">{requirements.length}</span>
                    </h2>
                    <p>
                      Workflow-Schritt, Status und Zuständigkeit auf einen
                      Blick.
                    </p>
                  </div>
                  <button
                    className="button secondary"
                    disabled={!requirements.length || readOnly}
                    onClick={() => {
                      downloadJson(
                        exportRequirements(workspace),
                        `zambi-anforderungen-${today()}.json`,
                      );
                      setNotice("Anforderungen exportiert.");
                    }}
                  >
                    <Icon name="download" size={18} />
                    Daten exportieren
                  </button>
                </div>
                <div className="toolbar">
                  <label className="search-label">
                    Suche
                    <div className="search">
                      <Icon name="search" />
                      <input
                        aria-label="Anforderungen durchsuchen"
                        value={query}
                        placeholder="Titel, Nummer, Rolle oder Schritt …"
                        onChange={(event) => setQuery(event.target.value)}
                      />
                      {query && (
                        <button
                          className="icon-button"
                          onClick={() => setQuery("")}
                          aria-label="Suche leeren"
                        >
                          <Icon name="close" size={17} />
                        </button>
                      )}
                    </div>
                  </label>
                  <label>
                    Status
                    <select
                      aria-label="Nach Status filtern"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <option value="all">Alle Status</option>
                      {configuration.statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Priorität
                    <select
                      aria-label="Nach Priorität filtern"
                      value={priorityFilter}
                      onChange={(event) =>
                        setPriorityFilter(event.target.value)
                      }
                    >
                      <option value="all">Alle Prioritäten</option>
                      {priorities.map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="list-meta">
                  <span>
                    {visible.length}{" "}
                    {visible.length === 1 ? "Anforderung" : "Anforderungen"}
                    {visible.length !== requirements.length
                      ? ` von ${requirements.length}`
                      : ""}
                  </span>
                  <label>
                    Sortierung
                    <select
                      aria-label="Sortierung"
                      value={sort}
                      onChange={(event) => setSort(event.target.value)}
                    >
                      <option value="newest">Neueste zuerst</option>
                      <option value="priority">Priorität</option>
                      <option value="title">Titel A–Z</option>
                    </select>
                  </label>
                </div>
                {visible.length ? (
                  <div className="table-scroll">
                    <table className="requirements-table">
                      <thead>
                        <tr>
                          <th>Anforderung</th>
                          <th>Workflow &amp; Zuständigkeit</th>
                          <th>Status</th>
                          <th>Priorität</th>
                          <th>Aktualisiert</th>
                          <th>
                            <span className="sr-only">Bearbeiten</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((item) => {
                          const step = configuration.steps.find(
                            (step) => step.id === item.workflowStepId,
                          )!;
                          const status = configuration.statuses.find(
                            (status) => status.id === item.status,
                          )!;
                          return (
                            <tr key={item.id}>
                              <td className="requirement-cell">
                                <button
                                  className="requirement-title"
                                  onClick={() => setEditor({ item })}
                                  disabled={readOnly}
                                >
                                  <span className="requirement-number">
                                    {requirementId(item.number)}
                                  </span>
                                  <strong>{item.title}</strong>
                                </button>
                                <p className="requirement-description">
                                  {item.description ||
                                    "Noch keine Beschreibung"}
                                </p>
                              </td>
                              <td data-label="Workflow">
                                <strong className="step-title">
                                  {step.name}
                                </strong>
                                <span className="role-summary">
                                  {roleNames(configuration, step).join(", ")}
                                </span>
                              </td>
                              <td data-label="Status">
                                <span
                                  className={
                                    "status-badge status-" + status.category
                                  }
                                >
                                  <span />
                                  {status.name}
                                </span>
                              </td>
                              <td data-label="Priorität">
                                <span
                                  className={
                                    "priority priority-" +
                                    priorities.indexOf(item.priority)
                                  }
                                >
                                  <span className="priority-dot" />
                                  {item.priority}
                                </span>
                              </td>
                              <td
                                data-label="Aktualisiert"
                                className="date-cell"
                              >
                                {new Intl.DateTimeFormat("de-CH", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }).format(new Date(item.updatedAt))}
                              </td>
                              <td className="edit-cell">
                                <button
                                  className="icon-button"
                                  aria-label={
                                    requirementId(item.number) + " bearbeiten"
                                  }
                                  onClick={() => setEditor({ item })}
                                  disabled={readOnly}
                                >
                                  <Icon name="arrow" size={19} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">
                      <Icon
                        name={requirements.length ? "search" : "building"}
                        size={32}
                      />
                    </span>
                    <h3>
                      {requirements.length
                        ? "Keine passenden Anforderungen"
                        : "Dein Vorhaben beginnt mit einer Anforderung."}
                    </h3>
                    <p>
                      {requirements.length
                        ? "Passe die Suche oder die Filter an."
                        : "Erfasse den Bedarf für Bauten und Immobilien. Status und zuständige Rollen ergeben sich aus deinem Workflow."}
                    </p>
                    {requirements.length ? (
                      <button
                        className="button secondary"
                        onClick={resetFilters}
                      >
                        Filter zurücksetzen
                      </button>
                    ) : (
                      <button
                        className="button primary"
                        disabled={readOnly}
                        onClick={() => setEditor({ item: null })}
                      >
                        <Icon name="plus" size={18} />
                        Erste Anforderung anlegen
                      </button>
                    )}
                  </div>
                )}
                <footer className="panel-footer">
                  <span className="local-dot" />
                  Deine Daten bleiben in diesem Browser. Sichere sie regelmäßig
                  über den Export.
                </footer>
              </section>
            </>
          )}
          <footer className="page-footer">
            <strong>zAMBI</strong>
            <span>zentrales Anforderungsmanagement Bauten Immobilien</span>
          </footer>
        </main>
      </div>
      <div className="toast-region" role="status" aria-live="polite">
        {notice && (
          <div className="toast">
            <Icon name="check" size={18} />
            {notice}
          </div>
        )}
      </div>
      {editor && (
        <RequirementEditor
          item={editor.item}
          configuration={configuration}
          error={error}
          onClose={() => setEditor(null)}
          onSave={saveRequirement}
          onDelete={removeRequirement}
        />
      )}
    </div>
  );
}
