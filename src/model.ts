import { testRequirements } from "./testData.ts";

export const priorities = ["Hoch", "Mittel", "Niedrig"] as const;
export type Priority = (typeof priorities)[number];
export const categories = ["open", "active", "done"] as const;
export type Category = (typeof categories)[number];
export const categoryLabels: Record<Category, string> = {
  open: "Offen",
  active: "In Bearbeitung",
  done: "Abgeschlossen",
};
export type StatusDefinition = { id: string; name: string; category: Category };
export type Role = { id: string; name: string; description: string };
export type WorkflowStep = {
  id: string;
  name: string;
  statusId: string;
  roleIds: string[];
};
export type Configuration = {
  statuses: StatusDefinition[];
  roles: Role[];
  steps: WorkflowStep[];
};
export type Requirement = {
  id: string;
  number: number;
  anforderungNr?: string;
  verbindlichkeit?: "MUSS" | "SOLL" | "KANN";
  isTestData?: boolean;
  title: string;
  description: string;
  criteria: string;
  status: string;
  workflowStepId: string;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
};
export type RequirementInput = Pick<
  Requirement,
  "title" | "description" | "criteria" | "workflowStepId" | "priority"
>;
export type Workspace = {
  version: 1;
  configuration: Configuration;
  requirements: Requirement[];
  nextNumber: number;
  testDataVersion?: 1;
};
export const legacyStorageKey = "anforderungsmanagement.requirements.v1";
export const storageKey = "zambi.workspace.v1";

export function defaultConfiguration(): Configuration {
  return {
    statuses: [
      { id: "status-open", name: "Offen", category: "open" },
      { id: "status-active", name: "In Bearbeitung", category: "active" },
      { id: "status-done", name: "Abgeschlossen", category: "done" },
    ],
    roles: [
      {
        id: "role-requester",
        name: "Antragstellende",
        description: "Erfassen und konkretisieren Anforderungen.",
      },
      {
        id: "role-specialist",
        name: "Fachprüfung",
        description: "Prüft und bearbeitet Anforderungen fachlich.",
      },
      {
        id: "role-approval",
        name: "Freigabe",
        description: "Prüft das Ergebnis und schließt die Anforderung ab.",
      },
    ],
    steps: [
      {
        id: "step-capture",
        name: "Erfassung",
        statusId: "status-open",
        roleIds: ["role-requester"],
      },
      {
        id: "step-process",
        name: "Bearbeitung",
        statusId: "status-active",
        roleIds: ["role-specialist"],
      },
      {
        id: "step-complete",
        name: "Abschluss",
        statusId: "status-done",
        roleIds: ["role-approval"],
      },
    ],
  };
}
export function emptyWorkspace(): Workspace {
  return {
    version: 1,
    configuration: defaultConfiguration(),
    requirements: [],
    nextNumber: 1,
  };
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): value is string {
  return typeof value === "string";
}
function name(value: unknown): value is string {
  return text(value) && value.trim().length > 0 && value.length <= 80;
}
function unique(values: string[]) {
  return new Set(values).size === values.length;
}

