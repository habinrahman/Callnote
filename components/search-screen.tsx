"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatClock } from "@/lib/domain/format";
import { searchMeetings } from "@/lib/domain/queries";
import type { SearchHit } from "@/lib/domain/types";
import { MarkedText } from "@/components/bits";
import { IconSearch } from "@/components/icons";

function hitMeta(hit: SearchHit) {
  const time = hit.timestampSec === null ? null : formatClock(hit.timestampSec);
  if (hit.kind === "transcript") return [hit.who, time].filter(Boolean).join(" · ");
  if (hit.kind === "action") return ["Action", hit.who, time].filter(Boolean).join(" · ");
  if (hit.kind === "summary") return "Summary";
  return "Title";
}

export function SearchScreen() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const query = value.trim();
  const hits = query ? searchMeetings(query) : [];
  const groups = new Map<string, SearchHit[]>();
  for (const hit of hits) groups.set(hit.meetingId, [...(groups.get(hit.meetingId) ?? []), hit]);

  return (
    <div>
      <h1 className="font-serif text-[2rem] tracking-tight">Search</h1>
      <p className="mt-1 text-sm text-muted">Across meetings, transcripts, summaries, decisions, and action items.</p>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (query) router.push(`/?q=${encodeURIComponent(query)}`);
        }}
      >
        <label htmlFor="library-search" className="sr-only">
          Search meetings
        </label>
        <div className="relative">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            id="library-search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="error budget, a name, a decision…"
            className="w-full rounded-md border border-line bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:border-pine"
          />
        </div>
      </form>
      {query && hits.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nothing mentions “{query}”.</p>
      ) : null}
      {hits.length > 0 ? (
        <div className="mt-8 space-y-6">
          <h2 className="font-serif text-2xl tracking-tight">
            {hits.length} {hits.length === 1 ? "result" : "results"} for “{query}”
          </h2>
          {[...groups.entries()].map(([meetingId, items]) => (
            <section key={meetingId}>
              <h3 className="text-sm text-muted">{items[0]?.title}</h3>
              <ul className="mt-2 overflow-hidden rounded-md border border-line bg-card">
                {items.map((hit, index) => (
                  <li key={`${hit.kind}-${index}`} className="border-b border-line last:border-b-0">
                    <Link
                      href={
                        hit.timestampSec === null
                          ? `/meetings/${hit.meetingId}`
                          : `/meetings/${hit.meetingId}?t=${Math.floor(hit.timestampSec)}`
                      }
                      className="block px-4 py-3 hover:bg-sand/70"
                    >
                      <span className="text-xs text-muted">{hitMeta(hit)}</span>
                      <span className="mt-1 block text-sm">
                        <MarkedText text={hit.snippet} query={query} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
