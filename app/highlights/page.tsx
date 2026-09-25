"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatClock } from "@/lib/domain/format";
import { apiPath } from "@/lib/api-path";
import { CapturedHighlights } from "@/components/captured-highlights";

type HighlightCard = {
  id: string;
  meetingId: string;
  meetingTitle: string;
  label: string;
  excerpt: string;
  startSec: number;
  speakerName: string;
};

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<HighlightCard[]>([]);
  useEffect(() => {
    void fetch(apiPath("/api/highlights/"))
      .then((response) => response.json())
      .then((data) => setHighlights(data as HighlightCard[]))
      .catch(() => setHighlights([]));
  }, []);

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight">Highlights</h1>
      <p className="mt-1 text-sm text-muted">Important moments extracted from your conversations.</p>
      <CapturedHighlights />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {highlights.map((highlight) => (
          <li key={`${highlight.meetingId}-${highlight.id}`}>
            <Link
              href={`/meetings/${highlight.meetingId}?t=${Math.floor(highlight.startSec)}`}
              className="flex h-full flex-col rounded-lg border border-line bg-white px-4 py-3"
            >
              <span className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-pine">↗ {highlight.label}</span>
                <span className="tabular-nums text-xs text-muted">{formatClock(highlight.startSec)}</span>
              </span>
              <span className="mt-3 text-[15px] leading-6">“{highlight.excerpt}”</span>
              <span className="mt-4 flex items-center justify-between text-xs text-muted">
                <span>{highlight.meetingTitle}</span>
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
