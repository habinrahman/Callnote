"use client";

import { formatClock } from "@/lib/domain/format";

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
  time,
  start,
  end,
  playing,
  rate,
  onToggle,
  onSeek,
  onRate,
}: {
  seed: string;
  time: number;
  start: number;
  end: number;
  playing: boolean;
  rate: number;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  onRate: (rate: number) => void;
}) {
  const span = Math.max(end - start, 0.1);
  const progress = Math.min(1, Math.max(0, (time - start) / span));
  const waveform = bars(seed);

  return (
    <section className="rounded-lg border border-line bg-[#241f1b] p-4 text-[#f6f1e8]" aria-label="Recording">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-[#c9bfb2]">
        <span>Demo recording</span>
        <span className="tabular-nums">
          {formatClock(time)} / {formatClock(end)}
        </span>
      </div>
      <div className="flex h-16 items-end gap-[2px]" aria-hidden="true">
        {waveform.map((height, index) => {
          const played = index / waveform.length < progress;
          return (
            <span
              key={index}
              className={played ? "bg-[#8fd0c2]" : "bg-[#4a433c]"}
              style={{ height: `${height}%`, width: "100%" }}
            />
          );
        })}
      </div>
      <label className="mt-3 block">
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
          className="rounded-md bg-[#f6f1e8] px-3 py-1.5 text-sm font-medium text-[#241f1b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fd0c2]"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <div className="ml-auto flex gap-1" role="group" aria-label="Playback speed">
          {[1, 4, 8].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rate === value}
              onClick={() => onRate(value)}
              className={`rounded px-2 py-1 text-xs tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8fd0c2] ${
                rate === value ? "bg-[#8fd0c2] text-[#143f36]" : "text-[#c9bfb2]"
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
