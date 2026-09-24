/**
 * Deterministic meeting intelligence.
 * A later model call can replace `sectionsFor` without changing the meeting UI,
 * as long as it returns the same section kinds.
 */

export type StructureId = "general" | "sales" | "discovery" | "interview";

export type PresentedSection = {
  id: string;
  label: string;
  kind: "prose" | "points" | "actions" | "topics" | "list";
};

const structures: Record<StructureId, PresentedSection[]> = {
  general: [
    { id: "summary", label: "Executive summary", kind: "prose" },
    { id: "decisions", label: "Decisions", kind: "points" },
    { id: "actions", label: "Action items", kind: "actions" },
    { id: "topics", label: "Key topics", kind: "topics" },
    { id: "follow", label: "Follow-ups", kind: "list" },
  ],
  sales: [
    { id: "needs", label: "Customer needs", kind: "topics" },
    { id: "pain", label: "Pain points", kind: "prose" },
    { id: "objections", label: "Objections", kind: "points" },
    { id: "signals", label: "Buying signals", kind: "list" },
    { id: "next", label: "Next steps", kind: "actions" },
  ],
  discovery: [
    { id: "problem", label: "Problem", kind: "prose" },
    { id: "constraints", label: "Constraints", kind: "points" },
    { id: "success", label: "What success looks like", kind: "topics" },
    { id: "next", label: "Next steps", kind: "actions" },
  ],
  interview: [
    { id: "strengths", label: "Candidate strengths", kind: "prose" },
    { id: "experience", label: "Experience discussed", kind: "topics" },
    { id: "signals", label: "Technical signals", kind: "points" },
    { id: "concerns", label: "Concerns", kind: "list" },
    { id: "follow", label: "Follow-ups", kind: "actions" },
  ],
};

export function sectionsFor(structure: StructureId): PresentedSection[] {
  return structures[structure];
}

export function structureFromTemplate(templateId: string): StructureId {
  if (templateId === "sales") return "sales";
  if (templateId === "discovery") return "discovery";
  if (templateId === "interview") return "interview";
  return "general";
}
