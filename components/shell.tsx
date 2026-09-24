"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function Shell({
  children,
  meetings,
}: {
  children: React.ReactNode;
  meetings: { id: string; title: string }[];
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const query = params.get("q") ?? "";
  const onLibrary = pathname === "/";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="px-4 py-4 lg:px-4 lg:py-5">
          <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
            Fathom
          </Link>
          <nav className="mt-4" aria-label="Meetings">
            <Link
              href="/"
              aria-current={onLibrary ? "page" : undefined}
              className={`block rounded-md px-2 py-1.5 text-sm ${onLibrary ? "bg-sand font-medium text-ink" : "text-muted hover:text-ink"}`}
            >
              All meetings
            </Link>
            <ul className="mt-2 hidden space-y-0.5 lg:block">
              {meetings.map((meeting) => {
                const href = `/meetings/${meeting.id}`;
                const current = pathname === href;
                return (
                  <li key={meeting.id}>
                    <Link
                      href={href}
                      aria-current={current ? "page" : undefined}
                      className={`block truncate rounded-md px-2 py-1.5 text-sm ${current ? "bg-sand font-medium text-ink" : "text-muted hover:text-ink"}`}
                    >
                      {meeting.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-line bg-paper/90 px-4 py-3 sm:px-6">
          <form
            role="search"
            className="mx-auto flex max-w-6xl gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
              router.push(value ? `/?q=${encodeURIComponent(value)}` : "/");
            }}
          >
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
            <button
              type="submit"
              className="rounded-md bg-pine px-3 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            >
              Search
            </button>
          </form>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
