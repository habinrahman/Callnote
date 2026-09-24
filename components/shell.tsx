"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { IconSearch } from "@/components/icons";

function pathOf(value: string) {
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
}

export function MeetingSearch({ inputId = "q" }: { inputId?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") ?? "";

  return (
    <form
      role="search"
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
        router.push(value ? `/?q=${encodeURIComponent(value)}` : "/");
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Search meetings
      </label>
      <div className="relative min-w-0 flex-1">
        <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          id={inputId}
          name="q"
          key={query}
          defaultValue={query}
          placeholder="Search titles, notes, and what was said"
          className="w-full rounded-md border border-line bg-card py-2 pl-8 pr-3 text-sm text-ink outline-none placeholder:text-muted focus-visible:border-pine"
        />
      </div>
      <button type="submit" className="rounded-md bg-pine px-3 py-2 text-sm text-white hover:bg-pine-deep">
        Search
      </button>
    </form>
  );
}

export function Shell({
  children,
  meetings,
}: {
  children: React.ReactNode;
  meetings: { id: string; title: string }[];
}) {
  const pathname = pathOf(usePathname());
  const onLibrary = pathname === "/";
  const onShare = pathname.startsWith("/share");

  if (onShare) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <Link href="/" className="font-serif text-xl tracking-tight text-ink" aria-label="Callnote, all meetings">
              Callnote
            </Link>
            <p className="text-sm text-muted">Shared meeting moment</p>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="px-4 py-4 lg:py-5">
          <Link href="/" className="font-serif text-xl tracking-tight text-ink" aria-label="Callnote, all meetings">
            Callnote
          </Link>
          <nav className="mt-4" aria-label="Meetings">
            <Link
              href="/"
              aria-current={onLibrary ? "page" : undefined}
              className={`block border-l-2 px-2.5 py-1.5 text-sm ${
                onLibrary ? "border-pine bg-sand font-medium text-ink" : "border-transparent text-muted hover:bg-sand/70 hover:text-ink"
              }`}
            >
              All meetings
            </Link>
            <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {meetings.map((meeting) => {
                const href = `/meetings/${meeting.id}`;
                const current = pathname === href;
                return (
                  <li key={meeting.id} className="shrink-0">
                    <Link
                      href={href}
                      aria-current={current ? "page" : undefined}
                      className={`block max-w-[12rem] truncate rounded-md px-2 py-1 text-xs ${
                        current ? "bg-sand font-medium text-ink" : "text-muted hover:text-ink"
                      }`}
                    >
                      {meeting.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <ul className="mt-3 hidden space-y-0.5 lg:block">
              {meetings.map((meeting) => {
                const href = `/meetings/${meeting.id}`;
                const current = pathname === href;
                return (
                  <li key={meeting.id}>
                    <Link
                      href={href}
                      aria-current={current ? "page" : undefined}
                      className={`block truncate border-l-2 px-2.5 py-1.5 text-sm ${
                        current ? "border-pine bg-sand font-medium text-ink" : "border-transparent text-muted hover:bg-sand/70 hover:text-ink"
                      }`}
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
        {onLibrary ? null : (
          <header className="border-b border-line px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <MeetingSearch />
            </div>
          </header>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
