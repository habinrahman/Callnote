"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatClock } from "@/lib/domain/format";
import { listCaptured, type CapturedMeeting } from "@/lib/capture/db";
import { searchCaptured } from "@/lib/capture/search";
import type { SearchHit } from "@/lib/domain/types";
import { apiPath } from "@/lib/api-path";
import { IconSearch } from "@/components/icons";
import { MarkedText } from "@/components/bits";

const recent = ["error budget", "pricing approval", "customer expansion"];

function hitMeta(hit: SearchHit) {
  const time = hit.timestampSec === null ? null : formatClock(hit.timestampSec);
  if (hit.kind === "transcript") return [hit.who, time].filter(Boolean).join(" · ");
  if (hit.kind === "action") return ["Action", hit.who, time].filter(Boolean).join(" · ");
  if (hit.kind === "summary") return "Summary";
  return "Title";
}

export function SearchScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [value, setValue] = useState(query);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [captured, setCaptured] = useState<CapturedMeeting[]>([]);

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    void listCaptured().then(setCaptured).catch(() => setCaptured([]));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    void fetch(apiPath(`/api/search/?q=${encodeURIComponent(query.trim())}`))
      .then((response) => response.json())
      .then((data) => setHits(data as SearchHit[]))
      .catch(() => setHits([]));
  }, [query]);

  const capturedHits = query.trim() ? searchCaptured(captured, query.trim()) : [];
  const groups = new Map<string, SearchHit[]>();
  for (const hit of hits) groups.set(hit.meetingId, [...(groups.get(hit.meetingId) ?? []), hit]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight">Search</h1>
      <p className="mt-1 text-sm text-muted">Find any decision, person, topic, or phrase across your meetings.</p>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          const next = value.trim();
          router.push(next ? `/search/?q=${encodeURIComponent(next)}` : "/search/");
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
            placeholder="Search across everything"
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:border-pine"
          />
        </div>
      </form>
      {!query.trim() ? (
        <>
          <p className="mt-6 text-[11px] font-medium tracking-[0.14em] text-muted">RECENT SEARCHES</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recent.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => router.push(`/search/?q=${encodeURIComponent(item)}`)}
                className="rounded-full border border-line bg-white px-3 py-1 text-sm text-muted"
              >
                {item}
              </button>
            ))}
          </div>
          <hr className="my-8 border-line" />
          <h2 className="text-base font-semibold">Search the full meeting record</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Results include transcripts, summaries, decisions, action items, and important moments—with a direct path to the exact moment.
          </p>
        </>
      ) : null}
      {query.trim() && hits.length === 0 && capturedHits.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Nothing mentions “{query.trim()}”.</p>
      ) : null}
      {hits.length > 0 ? (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {hits.length} {hits.length === 1 ? "result" : "results"} for “{query.trim()}”
          </h2>
          {[...groups.entries()].map(([meetingId, items]) => (
            <section key={meetingId}>
              <h3 className="text-sm text-muted">{items[0]?.title}</h3>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {items.map((hit, index) => (
                  <li key={`${hit.kind}-${index}`}>
                    <Link
                      href={
                        hit.timestampSec === null
                          ? `/meetings/${hit.meetingId}`
                          : `/meetings/${hit.meetingId}?t=${Math.floor(hit.timestampSec)}`
                      }
                      className="block py-3"
                    >
                      <span className="text-xs text-muted">{hitMeta(hit)}</span>
                      <span className="mt-1 block text-sm">
                        <MarkedText text={hit.snippet} query={query.trim()} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
      {capturedHits.length > 0 ? (
        <ul className="mt-6 space-y-2">
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
