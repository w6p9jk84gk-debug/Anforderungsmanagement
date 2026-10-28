import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "./Icon";
import { priorities, displayRequirementId, roleNames } from "./model";
import type {
  Configuration,
  Priority,
  Requirement,
  RequirementInput,
} from "./model";

export function RequirementEditor({
  item,
  configuration,
  error,
  onClose,
  onSave,
  onDelete,
}: {
  item: Requirement | null;
  configuration: Configuration;
  error: string | null;
  onClose: () => void;
  onSave: (value: RequirementInput) => boolean;
  onDelete: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [criteria, setCriteria] = useState(item?.criteria ?? "");
  const [stepId, setStepId] = useState(
    item?.workflowStepId ?? configuration.steps[0].id,
  );
  const [projectId, setProjectId] = useState(item?.projectId ?? "");
  const [priority, setPriority] = useState<Priority>(
    item?.priority ?? "Mittel",
  );
  const step = configuration.steps.find((step) => step.id === stepId)!;
  const status = configuration.statuses.find(
    (status) => status.id === step.statusId,
  )!;
  const stepIndex = configuration.steps.findIndex((step) => step.id === stepId);
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
        workflowStepId: stepId,
        priority,
        projectId: projectId || null,
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
        <header className="editor-header">
          <div>
            <span className="eyebrow">
              {item ? displayRequirementId(item) : "zAMBI · Anforderungen"}
            </span>
            <span className="prototype-label">Prototyp · Testsystem</span>
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
        </header>
        <div className="editor-fields">
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          {item?.verbindlichkeit && <p className="field-hint">Verbindlichkeit: {item.verbindlichkeit}{item.isTestData ? " · Testdaten" : ""}</p>}
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
              placeholder="Was wird für das Bau- oder Immobilienvorhaben benötigt?"
            />
          </label>
          <label>
            Projekt
            <select aria-label="Projekt" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">Ohne Projekt</option>
              {configuration.projects.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </label>
          <label>
            Beschreibung
            <textarea
              rows={3}
              maxLength={10000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ziel, Bedarf und gewünschtes Ergebnis beschreiben …"
            />
          </label>
          <div className="field-row">
            <label>
              Workflow-Schritt
              <select
                aria-label="Workflow-Schritt"
                value={stepId}
                onChange={(e) => setStepId(e.target.value)}
              >
                {configuration.steps.map((step, index) => (
                  <option key={step.id} value={step.id}>
                    {index + 1}. {step.name}
                  </option>
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
                {priorities.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="workflow-context">
            <div>
              <span className="field-caption">Zugewiesener Status</span>
              <span className={"status-badge status-" + status.category}>
                <span />
                {status.name}
              </span>
            </div>
            <div>
              <span className="field-caption">Zuständige Rollen</span>
              <strong>{roleNames(configuration, step).join(", ")}</strong>
            </div>
            {stepIndex < configuration.steps.length - 1 && (
              <button
                className="button secondary"
                type="button"
                onClick={() => setStepId(configuration.steps[stepIndex + 1].id)}
              >
                Nächster Schritt
                <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
          <label>
            Akzeptanzkriterien
            <textarea
              rows={3}
              maxLength={10000}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Welche Bedingungen müssen für die Erfüllung gegeben sein?"
            />
          </label>
          <p className="field-hint">
            * Pflichtfeld. Schritt und Status werden mit der Anforderung
            gespeichert.
          </p>
        </div>
        <footer className="editor-footer">
          {item && (
            <button type="button" className="delete-button" onClick={onDelete}>
              <Icon name="trash" size={18} />
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
            <button type="submit" className="button primary">
              {item ? "Änderungen speichern" : "Anforderung anlegen"}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
