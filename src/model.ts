export const statuses = ["Offen", "In Bearbeitung", "Abgeschlossen"] as const;
export const priorities = ["Hoch", "Mittel", "Niedrig"] as const;
export type Status = (typeof statuses)[number];
export type Priority = (typeof priorities)[number];
export type Requirement = {
  id: string;
  number: number;
  title: string;
  description: string;
  criteria: string;
  status: Status;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
};
export type RequirementInput = Pick<
  Requirement,
  "title" | "description" | "criteria" | "status" | "priority"
>;
export const storageKey = "anforderungsmanagement.requirements.v1";

export function isRequirement(value: unknown): value is Requirement {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    Number.isSafeInteger(item.number) &&
    Number(item.number) > 0 &&
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    typeof item.description === "string" &&
    typeof item.criteria === "string" &&
    statuses.includes(item.status as Status) &&
    priorities.includes(item.priority as Priority) &&
    typeof item.createdAt === "string" &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    typeof item.updatedAt === "string" &&
    Number.isFinite(Date.parse(item.updatedAt))
  );
}

export function loadRequirements(): {
  items: Requirement[];
  error: string | null;
} {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return { items: [], error: null };
    const data: unknown = JSON.parse(raw);
    if (
      !Array.isArray(data) ||
      !data.every(isRequirement) ||
      new Set(data.map((item) => item.id)).size !== data.length ||
      new Set(data.map((item) => item.number)).size !== data.length
    )
      throw new Error("Invalid data");
    return { items: data, error: null };
  } catch {
    return {
      items: [],
      error:
        "Die gespeicherten Daten konnten nicht geladen werden. Sie wurden nicht überschrieben. Prüfe die Browser-Einstellungen oder sichere die vorhandenen Browserdaten.",
    };
  }
}

export function requirementId(number: number) {
  return `ANF-${String(number).padStart(3, "0")}`;
}
