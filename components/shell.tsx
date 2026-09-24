"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function Shell({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const query = params.get("q") ?? "";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-5 lg:py-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
            Fathom
          </Link>
          <p className="text-sm text-muted lg:mt-6 lg:text-[13px] lg:leading-5">
            Notetaker is on. Finished calls land here with a transcript and a summary.
          </p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-line bg-paper/90 px-4 py-3 sm:px-6">
          <form action="/" role="search" className="mx-auto flex max-w-6xl">
            <label htmlFor="q" className="sr-only">
              Search meetings
            </label>
            <input
              id="q"
              name="q"
              key={query}
              defaultValue={query}
              placeholder="Search titles, notes, and what was said"
              className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus-visible:border-pine focus-visible:ring-2 focus-visible:ring-pine/30"
            />
          </form>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
