import Link from "next/link";
import { formatClock } from "@/lib/domain/format";
import type { Speaker, TranscriptSegment } from "@/lib/domain/types";

const colors = ["#1d5c4d", "#8a4b2f", "#2f4f7a", "#6b3f69", "#3f6b3a", "#8a5a12"];

export function speakerColor(speakers: Speaker[], speakerId: string): string {
  const index = Math.max(0, speakers.findIndex((speaker) => speaker.id === speakerId));
  return colors[index % colors.length];
}

export function speakerName(speakers: Speaker[], speakerId: string): string {
  return speakers.find((speaker) => speaker.id === speakerId)?.name ?? "Speaker";
}

export function MarkedText({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return text;
  const at = text.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-sm bg-mark text-ink">{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
}

export function TimeButton({
  seconds,
  onSeek,
  children,
}: {
  seconds: number;
  onSeek: (seconds: number) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onSeek(seconds)}
      className="rounded text-left text-sm leading-5 text-ink hover:text-pine"
    >
      <span className="tabular-nums">{formatClock(seconds)}</span>
      <span> · {children}</span>
    </button>
  );
}

export function BackHome() {
  return (
    <Link href="/" className="text-sm text-muted hover:text-ink">
      ← All meetings
    </Link>
  );
}

export type { TranscriptSegment };
