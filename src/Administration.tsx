import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "./Icon";
import { categories, categoryLabels, configurationErrors } from "./model";
import type { Category, Configuration, Requirement } from "./model";

type Tab = "statuses" | "roles" | "workflow";
export function Administration({
  configuration,
  requirements,
  readOnly,
  onSave,
  onDirtyChange,
  onExport,
}: {
  configuration: Configuration;
  requirements: Requirement[];
  readOnly: boolean;
  onSave: (configuration: Configuration) => boolean;
  onDirtyChange: (dirty: boolean) => void;
  onExport: () => void;
}) {
  const [draft, setDraft] = useState(() => structuredClone(configuration));
  const [tab, setTab] = useState<Tab>("statuses");
  const [errors, setErrors] = useState<string[]>([]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(configuration);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);
  useEffect(() => {
    setDraft(structuredClone(configuration));
  }, [configuration]);
  function save(event: FormEvent) {
    event.preventDefault();
    const cleaned: Configuration = {
      statuses: draft.statuses.map((status) => ({
        ...status,
        name: status.name.trim(),
      })),
      roles: draft.roles.map((role) => ({
        ...role,
        name: role.name.trim(),
        description: role.description.trim(),
      })),
      steps: draft.steps.map((step) => ({ ...step, name: step.name.trim() })),
    };
    const issues = configurationErrors(cleaned);
    setErrors(issues);
    if (issues.length) {
      window.requestAnimationFrame(() =>
        document.getElementById("configuration-errors")?.focus(),
      );
      return;
    }
    if (onSave(cleaned)) setErrors([]);
  }
  function moveStep(index: number, direction: number) {
    setDraft((current) => {
      const steps = [...current.steps];
      [steps[index], steps[index + direction]] = [
        steps[index + direction],
        steps[index],
      ];
      return { ...current, steps };
    });
  }
  function discard() {
    if (
      !window.confirm(
        "Ungespeicherte Änderungen an der Konfiguration verwerfen?",
      )
    )
      return;
    setDraft(structuredClone(configuration));
    setErrors([]);
  }
  return (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">zAMBI verwalten</span>
          <h1>Administration</h1>
          <p>Status, Rollen und den Ablauf deiner Anforderungen gestalten.</p>
        </div>
        <button
          className="button secondary"
          onClick={onExport}
          disabled={readOnly}
        >
          <Icon name="download" size={18} />
          Konfiguration exportieren
        </button>
      </section>
      <div className="info-banner">
        <Icon name="settings" />
        <p>
          <strong>Konfiguration für diesen Browser.</strong> Rollen beschreiben
          Zuständigkeiten im Workflow. Benutzerkonten und geschützte
          Zugriffsrechte sind in dieser Version noch nicht eingerichtet.
        </p>
      </div>
      <nav className="admin-tabs" aria-label="Administrationsbereiche">
        {(
          [
            ["statuses", "Status", draft.statuses.length],
            ["roles", "Rollen", draft.roles.length],
            ["workflow", "Workflow-Editor", draft.steps.length],
          ] as const
        ).map(([value, title, count]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            className={tab === value ? "selected" : ""}
            onClick={() => setTab(value)}
          >
            {title}
            <span className="count">{count}</span>
          </button>
        ))}
      </nav>
      <form onSubmit={save}>
        {errors.length > 0 && (
          <div
            id="configuration-errors"
            className="error-message"
            role="alert"
            tabIndex={-1}
          >
            <strong>Bitte prüfe die Konfiguration.</strong>
            <ul>
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}
        <fieldset className="admin-fields" disabled={readOnly}>
          {tab === "statuses" && (
            <section
              className="panel admin-panel"
              aria-labelledby="status-heading"
            >
              <div className="panel-heading">
                <div>
                  <h2 id="status-heading">Status verwalten</h2>
                  <p>
                    Die Gruppe bestimmt, wie ein Status in der Übersicht gezählt
                    wird.
                  </p>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      statuses: [
                        ...current.statuses,
                        { id: crypto.randomUUID(), name: "", category: "open" },
                      ],
                    }))
                  }
                >
                  <Icon name="plus" size={18} />
                  Status hinzufügen
                </button>
              </div>
              <div className="config-list">
                {draft.statuses.map((status, index) => {
                  const usages = draft.steps.filter(
                    (step) => step.statusId === status.id,
                  ).length;
                  const disabled = usages > 0 || draft.statuses.length === 1;
                  return (
                    <article key={status.id} className="config-row">
                      <div
                        className={"status-indicator status-" + status.category}
                      >
                        <span />
                      </div>
                      <label className="grow">
                        Bezeichnung
                        <input
                          aria-label={"Statusname " + (index + 1)}
                          value={status.name}
                          required
                          maxLength={80}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              statuses: current.statuses.map((item) =>
                                item.id === status.id
                                  ? { ...item, name: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          placeholder="z. B. Zur Freigabe"
                        />
                      </label>
                      <label>
                        Gruppe
                        <select
                          aria-label={"Gruppe für Status " + (index + 1)}
                          value={status.category}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              statuses: current.statuses.map((item) =>
                                item.id === status.id
                                  ? {
                                      ...item,
                                      category: event.target.value as Category,
                                    }
                                  : item,
                              ),
                            }))
                          }
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {categoryLabels[category]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="row-actions">
                        <span className="usage-note">
                          {usages
                            ? `In ${usages} ${usages === 1 ? "Schritt" : "Schritten"} verwendet`
                            : "Nicht zugewiesen"}
                        </span>
                        <button
                          type="button"
                          className="icon-button danger"
                          aria-label={"Status " + (index + 1) + " löschen"}
                          disabled={disabled}
                          title={
                            disabled
                              ? "Zuerst die Statuszuweisung im Workflow ändern. Mindestens ein Status muss bleiben."
                              : "Status entfernen"
                          }
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              statuses: current.statuses.filter(
                                (item) => item.id !== status.id,
                              ),
                            }))
                          }
                        >
                          <Icon name="trash" size={19} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="panel-note">
                Du kannst Status jederzeit umbenennen. Verwendete Status lassen
                sich nach dem Ändern ihrer Zuweisungen im Workflow entfernen.
              </p>
            </section>
          )}
          {tab === "roles" && (
            <section
              className="panel admin-panel"
              aria-labelledby="roles-heading"
            >
              <div className="panel-heading">
                <div>
                  <h2 id="roles-heading">Rollen verwalten</h2>
                  <p>Beschreibe, wer im jeweiligen Schritt zuständig ist.</p>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      roles: [
                        ...current.roles,
                        { id: crypto.randomUUID(), name: "", description: "" },
                      ],
                    }))
                  }
                >
                  <Icon name="plus" size={18} />
                  Rolle hinzufügen
                </button>
              </div>
              <div className="config-list">
                {draft.roles.map((role, index) => {
                  const usages = draft.steps.filter((step) =>
                    step.roleIds.includes(role.id),
                  ).length;
                  const disabled = usages > 0 || draft.roles.length === 1;
                  return (
                    <article className="config-row role-row" key={role.id}>
                      <span className="role-icon">
                        <Icon name="users" />
                      </span>
                      <div className="grow role-fields">
                        <label>
                          Rollenname
                          <input
                            aria-label={"Rollenname " + (index + 1)}
                            value={role.name}
                            required
                            maxLength={80}
                            placeholder="z. B. Projektleitung"
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                roles: current.roles.map((item) =>
                                  item.id === role.id
                                    ? { ...item, name: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                          />
                        </label>
                        <label>
                          Aufgabe <span className="optional">(optional)</span>
                          <textarea
                            aria-label={"Aufgabe für Rolle " + (index + 1)}
                            value={role.description}
                            rows={2}
                            maxLength={500}
                            placeholder="Welche Verantwortung übernimmt diese Rolle?"
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                roles: current.roles.map((item) =>
                                  item.id === role.id
                                    ? {
                                        ...item,
                                        description: event.target.value,
                                      }
                                    : item,
                                ),
                              }))
                            }
                          />
                        </label>
                      </div>
                      <div className="row-actions">
                        <span className="usage-note">
                          {usages
                            ? `In ${usages} ${usages === 1 ? "Schritt" : "Schritten"} verwendet`
                            : "Nicht zugewiesen"}
                        </span>
                        <button
                          type="button"
                          className="icon-button danger"
                          aria-label={"Rolle " + (index + 1) + " löschen"}
                          disabled={disabled}
                          title={
                            disabled
                              ? "Zuerst die Rollenzuweisungen im Workflow ändern. Mindestens eine Rolle muss bleiben."
                              : "Rolle entfernen"
                          }
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              roles: current.roles.filter(
                                (item) => item.id !== role.id,
                              ),
                            }))
                          }
                        >
                          <Icon name="trash" size={19} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {tab === "workflow" && (
            <section
              className="panel admin-panel"
              aria-labelledby="workflow-heading"
            >
              <div className="panel-heading">
                <div>
                  <h2 id="workflow-heading">Workflow-Editor</h2>
                  <p>
                    Lege Reihenfolge, Status und zuständige Rollen für jeden
                    Schritt fest.
                  </p>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      steps: [
                        ...current.steps,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          statusId: current.statuses[0].id,
                          roleIds: [],
                        },
                      ],
                    }))
                  }
                >
                  <Icon name="plus" size={18} />
                  Schritt hinzufügen
                </button>
              </div>
              <ol className="workflow-list">
                {draft.steps.map((step, index) => {
                  const used = requirements.filter(
                    (item) => item.workflowStepId === step.id,
                  ).length;
                  return (
                    <li key={step.id} className="workflow-card">
                      <div
                        className="step-number"
                        aria-label={"Schritt " + (index + 1)}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="step-content">
                        <div className="step-heading">
                          <label className="grow">
                            Schrittname
                            <input
                              aria-label={"Schrittname " + (index + 1)}
                              required
                              maxLength={80}
                              value={step.name}
                              placeholder="z. B. Fachliche Prüfung"
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  steps: current.steps.map((item) =>
                                    item.id === step.id
                                      ? { ...item, name: event.target.value }
                                      : item,
                                  ),
                                }))
                              }
                            />
                          </label>
                          <div className="step-actions">
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={
                                "Schritt " + (index + 1) + " nach oben"
                              }
                              disabled={index === 0}
                              onClick={() => moveStep(index, -1)}
                            >
                              <Icon name="up" size={18} />
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={
                                "Schritt " + (index + 1) + " nach unten"
                              }
                              disabled={index === draft.steps.length - 1}
                              onClick={() => moveStep(index, 1)}
                            >
                              <Icon name="down" size={18} />
                            </button>
                            <button
                              type="button"
                              className="icon-button danger"
                              aria-label={"Schritt " + (index + 1) + " löschen"}
                              disabled={used > 0 || draft.steps.length === 1}
                              title={
                                used
                                  ? "Bestehende Anforderungen zuerst einem anderen Schritt zuweisen."
                                  : "Schritt entfernen"
                              }
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  steps: current.steps.filter(
                                    (item) => item.id !== step.id,
                                  ),
                                }))
                              }
                            >
                              <Icon name="trash" size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="step-assignments">
                          <label>
                            Zugewiesener Status
                            <select
                              aria-label={"Status für Schritt " + (index + 1)}
                              value={step.statusId}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  steps: current.steps.map((item) =>
                                    item.id === step.id
                                      ? {
                                          ...item,
                                          statusId: event.target.value,
                                        }
                                      : item,
                                  ),
                                }))
                              }
                            >
                              {draft.statuses.map((status) => (
                                <option key={status.id} value={status.id}>
                                  {status.name || "Status ohne Namen"}
                                </option>
                              ))}
                            </select>
                          </label>
                          <fieldset className="role-picker">
                            <legend>
                              Zuständige Rollen{" "}
                              <span className="required">*</span>
                            </legend>
                            {draft.roles.map((role) => (
                              <label className="checkbox-label" key={role.id}>
                                <input
                                  type="checkbox"
                                  checked={step.roleIds.includes(role.id)}
                                  onChange={(event) =>
                                    setDraft((current) => ({
                                      ...current,
                                      steps: current.steps.map((item) =>
                                        item.id === step.id
                                          ? {
                                              ...item,
                                              roleIds: event.target.checked
                                                ? [...item.roleIds, role.id]
                                                : item.roleIds.filter(
                                                    (id) => id !== role.id,
                                                  ),
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                />
                                {role.name || "Rolle ohne Namen"}
                              </label>
                            ))}
                          </fieldset>
                        </div>
                        <p className="step-note">
                          {used
                            ? `${used} ${used === 1 ? "Anforderung befindet" : "Anforderungen befinden"} sich in diesem Schritt.`
                            : "Noch keine Anforderungen in diesem Schritt."}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <p className="panel-note">
                Neue Anforderungen starten im ersten Schritt. Eine neue
                Statuszuweisung gilt nach dem Speichern auch für bestehende
                Anforderungen in diesem Schritt.
              </p>
            </section>
          )}
        </fieldset>
        <footer className="configuration-footer">
          <span className={dirty ? "dirty-label" : "saved-label"}>
            {dirty ? "Ungespeicherte Änderungen" : "Konfiguration gespeichert"}
          </span>
          <div className="button-row">
            <button
              type="button"
              className="button secondary"
              disabled={!dirty || readOnly}
              onClick={discard}
            >
              Änderungen verwerfen
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={!dirty || readOnly}
            >
              <Icon name="check" size={18} />
              Konfiguration speichern
            </button>
          </div>
        </footer>
      </form>
    </>
  );
}
