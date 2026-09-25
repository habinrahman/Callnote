"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDuration, formatWhen } from "@/lib/domain/format";
import type { MeetingSummary } from "@/lib/domain/types";
import { IconSearch } from "@/components/icons";

const avatarColors = ["#1f7a4d", "#3d6b58", "#5d8f78", "#2f6d62", "#4e7c68"];

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
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(iso)).toUpperCase();
}

export function MeetingRows({
  meetings,
  title,
  subtitle,
}: {
  meetings: MeetingSummary[];
  title: string;
  subtitle: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "ready" | "processing">("all");
  const [newest, setNewest] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = meetings.filter((meeting) => {
      if (filter !== "all" && meeting.status !== filter) return false;
      if (!needle) return true;
      return `${meeting.title} ${meeting.preview} ${meeting.participants.join(" ")}`.toLowerCase().includes(needle);
    });
    return newest ? next : [...next].reverse();
  }, [meetings, filter, newest, query]);
  const groups = new Map<string, MeetingSummary[]>();
  for (const meeting of visible) {
    const day = dayLabel(meeting.startedAt);
    groups.set(day, [...(groups.get(day) ?? []), meeting]);
  }

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      <form
        className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          const value = query.trim();
          if (value) router.push(`/search/?q=${encodeURIComponent(value)}`);
        }}
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search meetings</span>
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search meetings"
            className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus-visible:border-pine"
          />
        </label>
        <button type="button" onClick={() => setNewest((value) => !value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
          {newest ? "Most recent" : "Oldest first"}
        </button>
        <div className="relative">
          <button type="button" onClick={() => setFiltersOpen((value) => !value)} className="rounded-lg border border-line bg-white px-3 py-2 text-sm" aria-expanded={filtersOpen}>
            Filters
          </button>
          {filtersOpen ? (
            <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-line bg-white p-1 text-sm">
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
                  className={`block w-full rounded-md px-2 py-1.5 text-left ${filter === value ? "bg-[#e7f2eb] text-pine" : ""}`}
                  onClick={() => {
                    setFilter(value);
                    setFiltersOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </form>
      <div className="mt-8">
        {[...groups.entries()].map(([day, items]) => (
          <section key={day}>
            <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted">{day.toUpperCase()}</h2>
            <ul className="mt-2">
              {items.map((meeting) => (
                <li key={meeting.id} className="border-b border-line">
                  <Link href={`/meetings/${meeting.id}`} className="block py-4 hover:bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-semibold">{meeting.title}</h3>
                          <span className={`text-xs font-medium ${meeting.status === "processing" ? "text-amber" : "text-pine"}`}>
                            ● {meeting.status === "processing" ? "Processing" : "Ready"}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span className="flex -space-x-1">
                            {meeting.participants.slice(0, 4).map((name, index) => (
                              <span
                                key={name}
                                className="grid h-6 w-6 place-items-center rounded-full text-[9px] font-medium text-white ring-2 ring-[#fbfbfa]"
                                style={{ background: avatarColors[index % avatarColors.length] }}
                              >
                                {initials(name)}
                              </span>
                            ))}
                          </span>
                          <span>
                            {meeting.participants.slice(0, 3).join(" · ")}
                            {meeting.participants.length > 3 ? ` +${meeting.participants.length - 3}` : ""}
                          </span>
                          <span>{formatWhen(meeting.startedAt)}</span>
                          <span>{formatDuration(meeting.durationSec)}</span>
                        </div>
                        <p className="mt-2 truncate text-sm text-muted">{meeting.preview}</p>
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted">
                        <div>{meeting.actionCount} actions</div>
                        <div className="mt-1 text-pine">{meeting.highlightCount} highlights</div>
                      </div>
                    </div>
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