export function configurationErrors(config: Configuration): string[] {
  const errors: string[] = [];
  const groups = [
    ["Status", config.statuses],
    ["Rollen", config.roles],
    ["Workflow-Schritte", config.steps],
  ] as const;
  for (const [label, items] of groups) {
    if (!items.length)
      errors.push(`${label}: Mindestens ein Eintrag ist erforderlich.`);
    if (items.some((item) => !name(item.name)))
      errors.push(`${label}: Bitte Namen mit 1 bis 80 Zeichen eingeben.`);
    if (!unique(items.map((item) => item.name.trim().toLocaleLowerCase("de"))))
      errors.push(`${label}: Namen müssen eindeutig sein.`);
    if (
      !unique(items.map((item) => item.id)) ||
      items.some((item) => !item.id.trim())
    )
      errors.push(`${label}: Kennungen müssen eindeutig sein.`);
  }
  for (const step of config.steps) {
    if (!config.statuses.some((status) => status.id === step.statusId))
      errors.push(
        `Schritt „${step.name || "Ohne Namen"}“: Bitte einen vorhandenen Status zuweisen.`,
      );
    if (
      !step.roleIds.length ||
      !unique(step.roleIds) ||
      step.roleIds.some((id) => !config.roles.some((role) => role.id === id))
    )
      errors.push(
        `Schritt „${step.name || "Ohne Namen"}“: Bitte mindestens eine vorhandene Rolle zuweisen.`,
      );
  }
  if (config.roles.some((role) => role.description.length > 500))
    errors.push("Rollenbeschreibungen dürfen höchstens 500 Zeichen enthalten.");
  if (config.statuses.some((status) => !categories.includes(status.category)))
    errors.push("Bitte jedem Status eine gültige Gruppe zuweisen.");
  return errors;
}
export function isConfiguration(value: unknown): value is Configuration {
  if (
    !record(value) ||
    !Array.isArray(value.statuses) ||
    !Array.isArray(value.roles) ||
    !Array.isArray(value.steps)
  )
    return false;
  if (
    !value.statuses.every(
      (item) =>
        record(item) &&
        text(item.id) &&
        text(item.name) &&
        categories.includes(item.category as Category),
    )
  )
    return false;
  if (
    !value.roles.every(
      (item) =>
        record(item) &&
        text(item.id) &&
        text(item.name) &&
        text(item.description),
    )
  )
    return false;
  if (
    !value.steps.every(
      (item) =>
        record(item) &&
        text(item.id) &&
        text(item.name) &&
        text(item.statusId) &&
        Array.isArray(item.roleIds) &&
        item.roleIds.every(text),
    )
  )
    return false;
  return configurationErrors(value as Configuration).length === 0;
}
function isBaseRequirement(
  value: unknown,
): value is Omit<Requirement, "workflowStepId"> & { workflowStepId?: string } {
  if (!record(value)) return false;
  return (
    (value.anforderungNr === undefined || name(value.anforderungNr)) &&
    (value.verbindlichkeit === undefined || ["MUSS", "SOLL", "KANN"].includes(String(value.verbindlichkeit))) &&
    (value.isTestData === undefined || typeof value.isTestData === "boolean") &&
    text(value.id) &&
    value.id.trim().length > 0 &&
    Number.isSafeInteger(value.number) &&
    Number(value.number) > 0 &&
    text(value.title) &&
    value.title.trim().length > 0 &&
    value.title.length <= 160 &&
    text(value.description) &&
    text(value.criteria) &&
    text(value.status) &&
    priorities.includes(value.priority as Priority) &&
    text(value.createdAt) &&
    Number.isFinite(Date.parse(value.createdAt)) &&
    text(value.updatedAt) &&
    Number.isFinite(Date.parse(value.updatedAt))
  );
}
export function isWorkspace(value: unknown): value is Workspace {
  if (
    !record(value) ||
    value.version !== 1 ||
    (value.testDataVersion !== undefined && value.testDataVersion !== 1) ||
    !isConfiguration(value.configuration) ||
    !Array.isArray(value.requirements)
  )
    return false;
  const config = value.configuration;
  if (
    !value.requirements.every(
      (item) =>
        isBaseRequirement(item) &&
        text(item.workflowStepId) &&
        config.steps.some(
          (step) =>
            step.id === item.workflowStepId && step.statusId === item.status,
        ),
    )
  )
    return false;
  const requirements = value.requirements as Requirement[];
  return (
    unique(requirements.flatMap((item) => item.anforderungNr ? [item.anforderungNr] : [])) &&
    unique(requirements.map((item) => item.id)) &&
    unique(requirements.map((item) => String(item.number))) &&
    Number.isSafeInteger(value.nextNumber) &&
    Number(value.nextNumber) > 0 &&
    requirements.every((item) => item.number < Number(value.nextNumber))
  );
}
export function migrateLegacy(data: unknown): Workspace {
  if (!Array.isArray(data) || !data.every(isBaseRequirement))
    throw new Error("Ungültige bisherige Anforderungen");
  const workspace = emptyWorkspace();
  workspace.requirements = data.map((item) => {
    const status = workspace.configuration.statuses.find(
      (status) => status.name === item.status,
    );
    const step = workspace.configuration.steps.find(
      (step) => step.statusId === status?.id,
    );
    if (!status || !step) throw new Error("Unbekannter bisheriger Status");
    return { ...item, status: status.id, workflowStepId: step.id };
  });
  workspace.nextNumber = workspace.requirements.reduce(
    (next, item) => Math.max(next, item.number + 1),
    1,
  );
  if (!isWorkspace(workspace))
    throw new Error("Ungültige bisherige Anforderungen");
  return workspace;
}
export type LoadResult = {
  workspace: Workspace;
  error: string | null;
  raw: string | null;
  legacyRaw: string | null;
  migrated: boolean;
};
export function loadWorkspace(
  storage: Pick<Storage, "getItem"> = localStorage,
): LoadResult {
  let raw: string | null = null;
  let legacyRaw: string | null = null;
  try {
    raw = storage.getItem(storageKey);
    if (raw !== null) {
      const workspace: unknown = JSON.parse(raw);
      if (!isWorkspace(workspace)) throw new Error("Ungültige zAMBI-Daten");
      return { workspace, error: null, raw, legacyRaw, migrated: false };
    }
    legacyRaw = storage.getItem(legacyStorageKey);
    const workspace =
      legacyRaw === null
        ? emptyWorkspace()
        : migrateLegacy(JSON.parse(legacyRaw));
    return {
      workspace,
      error: null,
      raw,
      legacyRaw,
      migrated: legacyRaw !== null,
    };
  } catch {
    return {
      workspace: emptyWorkspace(),
      raw,
      legacyRaw,
      migrated: false,
      error:
        "Die gespeicherten Daten konnten nicht geladen werden. Sie bleiben unverändert. Änderungen sind zum Schutz deiner Daten gesperrt. Prüfe die Browserdaten oder verwende eine zuvor exportierte Sicherung.",
    };
  }
}
export function applyConfiguration(
  workspace: Workspace,
  configuration: Configuration,
  changedAt = new Date().toISOString(),
): Workspace {
  const errors = configurationErrors(configuration);
  if (errors.length) throw new Error(errors[0]);
  const requirements = workspace.requirements.map((item) => {
    const step = configuration.steps.find(
      (step) => step.id === item.workflowStepId,
    );
    if (!step)
      throw new Error(
        "Ein Workflow-Schritt mit bestehenden Anforderungen darf nicht entfernt werden.",
      );
    return item.status === step.statusId
      ? item
      : { ...item, status: step.statusId, updatedAt: changedAt };
  });
  return { ...workspace, configuration, requirements };
}
export function requirementId(number: number) {
  return `ANF-${String(number).padStart(3, "0")}`;
}
export function roleNames(config: Configuration, step: WorkflowStep) {
  return step.roleIds.map(
    (id) =>
      config.roles.find((role) => role.id === id)?.name ?? "Unbekannte Rolle",
  );
}
export function exportRequirements(workspace: Workspace) {
  return workspace.requirements.map((item) => {
    const step = workspace.configuration.steps.find(
      (step) => step.id === item.workflowStepId,
    )!;
    return {
      ...item,
      status: workspace.configuration.statuses.find(
        (status) => status.id === item.status,
      )!.name,
      workflowStep: step.name,
      roles: roleNames(workspace.configuration, step),
    };
  });
}

