import type { CapturedMeeting } from "@/lib/capture/db";

export type CapturedSearchHit = {
  id: string;
  title: string;
  snippet: string;
  kind: string;
};

export function searchCaptured(meetings: CapturedMeeting[], query: string): CapturedSearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: CapturedSearchHit[] = [];
  for (const meeting of meetings) {
    const fields: { kind: string; text: string }[] = [
      { kind: "Title", text: meeting.title },
      { kind: "Summary", text: meeting.notes.summary },
      { kind: "Summary", text: meeting.notes.headline },
      ...meeting.notes.decisions.map((item) => ({ kind: "Decision", text: item.text })),
      ...meeting.notes.actions.map((item) => ({ kind: "Action", text: `${item.task} ${item.owner}` })),
      ...meeting.notes.topics.map((item) => ({ kind: "Topic", text: `${item.label} ${item.detail}` })),
      ...meeting.notes.followUps.map((item) => ({ kind: "Follow-up", text: item })),
      ...meeting.highlights.map((item) => ({ kind: "Highlight", text: `${item.label} ${item.excerpt}` })),
      ...meeting.lines.map((item) => ({ kind: "Transcript", text: `${item.speaker} ${item.text}` })),
    ];
    const match = fields.find((field) => field.text.toLowerCase().includes(needle));
    if (match) hits.push({ id: meeting.id, title: meeting.title, snippet: match.text, kind: match.kind });
  }
  return hits;
}
