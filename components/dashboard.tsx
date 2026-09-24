"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatClock, formatDay, formatDuration, formatWhen } from "@/lib/domain/format";
import { listMeetings, searchMeetings } from "@/lib/domain/queries";
import type { MeetingSummary, SearchHit } from "@/lib/domain/types";
import { MarkedText } from "@/components/bits";
import { MeetingSearch } from "@/components/shell";

function people(names: string[]) {
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

function hitMeta(hit: SearchHit) {
  const time = hit.timestampSec === null ? null : formatClock(hit.timestampSec);
  if (hit.kind === "transcript") return [hit.who, time].filter(Boolean).join(" · ");
  if (hit.kind === "action") return ["Action", hit.who, time].filter(Boolean).join(" · ");
  if (hit.kind === "summary") return "Summary";
  return "Title";
}

function MeetingRow({ meeting }: { meeting: MeetingSummary }) {
  const processing = meeting.status === "processing";
  return (
    <li className="border-b border-line last:border-b-0">
      <Link href={`/meetings/${meeting.id}`} className="block px-4 py-3.5 transition-colors hover:bg-sand/70">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">{meeting.title}</h2>
            <p className="mt-1 text-xs text-muted">
              {formatWhen(meeting.startedAt)} · {formatDuration(meeting.durationSec)} · {people(meeting.participants)}
            </p>
            {processing ? null : <p className="mt-2 line-clamp-2 text-sm leading-5">{meeting.preview}</p>}
          </div>
          {processing ? (
            <span className="shrink-0 rounded-md bg-[#f3e6cf] px-2 py-0.5 text-xs font-medium text-amber">Processing</span>
          ) : (
            <span className="shrink-0 text-xs font-medium tabular-nums text-pine">
              {meeting.openActionCount === 0 ? "Actions done" : `${meeting.openActionCount} open`}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

function SearchResults({ query, hits }: { query: string; hits: SearchHit[] }) {
  if (hits.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-dashed border-line bg-card px-4 py-10 text-center">
        <h1 className="font-serif text-2xl tracking-tight">Nothing mentions “{query}”</h1>
        <p className="mt-2 text-sm text-muted">Try a name, a decision, or a phrase from the call.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-pine hover:underline">
          Clear search
        </Link>
      </div>
    );
  }

  const groups = new Map<string, SearchHit[]>();
  for (const hit of hits) groups.set(hit.meetingId, [...(groups.get(hit.meetingId) ?? []), hit]);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-serif text-2xl tracking-tight">
          {hits.length} {hits.length === 1 ? "result" : "results"} for “{query}”
        </h1>
        <Link href="/" className="text-sm text-pine hover:underline">
          Clear
        </Link>
      </div>
      <div className="mt-4 space-y-6">
        {[...groups.entries()].map(([meetingId, items]) => (
          <section key={meetingId}>
            <h2 className="text-sm font-medium text-muted">{items[0]?.title}</h2>
            <ul className="mt-2 overflow-hidden rounded-md border border-line bg-card">
              {items.map((hit, index) => (
                <li key={`${hit.meetingId}-${hit.kind}-${index}`} className="border-b border-line last:border-b-0">
                  <Link
                    href={
                      hit.timestampSec === null
                        ? `/meetings/${hit.meetingId}`
                        : `/meetings/${hit.meetingId}?t=${Math.floor(hit.timestampSec)}`
                    }
                    className="block px-4 py-3 transition-colors hover:bg-sand/70"
                  >
                    <span className="text-xs text-muted">{hitMeta(hit)}</span>
                    <span className="mt-1 block text-sm font-medium">{hit.title}</span>
                    <span className="mt-1 block text-sm leading-5">
                      <MarkedText text={hit.snippet} query={query} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const query = useSearchParams().get("q") ?? "";
  const trimmed = query.trim();
  const meetings = listMeetings();
  const groups = new Map<string, MeetingSummary[]>();
  for (const meeting of meetings) {
    const day = formatDay(meeting.startedAt);
    groups.set(day, [...(groups.get(day) ?? []), meeting]);
  }

  return (
    <div>
      {trimmed ? null : (
        <div>
          <h1 className="font-serif text-3xl tracking-tight">Meetings</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {meetings.length} recorded calls. Open one to read the outcome, then the transcript.
          </p>
        </div>
      )}
      <div className={trimmed ? "" : "mt-5"}>
        <MeetingSearch />
      </div>
      {trimmed ? (
        <SearchResults query={trimmed} hits={searchMeetings(trimmed)} />
      ) : (
        <div className="mt-8 space-y-8">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="text-xs font-medium tracking-wide text-muted">{day}</h2>
              <ul className="mt-2 overflow-hidden rounded-md border border-line bg-card shadow-[var(--shadow-rest)]">
                {items.map((meeting) => (
                  <MeetingRow key={meeting.id} meeting={meeting} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
