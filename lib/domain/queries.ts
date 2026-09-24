import { meetings } from "@/lib/seed/meetings";
import type { ClipView, Meeting, MeetingSummary, SearchHit } from "@/lib/domain/types";

function toSummary(meeting: Meeting): MeetingSummary {
  const openActionCount = meeting.actionItems.filter((item) => !item.done).length;
  return {
    id: meeting.id,
    title: meeting.title,
    startedAt: meeting.startedAt,
    durationSec: meeting.durationSec,
    status: meeting.status,
    participants: meeting.speakers.map((speaker) => speaker.name),
    preview: meeting.preview,
    openActionCount,
    actionCount: meeting.actionItems.length,
  };
}

export function listMeetings(): MeetingSummary[] {
  return meetings
    .map(toSummary)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export function listClipIds(): string[] {
  return meetings.flatMap((meeting) => meeting.clips.map((clip) => clip.id));
}

export function getMeeting(id: string): Meeting | null {
  return meetings.find((meeting) => meeting.id === id) ?? null;
}

export function getClip(clipId: string): ClipView | null {
  for (const meeting of meetings) {
    const clip = meeting.clips.find((item) => item.id === clipId);
    if (!clip) continue;
    const segments = meeting.segments.filter(
      (segment) => segment.endSec > clip.startSec && segment.startSec < clip.endSec,
    );
    return {
      clip,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      startedAt: meeting.startedAt,
      speakers: meeting.speakers,
      segments,
    };
  }
  return null;
}

function includes(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle);
}

function windowAround(text: string, needle: string): string {
  const lower = text.toLowerCase();
  const at = lower.indexOf(needle);
  if (at < 0) return text.slice(0, 160);
  const start = Math.max(0, at - 48);
  const end = Math.min(text.length, at + needle.length + 72);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export function searchMeetings(rawQuery: string): SearchHit[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];
  const hits: SearchHit[] = [];

  for (const meeting of meetings) {
    if (meeting.status !== "ready") continue;
    if (includes(meeting.title, query)) {
      hits.push({
        meetingId: meeting.id,
        title: meeting.title,
        startedAt: meeting.startedAt,
        kind: "title",
        snippet: meeting.preview,
        timestampSec: null,
      });
    }
    for (const template of meeting.templates) {
      const blob = `${template.headline} ${template.executiveSummary} ${template.followUps.join(" ")}`;
      if (includes(blob, query)) {
        hits.push({
          meetingId: meeting.id,
          title: meeting.title,
          startedAt: meeting.startedAt,
          kind: "summary",
          snippet: windowAround(template.executiveSummary, query),
          timestampSec: null,
        });
        break;
      }
    }
    for (const item of meeting.actionItems) {
      if (!includes(item.task, query) && !includes(item.owner, query)) continue;
      hits.push({
        meetingId: meeting.id,
        title: meeting.title,
        startedAt: meeting.startedAt,
        kind: "action",
        snippet: item.task,
        timestampSec: item.timestampSec,
      });
    }
    let transcriptHits = 0;
    for (const segment of meeting.segments) {
      if (!includes(segment.text, query)) continue;
      hits.push({
        meetingId: meeting.id,
        title: meeting.title,
        startedAt: meeting.startedAt,
        kind: "transcript",
        snippet: windowAround(segment.text, query),
        timestampSec: segment.startSec,
      });
      transcriptHits += 1;
      if (transcriptHits >= 3) break;
    }
  }

  return hits;
}