/** Ergänzt nur fehlende AF-Nummern; vorhandene Inhalte werden nie überschrieben. */
export function seedTestRequirements(workspace: Workspace, now = new Date().toISOString()): Workspace {
  const existing = new Set(workspace.requirements.map((item) => item.anforderungNr));
  const missing = testRequirements.filter((item) => !existing.has(item.anforderungNr));
  if (!missing.length) return workspace.testDataVersion === 1 ? workspace : { ...workspace, testDataVersion: 1 };
  const step = workspace.configuration.steps[0];
  const additions: Requirement[] = missing.map((item, index) => ({
    anforderungNr: item.anforderungNr,
    verbindlichkeit: item.verbindlichkeit,
    title: item.title,
    id: crypto.randomUUID(),
    number: workspace.nextNumber + index,
    description: item.beschreibung,
    criteria: "",
    workflowStepId: step.id,
    status: step.statusId,
    priority: "Mittel",
    isTestData: true,
    createdAt: now,
    updatedAt: now,
  }));
  return {
    ...workspace,
    testDataVersion: 1,
    requirements: [...workspace.requirements, ...additions],
    nextNumber: workspace.nextNumber + additions.length,
  };
}
export function displayRequirementId(item: Requirement) {
  return item.anforderungNr ?? requirementId(item.number);
}

/** Einmalige Ergänzung für bestehende und neue Prototyp-Arbeitsbereiche. */
export function initializeTestRequirements(workspace: Workspace): Workspace {
  return workspace.testDataVersion === 1 ? workspace : seedTestRequirements(workspace);
}
