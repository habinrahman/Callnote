"use client";

import { formatClock } from "@/lib/domain/format";
import { IconPause, IconPlay } from "@/components/icons";

function bars(seed: string): number[] {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return Array.from({ length: 72 }, (_, index) => {
    hash = Math.imul(hash ^ (index + 1), 16777619);
    return 18 + (Math.abs(hash) % 82);
  });
}

export function PlaybackBar({
  seed,
  label,
  time,
  start,
  end,
  playing,
  rate,
  marks = [],
  onToggle,
  onSeek,
  onRate,
  status,
}: {
  seed: string;
  label: string;
  time: number;
  start: number;
  end: number;
  playing: boolean;
  rate: number;
  marks?: { at: number; label: string }[];
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  onRate: (rate: number) => void;
  status?: string;
}) {
  const span = Math.max(end - start, 0.1);
  const progress = Math.min(1, Math.max(0, (time - start) / span));
  const waveform = bars(seed);

  return (
    <section className="rounded-md border border-[#3a332c] bg-[#241f1b] px-4 py-3.5 text-[#f6f1e8] shadow-[var(--shadow-rest)]" aria-label="Recording">
      <div className="flex items-center justify-between gap-3 text-xs text-[#c9bfb2]">
        <span className="flex min-w-0 items-center gap-2">
          <span>{label}</span>
          {status ? (
            <span className="truncate" aria-live="polite">
              {status}
            </span>
          ) : null}
        </span>
        <span className="tabular-nums">
          {formatClock(time)} / {formatClock(end)}
        </span>
      </div>
      <div className="relative mt-3 h-14">
        <div className="flex h-full items-end gap-px" aria-hidden="true">
          {waveform.map((height, index) => {
            const played = index / waveform.length < progress;
            return (
              <span
                key={index}
                className={`min-w-0 flex-1 rounded-[1px] ${played ? "bg-[#8fd0c2]" : "bg-[#4a433c]"}`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        {marks.map((mark) => {
          const left = Math.min(100, Math.max(0, ((mark.at - start) / span) * 100));
          return (
            <button
              key={`${mark.label}-${mark.at}`}
              type="button"
              title={mark.label}
              onClick={() => onSeek(mark.at)}
              className="absolute bottom-0 top-0 w-4 -translate-x-1/2"
              style={{ left: `${left}%` }}
            >
              <span className="mx-auto block h-full w-px bg-[#f3e2b5]" />
              <span className="sr-only">
                {mark.label} at {formatClock(mark.at)}
              </span>
            </button>
          );
        })}
      </div>
      <label className="mt-2 block">
        <span className="sr-only">Seek</span>
        <input
          type="range"
          min={start}
          max={end}
          step={0.1}
          value={Math.min(end, Math.max(start, time))}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="w-full accent-[#8fd0c2]"
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={playing}
          aria-label={playing ? "Pause" : "Play"}
          className="grid h-10 w-10 place-items-center rounded-full bg-[#f6f1e8] text-[#241f1b]"
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <div className="ml-auto flex gap-1" role="group" aria-label="Playback speed">
          {[1, 4, 8].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rate === value}
              onClick={() => onRate(value)}
              className={`rounded px-2 py-1 text-xs tabular-nums ${
                rate === value ? "bg-[#8fd0c2] font-medium text-[#143f36]" : "text-[#c9bfb2] hover:text-[#f6f1e8]"
              }`}
            >
              {value}×
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
