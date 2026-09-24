"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { meetings as seeded } from "@/lib/seed/meetings";
import { IconSearch } from "@/components/icons";

function pathOf(value: string) {
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
}

export function MeetingSearch({
  inputId = "q",
  placeholder = "Search titles, notes, and what was said",
}: {
  inputId?: string;
  placeholder?: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") ?? "";

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
        router.push(value ? `/?q=${encodeURIComponent(value)}` : "/");
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Search meetings
      </label>
      <div className="relative min-w-0">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          id={inputId}
          name="q"
          key={query}
          defaultValue={query}
          placeholder={placeholder}
          className="w-full rounded-md border border-line bg-card py-2 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-muted focus-visible:border-pine"
        />
      </div>
    </form>
  );
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
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
  const onLibrary = pathname === "/" || pathname === "";
  const onSearch = pathname === "/search";
  const onHighlights = pathname === "/highlights";
  const onShare = pathname.startsWith("/share");
  const current = meetings.find((meeting) => pathname === `/meetings/${meeting.id}`);
  const shared = seeded.filter((meeting) => meeting.clips.length > 0);
  const context = onSearch ? "Search" : onHighlights ? "Highlights" : current?.title ?? "Meetings";

  if (onShare) {
    return (
      <div className="min-h-screen">
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-ink" aria-label="Callnote, all meetings">
              <Mark />
              <span className="text-[15px] font-medium tracking-tight">Callnote</span>
            </Link>
            <p className="text-sm text-muted">Shared meeting moment</p>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-[#f7f4ee] lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-ink" aria-label="Callnote, all meetings">
            <Mark />
            <span className="text-[15px] font-medium tracking-tight">Callnote</span>
          </Link>
        </div>
        <nav className="px-3" aria-label="Primary">
          <NavLink href="/" current={onLibrary} icon="M2.5 3.5h4.2v4.2H2.5V3.5Zm6.8 0h4.2v4.2H9.3V3.5ZM2.5 10.3h4.2v4.2H2.5v-4.2Zm6.8 0h4.2v4.2H9.3v-4.2Z">
            Meetings
          </NavLink>
          <NavLink href="/search" current={onSearch} icon="M7 2.6a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8ZM10.4 10.4 13.2 13.2">
            Search
          </NavLink>
          <NavLink href="/highlights" current={onHighlights} icon="M8 2.2 9.4 5.6 13 6.1 10.5 8.5 11.1 12.2 8 10.5 4.9 12.2 5.5 8.5 3 6.1 6.6 5.6 8 2.2Z">
            Highlights
          </NavLink>
        </nav>
        <div className="mt-6 px-3">
          <p className="px-2 text-[10px] font-medium tracking-[0.14em] text-muted">RECENT</p>
          <ul className="mt-1">
            {meetings.map((meeting) => {
              const href = `/meetings/${meeting.id}`;
              const active = pathname === href;
              return (
                <li key={meeting.id}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`block truncate rounded-md px-2 py-1.5 text-[13px] ${
                      active ? "bg-sand font-medium text-ink" : "text-muted hover:bg-sand/60 hover:text-ink"
                    }`}
                  >
                    {meeting.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-6 px-3 pb-6">
          <p className="px-2 text-[10px] font-medium tracking-[0.14em] text-muted">SHARED WITH ME</p>
          <ul className="mt-1">
            {shared.map((meeting) => (
              <li key={meeting.id}>
                <Link href={`/meetings/${meeting.id}`} className="block truncate rounded-md px-2 py-1.5 text-[13px] text-muted hover:bg-sand/60 hover:text-ink">
                  {meeting.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-12 items-center justify-between gap-3 border-b border-line px-4 sm:px-6">
          <p className="truncate text-sm text-muted">{context}</p>
          <div className="flex items-center gap-2 text-muted">
            <Link href="/search" className="grid h-8 w-8 place-items-center rounded-md hover:bg-sand" aria-label="Open search">
              <IconSearch />
            </Link>
            <span className="grid h-8 w-8 place-items-center" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                <path d="M8 2.2a3.2 3.2 0 0 1 3.2 3.2v1.7l.8 1.6a.7.7 0 0 1-.6 1H4.6a.7.7 0 0 1-.6-1l.8-1.6V5.4A3.2 3.2 0 0 1 8 2.2Z" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6.6 11.8a1.4 1.4 0 0 0 2.8 0" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-pine text-[10px] font-medium text-white" title="Jordan Lee">
              JL
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function Mark() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1b5648" />
      <path d="M16.2 8.4a5.2 5.2 0 1 0 0 7.2" fill="none" stroke="#f3f0e8" strokeWidth="2.1" />
    </svg>
  );
}

function NavLink({
  href,
  current,
  icon,
  children,
}: {
  href: string;
  current: boolean;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`mt-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
        current ? "bg-sand font-medium text-ink" : "text-muted hover:bg-sand/60 hover:text-ink"
      }`}
    >
      <NavIcon d={icon} />
      {children}
    </Link>
  );
}
