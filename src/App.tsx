import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  loadRequirements,
  priorities,
  requirementId,
  statuses,
  storageKey,
} from "./model";
import type { Priority, Requirement, RequirementInput, Status } from "./model";

function Icon({
  name,
  size = 20,
}: {
  name:
    | "grid"
    | "plus"
    | "search"
    | "arrow"
    | "file"
    | "check"
    | "clock"
    | "close"
    | "trash"
    | "download";
  size?: number;
}) {
  const paths = {
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    plus: "M12 5v14 M5 12h14",
    search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    arrow: "M5 12h14 M13 6l6 6-6 6",
    file: "M14 2H5v20h14V7z M14 2v6h5 M8 12h8 M8 16h6",
    check: "M5 12l4 4L19 6",
    clock: "M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    close: "M6 6l12 12 M6 18L18 6",
    trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
    download: "M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

function RequirementEditor({
  item,
  error,
  onClose,
  onSave,
  onDelete,
}: {
  item: Requirement | null;
  error: string | null;
  onClose: () => void;
  onSave: (value: RequirementInput) => boolean;
  onDelete: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [criteria, setCriteria] = useState(item?.criteria ?? "");
  const [status, setStatus] = useState<Status>(item?.status ?? "Offen");
  const [priority, setPriority] = useState<Priority>(
    item?.priority ?? "Mittel",
  );
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => node.close();
  }, []);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      const input = dialog.current!.querySelector("input")!;
      input.setCustomValidity("Bitte gib einen Titel ein.");
      input.reportValidity();
      return;
    }
    if (
      onSave({
        title: title.trim(),
        description: description.trim(),
        criteria: criteria.trim(),
        status,
        priority,
      })
    )
      onClose();
  }
  return (
    <dialog
      ref={dialog}
      className="editor"
      onCancel={onClose}
      aria-labelledby="editor-title"
    >
      <form onSubmit={submit}>
        <div className="editor-header">
          <div>
            <span className="eyebrow">
              {item ? requirementId(item.number) : "VON DER IDEE ZUR UMSETZUNG"}
            </span>
            <h2 id="editor-title">
              {item ? "Anforderung bearbeiten" : "Neue Anforderung"}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Schließen"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="editor-fields">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          <label>
            Titel <span className="required">*</span>
            <input
              autoFocus
              required
              maxLength={160}
              value={title}
              onChange={(e) => {
                e.target.setCustomValidity("");
                setTitle(e.target.value);
              }}
              placeholder="Was soll umgesetzt werden?"
            />
          </label>
          <label>
            Beschreibung
            <textarea
              rows={4}
              maxLength={10000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe das Ziel und den gewünschten Nutzen …"
            />
          </label>
          <div className="field-row">
            <label>
              Status
              <select
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                {statuses.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Priorität
              <select
                aria-label="Priorität"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {priorities.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Akzeptanzkriterien
            <textarea
              rows={3}
              maxLength={10000}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Wann ist diese Anforderung erfüllt?"
            />
          </label>
          <p className="field-hint">
            * Pflichtfeld · Speicherung lokal in diesem Browser
          </p>
        </div>
        <div className="editor-footer">
          {item && (
            <button type="button" className="delete-button" onClick={onDelete}>
              <Icon name="trash" size={17} />
              Löschen
            </button>
          )}
          <div className="editor-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Abbrechen
            </button>
            <button className="button primary" type="submit">
              {item ? "Änderungen speichern" : "Anforderung anlegen"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

export function App() {
  const [initial] = useState(loadRequirements);
  const [items, setItems] = useState(initial.items);
  const [error, setError] = useState<string | null>(initial.error);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Alle");
  const [priorityFilter, setPriorityFilter] = useState("Alle");
  const [sort, setSort] = useState("newest");
  const [editor, setEditor] = useState<{ item: Requirement | null } | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  const completed = items.filter(
    (item) => item.status === "Abgeschlossen",
  ).length;
  const inProgress = items.filter(
    (item) => item.status === "In Bearbeitung",
  ).length;
  const open = items.filter((item) => item.status === "Offen").length;
  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("de");
    return items
      .filter(
        (item) =>
          (statusFilter === "Alle" || item.status === statusFilter) &&
          (priorityFilter === "Alle" || item.priority === priorityFilter) &&
          `${requirementId(item.number)} ${item.title} ${item.description} ${item.criteria}`
            .toLocaleLowerCase("de")
            .includes(text),
      )
      .sort((a, b) =>
        sort === "priority"
          ? priorities.indexOf(a.priority) - priorities.indexOf(b.priority) ||
            b.number - a.number
          : sort === "title"
            ? a.title.localeCompare(b.title, "de")
            : b.number - a.number,
      );
  }, [items, query, statusFilter, priorityFilter, sort]);
  function persist(next: Requirement[]) {
    if (initial.error) return false;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setItems(next);
      setError(null);
      return true;
    } catch {
      setError(
        "Speichern fehlgeschlagen. Der Browserspeicher ist voll oder nicht verfügbar. Deine Eingabe bleibt geöffnet.",
      );
      return false;
    }
  }
  function save(value: RequirementInput) {
    const now = new Date().toISOString();
    const current = editor?.item;
    const next = current
      ? items.map((item) =>
          item.id === current.id ? { ...item, ...value, updatedAt: now } : item,
        )
      : [
          ...items,
          {
            ...value,
            id: crypto.randomUUID(),
            number: Math.max(0, ...items.map((x) => x.number)) + 1,
            createdAt: now,
            updatedAt: now,
          },
        ];
    if (!persist(next)) return false;
    setNotice(current ? "Änderungen gespeichert." : "Anforderung angelegt.");
    return true;
  }
  function remove() {
    if (
      !editor?.item ||
      !window.confirm(
        `„${editor.item.title}“ wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.`,
      )
    )
      return;
    if (persist(items.filter((item) => item.id !== editor.item!.id))) {
      setEditor(null);
      setNotice("Anforderung gelöscht.");
    }
  }
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `anforderungen-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("JSON-Export erstellt.");
  }
  function resetFilters() {
    setQuery("");
    setStatusFilter("Alle");
    setPriorityFilter("Alle");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="./"
          aria-label="Anforderungsmanagement Startseite"
        >
          <span className="brand-icon">
            <Icon name="grid" size={21} />
          </span>
          <span>
            klar<span className="brand-dot">.</span>
            <small>Anforderungsmanagement</small>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">A</span>
          <div>
            Mein Arbeitsbereich<small>Lokales Projekt</small>
          </div>
        </div>
        <span className="nav-label">ARBEITSBEREICH</span>
        <nav aria-label="Hauptnavigation">
          <a className="nav-item active" href="#anforderungen">
            <Icon name="file" />
            Anforderungen<span>{items.length}</span>
          </a>
        </nav>
        <div className="sidebar-note">
          <span className="local-dot" />
          <strong>Dein Projekt. Dein Überblick.</strong>
          <p>Aus guten Ideen werden klare Anforderungen.</p>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">DU</span>
          <div>
            Persönlicher Bereich<small>Auf diesem Gerät</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Arbeitsbereich</span>
            <span className="breadcrumb-slash">/</span>
            <span>Anforderungen</span>
          </div>
          <span className="local-label">
            <span className="local-dot" />
            Lokal gespeichert
          </span>
        </header>
        <main id="anforderungen">
          <section className="page-heading">
            <div>
              <div className="eyebrow">KLARHEIT FÜR DEIN PROJEKT</div>
              <h1>Anforderungen</h1>
              <p>Alles, was dein Projekt voranbringt. An einem Ort.</p>
            </div>
            <button
              className="button primary new-button"
              onClick={() => setEditor({ item: null })}
              disabled={Boolean(initial.error)}
            >
              <Icon name="plus" />
              Neue Anforderung
            </button>
          </section>
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          <section className="stats" aria-label="Projektübersicht">
            {[
              {
                label: "Anforderungen gesamt",
                value: items.length,
                icon: "file" as const,
                detail: "Dein Projekt im Überblick",
                color: "green",
              },
              {
                label: "Offen",
                value: open,
                icon: "clock" as const,
                detail: "Bereit für den nächsten Schritt",
                color: "orange",
              },
              {
                label: "In Bearbeitung",
                value: inProgress,
                icon: "arrow" as const,
                detail: "Hier bewegt sich etwas",
                color: "blue",
              },
              {
                label: "Abgeschlossen",
                value: completed,
                icon: "check" as const,
                detail: items.length
                  ? `${Math.round((completed / items.length) * 100)} % aller Anforderungen`
                  : "Fortschritt beginnt mit einer Idee",
                color: "green",
              },
            ].map((stat) => (
              <article className="stat-card" key={stat.label}>
                <div className="stat-top">
                  <span>{stat.label}</span>
                  <span className={`stat-icon ${stat.color}`}>
                    <Icon name={stat.icon} size={18} />
                  </span>
                </div>
                <strong>{stat.value.toString().padStart(2, "0")}</strong>
                <small>{stat.detail}</small>
              </article>
            ))}
          </section>
          <section
            className="requirements-panel"
            aria-labelledby="list-heading"
          >
            <div className="panel-heading">
              <div>
                <h2 id="list-heading">
                  Alle Anforderungen{" "}
                  <span className="count">{items.length}</span>
                </h2>
                <p>
                  Erfasse, priorisiere und behalte den Fortschritt im Blick.
                </p>
              </div>
              <button
                className="button secondary export-button"
                onClick={exportData}
                disabled={!items.length || Boolean(initial.error)}
              >
                <Icon name="download" size={17} />
                Exportieren
              </button>
            </div>
            <div className="toolbar">
              <label className="search">
                <Icon name="search" size={19} />
                <input
                  aria-label="Anforderungen durchsuchen"
                  placeholder="Anforderungen durchsuchen …"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    className="icon-button"
                    onClick={() => setQuery("")}
                    aria-label="Suche leeren"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </label>
              <div className="filters">
                <select
                  aria-label="Nach Status filtern"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Alle">Alle Status</option>
                  {statuses.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <select
                  aria-label="Nach Priorität filtern"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="Alle">Alle Prioritäten</option>
                  {priorities.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="list-meta">
              <span>
                {visible.length}{" "}
                {visible.length === 1 ? "Anforderung" : "Anforderungen"}
                {visible.length !== items.length ? ` von ${items.length}` : ""}
              </span>
              <label>
                Sortieren nach:{" "}
                <select
                  aria-label="Sortieren nach"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Neueste zuerst</option>
                  <option value="priority">Priorität</option>
                  <option value="title">Titel A–Z</option>
                </select>
              </label>
            </div>
            {visible.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Anforderung</th>
                      <th>Status</th>
                      <th>Priorität</th>
                      <th>Aktualisiert</th>
                      <th>
                        <span className="sr-only">Aktion</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <button
                            className="requirement-title"
                            onClick={() => setEditor({ item })}
                          >
                            <span className="requirement-number">
                              {requirementId(item.number)}
                            </span>
                            <strong>{item.title}</strong>
                          </button>
                          <p className="requirement-description">
                            {item.description || "Noch keine Beschreibung"}
                          </p>
                        </td>
                        <td>
                          <span
                            className={`status-badge status-${statuses.indexOf(item.status)}`}
                          >
                            <span />
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`priority priority-${priorities.indexOf(item.priority)}`}
                          >
                            <span className="priority-bars">
                              <i />
                              <i />
                              <i />
                            </span>
                            {item.priority}
                          </span>
                        </td>
                        <td className="date-cell">
                          {new Intl.DateTimeFormat("de-CH", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(item.updatedAt))}
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={`${requirementId(item.number)} bearbeiten`}
                            onClick={() => setEditor({ item })}
                          >
                            <Icon name="arrow" size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-art">
                  <span className="art-small">
                    <Icon name="check" size={15} />
                  </span>
                  <Icon name={items.length ? "search" : "file"} size={34} />
                  <span className="art-plus">+</span>
                </div>
                <h3>
                  {items.length
                    ? "Keine passenden Anforderungen"
                    : "Jedes gute Projekt beginnt mit Klarheit."}
                </h3>
                <p>
                  {items.length
                    ? "Passe deine Suche oder die Filter an, um weitere Anforderungen zu finden."
                    : "Halte fest, was dein Projekt leisten soll. Deine erste Anforderung ist nur einen Klick entfernt."}
                </p>
                {items.length ? (
                  <button className="button secondary" onClick={resetFilters}>
                    Filter zurücksetzen
                  </button>
                ) : (
                  <button
                    className="button primary"
                    onClick={() => setEditor({ item: null })}
                    disabled={Boolean(initial.error)}
                  >
                    <Icon name="plus" size={18} />
                    Erste Anforderung anlegen
                  </button>
                )}
                <span className="empty-hint">
                  {items.length ? "" : "Ein klarer Titel ist ein guter Anfang."}
                </span>
              </div>
            )}
            <div className="panel-footer">
              <span className="local-dot" />
              Deine Daten bleiben in diesem Browser.
              <span className="footer-tip">
                Tipp: Sichere dein Projekt regelmäßig über den Export.
              </span>
            </div>
          </section>
          <footer className="page-footer">
            <span>Weniger Unklarheit. Mehr Fortschritt.</span>
            <span>klar. · Dein Anforderungsmanagement</span>
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
          error={error}
          onClose={() => setEditor(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  );
}
