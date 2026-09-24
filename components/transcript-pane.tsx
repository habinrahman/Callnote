"use client";

import { useEffect, useRef } from "react";
import { activeSegmentIndex, formatClock } from "@/lib/domain/format";
import type { Speaker, TranscriptSegment } from "@/lib/domain/types";
import { MarkedText, speakerColor, speakerName } from "@/components/bits";

export function TranscriptPane({
  speakers,
  segments,
  time,
  query,
  onQuery,
  onSeek,
}: {
  speakers: Speaker[];
  segments: TranscriptSegment[];
  time: number;
  query: string;
  onQuery: (value: string) => void;
  onSeek: (seconds: number) => void;
}) {
  const active = activeSegmentIndex(segments, time);
  const listRef = useRef<HTMLOListElement>(null);
  const needle = query.trim().toLowerCase();
  const visible = segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => !needle || segment.text.toLowerCase().includes(needle));

  useEffect(() => {
    if (needle) return;
    const node = listRef.current?.querySelector<HTMLElement>("[data-active='true']");
    node?.scrollIntoView({ block: "nearest" });
  }, [active, needle]);

  return (
    <section
      className="flex max-h-[50vh] min-h-[280px] flex-col overflow-hidden rounded-md border border-line bg-card shadow-[var(--shadow-rest)] lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:min-h-[420px]"
      aria-label="Transcript"
    >
      <div className="border-b border-line px-3 py-3">
        <label htmlFor="transcript-search" className="mb-1.5 block text-xs font-medium tracking-wide text-muted">
          Transcript
        </label>
        <input
          id="transcript-search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Find a line"
          className="w-full rounded-md border border-line bg-paper px-2.5 py-1.5 text-sm outline-none focus-visible:border-pine"
        />
        {needle ? (
          <p className="mt-2 text-xs text-muted">
            {visible.length} {visible.length === 1 ? "line" : "lines"}
          </p>
        ) : null}
      </div>
      <ol ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted">No lines match that phrase.</li>
        ) : (
          visible.map(({ segment, index }) => {
            const isActive = index === active;
            return (
              <li key={segment.id} className="border-b border-line/80 last:border-b-0">
                <button
                  type="button"
                  data-active={isActive ? "true" : "false"}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSeek(segment.startSec)}
                  className="grid w-full grid-cols-[3.4rem_minmax(0,1fr)] gap-x-3 px-3 py-2.5 text-left hover:bg-sand/70"
                >
                  <span className="pt-0.5 text-xs tabular-nums text-muted">{formatClock(segment.startSec)}</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium" style={{ color: speakerColor(speakers, segment.speakerId) }}>
                      {speakerName(speakers, segment.speakerId)}
                    </span>
                    <span className="mt-0.5 block text-[15px] leading-6 text-ink">
                      <MarkedText text={segment.text} query={query} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ol>
    </section>
  );
}
