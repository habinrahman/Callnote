/**
 * Deterministic meeting intelligence.
 * A later model call can replace `sectionsFor` without changing the meeting UI,
 * as long as it returns the same section kinds. Nothing here calls a model.
 */

export type StructureId = "general" | "incident" | "sales" | "discovery" | "interview";

export type PresentedSection = {
  id: string;
  label: string;
  kind: "prose" | "points" | "actions" | "topics" | "list" | "moments";
  skip?: number;
  take?: number;
};

const structures: Record<StructureId, PresentedSection[]> = {
  general: [
    { id: "summary", label: "Executive summary", kind: "prose" },
    { id: "decisions", label: "Decisions", kind: "points" },
    { id: "actions", label: "Action items", kind: "actions" },
    { id: "topics", label: "Key topics", kind: "topics" },
    { id: "follow", label: "Follow-ups", kind: "list" },
  ],
  incident: [
    { id: "summary", label: "Incident summary", kind: "prose" },
    { id: "impact", label: "Customer impact", kind: "topics", take: 1 },
    { id: "cause", label: "Root cause", kind: "topics", skip: 1, take: 1 },
    { id: "timeline", label: "Timeline", kind: "moments" },
    { id: "signals", label: "Technical signals", kind: "points", take: 2 },
    { id: "mitigations", label: "Mitigations", kind: "actions" },
    { id: "follow", label: "Follow-ups", kind: "list" },
  ],
  sales: [
    { id: "summary", label: "Executive summary", kind: "prose" },
    { id: "needs", label: "Customer needs", kind: "topics", take: 1 },
    { id: "pain", label: "Pain points", kind: "topics", skip: 1, take: 1 },
    { id: "objections", label: "Objections", kind: "points", take: 1 },
    { id: "opportunities", label: "Opportunities", kind: "list" },
    { id: "next", label: "Next steps", kind: "actions" },
  ],
  discovery: [
    { id: "context", label: "Customer context", kind: "prose" },
    { id: "problems", label: "Problems", kind: "topics", take: 1 },
    { id: "workflow", label: "Current workflow", kind: "topics", skip: 1, take: 1 },
    { id: "pain", label: "Pain points", kind: "points", take: 1 },
    { id: "requirements", label: "Requirements", kind: "topics", skip: 2 },
    { id: "questions", label: "Open questions", kind: "list", take: 1 },
    { id: "follow", label: "Follow-ups", kind: "actions" },
  ],
  interview: [
    { id: "summary", label: "Candidate summary", kind: "prose" },
    { id: "experience", label: "Experience discussed", kind: "topics" },
    { id: "strengths", label: "Strengths", kind: "points", take: 1 },
    { id: "concerns", label: "Concerns", kind: "list" },
    { id: "signals", label: "Technical signals", kind: "points", skip: 1 },
    { id: "questions", label: "Questions", kind: "moments" },
    { id: "next", label: "Recommendation", kind: "actions" },
  ],
};

export function sectionsFor(structure: StructureId): PresentedSection[] {
  return structures[structure];
}

export function structureFromTemplate(templateId: string): StructureId {
  if (templateId === "incident") return "incident";
  if (templateId === "sales") return "sales";
  if (templateId === "discovery") return "discovery";
  if (templateId === "interview") return "interview";
  return "general";
}

export function sliceSection<T>(items: T[], section: PresentedSection): T[] {
  const start = section.skip ?? 0;
  const sliced = items.slice(start);
  return section.take === undefined ? sliced : sliced.slice(0, section.take);
}
