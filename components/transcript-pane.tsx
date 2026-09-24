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
    <section className="flex min-h-[420px] flex-col rounded-lg border border-line bg-card lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]" aria-label="Transcript">
      <div className="border-b border-line px-3 py-3">
        <label htmlFor="transcript-search" className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
          Transcript
        </label>
        <input
          id="transcript-search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Find a line"
          className="w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm outline-none focus-visible:border-pine focus-visible:ring-2 focus-visible:ring-pine/30"
        />
        {needle ? (
          <p className="mt-2 text-xs text-muted">
            {visible.length} {visible.length === 1 ? "line" : "lines"}
          </p>
        ) : null}
      </div>
      <ol ref={listRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {visible.length === 0 ? (
          <li className="px-2 py-6 text-sm text-muted">No lines match that.</li>
        ) : (
          visible.map(({ segment, index }) => {
            const isActive = index === active;
            return (
              <li key={segment.id}>
                <button
                  type="button"
                  data-active={isActive ? "true" : "false"}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => onSeek(segment.startSec)}
                  className={`w-full rounded-md px-2 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine ${
                    isActive ? "bg-[#e7f3ef]" : "hover:bg-sand"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium" style={{ color: speakerColor(speakers, segment.speakerId) }}>
                      {speakerName(speakers, segment.speakerId)}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">{formatClock(segment.startSec)}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-ink">
                    <MarkedText text={segment.text} query={query} />
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
