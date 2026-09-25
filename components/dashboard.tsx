"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatClock } from "@/lib/domain/format";
import { listCaptured, type CapturedMeeting } from "@/lib/capture/db";
import { searchCaptured } from "@/lib/capture/search";
import type { MeetingSummary, SearchHit } from "@/lib/domain/types";
import { apiPath } from "@/lib/api-path";
import { MarkedText } from "@/components/bits";
import { MeetingRows } from "@/components/meeting-rows";

function hitMeta(hit: SearchHit) {
  const time = hit.timestampSec === null ? null : formatClock(hit.timestampSec);
  if (hit.kind === "transcript") return [hit.who, time].filter(Boolean).join(" · ");
  if (hit.kind === "action") return ["Action", hit.who, time].filter(Boolean).join(" · ");
  if (hit.kind === "summary") return "Summary";
  return "Title";
}

export function Dashboard() {
  const query = useSearchParams().get("q") ?? "";
  const trimmed = query.trim();
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [captured, setCaptured] = useState<CapturedMeeting[]>([]);

  useEffect(() => {
    void listCaptured().then(setCaptured).catch(() => setCaptured([]));
  }, []);

  useEffect(() => {
    const path = trimmed ? `/api/search/?q=${encodeURIComponent(trimmed)}` : "/api/meetings/";
    void fetch(apiPath(path))
      .then((response) => response.json())
      .then((data) => {
        if (trimmed) setHits(data as SearchHit[]);
        else setMeetings(data as MeetingSummary[]);
      })
      .catch(() => {
        setHits([]);
        setMeetings([]);
      });
  }, [trimmed]);

  if (trimmed) {
    const capturedHits = searchCaptured(captured, trimmed);
    return (
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">
          {hits.length} {hits.length === 1 ? "result" : "results"} for “{trimmed}”
        </h1>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {hits.map((hit, index) => (
            <li key={`${hit.meetingId}-${hit.kind}-${index}`}>
              <Link
                href={hit.timestampSec === null ? `/meetings/${hit.meetingId}` : `/meetings/${hit.meetingId}?t=${Math.floor(hit.timestampSec)}`}
                className="block py-3"
              >
                <span className="text-xs text-muted">{hit.title} · {hitMeta(hit)}</span>
                <span className="mt-1 block text-sm">
                  <MarkedText text={hit.snippet} query={trimmed} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {capturedHits.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {capturedHits.map((item) => (
              <li key={item.id}>
                <Link href={`/meetings/captured/?id=${item.id}`} className="text-sm text-pine">
                  {item.title} · recorded in this browser
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <MeetingRows
        meetings={meetings}
        title="Meetings"
        subtitle="Your conversations, decisions, and next steps in one place."
      />
      {captured.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted">RECORDED HERE</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {captured.map((item) => (
              <li key={item.id}>
                <Link href={`/meetings/captured/?id=${item.id}`} className="block py-3 text-sm font-medium">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
