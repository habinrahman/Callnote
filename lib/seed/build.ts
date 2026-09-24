import type {
  ActionItem,
  Clip,
  Decision,
  Highlight,
  Moment,
  Speaker,
  Topic,
  TranscriptSegment,
} from "@/lib/domain/types";

export type Line = { speakerId: string; text: string };

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function spokenSeconds(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.min(18, Math.max(4, words * 0.42));
}

export function layOut(meetingId: string, durationSec: number, lines: Line[]): TranscriptSegment[] {
  const weights = lines.map((line) => spokenSeconds(line.text));
  const spoken = weights.reduce((sum, weight) => sum + weight, 0);
  const gap =
    lines.length > 1 ? Math.max(0, durationSec - spoken) / (lines.length - 1) : 0;
  let cursor = 0;
  return lines.map((line, index) => {
    const startSec = round1(cursor);
    const endSec = round1(Math.min(durationSec, cursor + weights[index]));
    cursor += weights[index] + gap;
    return {
      id: `${meetingId}-t${index + 1}`,
      speakerId: line.speakerId,
      startSec,
      endSec,
      text: line.text,
    };
  });
}

export function highlightFrom(
  meetingId: string,
  segments: TranscriptSegment[],
  index: number,
  label: string,
): Highlight {
  const segment = segments[index];
  return {
    id: `${meetingId}-h${index + 1}`,
    startSec: segment.startSec,
    endSec: segment.endSec,
    label,
    speakerId: segment.speakerId,
    excerpt: segment.text,
  };
}

export function clipFrom(
  id: string,
  title: string,
  note: string,
  segments: TranscriptSegment[],
  startIndex: number,
  endIndex: number,
): Clip {
  return {
    id,
    title,
    note,
    startSec: segments[startIndex].startSec,
    endSec: segments[endIndex].endSec,
  };
}

export function speaker(id: string, name: string, role: string): Speaker {
  return { id, name, role };
}

export function topic(
  id: string,
  label: string,
  detail: string,
  timestampSec: number,
): Topic {
  return { id, label, detail, timestampSec };
}

export function decision(id: string, text: string, timestampSec: number): Decision {
  return { id, text, timestampSec };
}

export function moment(
  id: string,
  label: string,
  timestampSec: number,
  excerpt: string,
): Moment {
  return { id, label, timestampSec, excerpt };
}

export function action(
  id: string,
  task: string,
  owner: string,
  dueDate: string | null,
  timestampSec: number,
  done = false,
): ActionItem {
  return { id, task, owner, dueDate, timestampSec, done };
}
