export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(remainder).padStart(2, "0");
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${minutes}:${ss}`;
}

const timeZone = "UTC";

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(new Date(iso));
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}

export function formatDue(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(iso));
}

export function nextPlayhead(
  time: number,
  delta: number,
  segments: { startSec: number; endSec: number }[],
  end: number,
): number {
  const index = activeSegmentIndex(segments, time);
  const linear = Math.min(end, time + delta);
  if (index < 0) return linear;
  const current = segments[index];
  const following = segments[index + 1];
  const gap = following ? following.startSec - current.endSec : 0;
  if (following && gap > 1.5 && linear >= current.endSec) return Math.min(end, following.startSec);
  return linear;
}

export function activeSegmentIndex(
  segments: { startSec: number }[],
  time: number,
): number {
  let index = -1;
  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i].startSec <= time + 0.05) index = i;
    else break;
  }
  return index;
}
