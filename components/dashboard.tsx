"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatClock, formatDuration, formatWhen } from "@/lib/domain/format";
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

const avatarColors = ["#1b5648", "#8a4b2f", "#3d4f86", "#6b3f69", "#3f6b3a", "#8a5a12"];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function dayLabel(iso: string) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(yesterdayDate);
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

function MeetingRow({ meeting }: { meeting: MeetingSummary }) {
  const processing = meeting.status === "processing";
  return (
    <li>
      <Link href={`/meetings/${meeting.id}`} className="block rounded-md border border-line bg-card px-4 py-4 transition-colors hover:border-[#cfc4b4]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[15px] font-semibold tracking-tight">{meeting.title}</h2>
          {processing ? (
            <span className="shrink-0 rounded-md bg-[#f3e6cf] px-2 py-0.5 text-xs font-medium text-amber">Processing</span>
          ) : (
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-pine">
              {meeting.openActionCount} open
              <span className="h-1.5 w-1.5 rounded-full bg-pine" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="flex -space-x-1">
            {meeting.participants.slice(0, 4).map((name, index) => (
              <span
                key={name}
                className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-medium text-white ring-2 ring-card"
                style={{ background: avatarColors[index % avatarColors.length] }}
              >
                {initials(name)}
              </span>
            ))}
          </span>
          <span className="text-xs text-muted">
            {people(meeting.participants)}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">
          {formatWhen(meeting.startedAt)} · {formatDuration(meeting.durationSec)}
        </p>
        {processing ? null : <p className="mt-2 line-clamp-2 text-sm leading-5">{meeting.preview}</p>}
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
  const [filter, setFilter] = useState<"all" | "ready" | "processing">("all");
  const [newest, setNewest] = useState(true);
  const meetings = listMeetings().filter((meeting) => (filter === "all" ? true : meeting.status === filter));
  if (!newest) meetings.reverse();
  const groups = new Map<string, MeetingSummary[]>();
  for (const meeting of meetings) {
    const day = dayLabel(meeting.startedAt);
    groups.set(day, [...(groups.get(day) ?? []), meeting]);
  }

  return (
    <div>
      {trimmed ? null : (
        <div>
          <h1 className="font-serif text-[2rem] tracking-tight">Meetings</h1>
          <p className="mt-1 text-sm text-muted">Your conversations, decisions, and next steps in one place.</p>
        </div>
      )}
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${trimmed ? "" : "mt-5"}`}>
        <div className="min-w-0 flex-1">
          <MeetingSearch />
        </div>
        {trimmed ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-line bg-card p-0.5 text-sm">
              {(
                [
                  ["all", "All"],
                  ["ready", "Ready"],
                  ["processing", "Processing"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`rounded px-2.5 py-1 ${filter === value ? "bg-sand font-medium text-ink" : "text-muted"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              aria-label="Sort meetings"
              value={newest ? "new" : "old"}
              onChange={(event) => setNewest(event.target.value === "new")}
              className="rounded-md border border-line bg-card px-2 py-1.5 text-sm"
            >
              <option value="new">Newest first</option>
              <option value="old">Oldest first</option>
            </select>
          </div>
        )}
      </div>
      {trimmed ? (
        <SearchResults query={trimmed} hits={searchMeetings(trimmed)} />
      ) : (
        <div className="mt-8 space-y-8">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted">{day.toUpperCase()}</h2>
              <ul className="mt-3 space-y-3">
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
