"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconSearch } from "@/components/icons";

function pathOf(value: string) {
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
}

function NavItem({
  href,
  current,
  icon,
  children,
}: {
  href: string;
  current: boolean;
  icon: string;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${
        current ? "bg-[#e7f2eb] font-medium text-pine" : "text-[#3d3a36] hover:bg-white"
      }`}
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d={icon} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      {children}
    </Link>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = pathOf(usePathname());
  const router = useRouter();
  const onShare = pathname.startsWith("/share");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (onShare) {
    return (
      <div className="min-h-screen bg-[#fbfbfa]">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-ink" aria-label="Callnote, all meetings">
              <Mark />
              <span className="text-[13px] font-bold tracking-[0.14em]">CALLNOTE</span>
            </Link>
            <p className="text-sm text-muted">Shared meeting moment</p>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfa] lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-line bg-[#f6f5f2] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-ink" aria-label="Callnote, all meetings">
            <Mark />
            <span className="text-[13px] font-bold tracking-[0.14em]">CALLNOTE</span>
          </Link>
        </div>
        <nav className="space-y-0.5 px-3" aria-label="Primary">
          <NavItem href="/" current={pathname === "/" || pathname === "/meetings"} icon="M2.5 3.5h4.2v4.2H2.5V3.5Zm6.8 0h4.2v4.2H9.3V3.5ZM2.5 10.3h4.2v4.2H2.5v-4.2Zm6.8 0h4.2v4.2H9.3v-4.2Z">
            Meetings
          </NavItem>
          <NavItem href="/search" current={pathname === "/search"} icon="M7 2.6a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8ZM10.4 10.4 13.2 13.2">
            Search
          </NavItem>
          <NavItem href="/highlights" current={pathname === "/highlights"} icon="M3 8.2 6.2 11.4 13 4.2">
            Highlights
          </NavItem>
        </nav>
        <p className="mt-6 px-5 text-[10px] font-medium tracking-[0.16em] text-muted">WORKSPACE</p>
        <nav className="mt-1 space-y-0.5 px-3" aria-label="Workspace">
          <NavItem href="/" current={false} icon="M3 4.5h10M3 8h10M3 11.5h6">
            Recent meetings
          </NavItem>
          <NavItem href="/shared" current={pathname === "/shared"} icon="M5.5 7.2a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM10.5 7.2a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3.2 12.2c.4-1.5 1.6-2.3 3.3-2.3s2.9.8 3.3 2.3M8.2 12.2c.3-1.2 1.2-1.9 2.5-1.9 1.1 0 2 .5 2.4 1.5">
            Shared with me
          </NavItem>
        </nav>
        <div className="mt-auto space-y-0.5 px-3 pb-3">
          <NavItem href="/help" current={pathname === "/help"} icon="M8 11.2v.2M8 8.2a2 2 0 1 0-1.6-3.2">
            Help
          </NavItem>
          <NavItem href="/settings" current={pathname === "/settings"} icon="M8 5.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6ZM8 2.4v1.2M8 12.4v1.2M2.4 8h1.2M12.4 8h1.2">
            Settings
          </NavItem>
          <Link href="/settings" className="mt-2 flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-white">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-pine text-[11px] font-medium text-white">JE</span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium">Jonah Ellis</span>
              <span className="block truncate text-[11px] text-muted">Northstar Labs</span>
            </span>
            <span className="ml-auto text-muted" aria-hidden="true">▾</span>
          </Link>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-line bg-[#fbfbfa] px-4 sm:px-8">
          <form
            className="w-full max-w-[290px]"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
              router.push(value ? `/search/?q=${encodeURIComponent(value)}` : "/search/");
            }}
          >
            <label htmlFor="global-search" className="sr-only">
              Global search
            </label>
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="global-search"
                name="q"
                placeholder="Search meetings, people, or phrases"
                className="w-full rounded-lg border border-line bg-white py-1.5 pl-9 pr-14 text-sm outline-none placeholder:text-muted focus-visible:border-pine"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">
                ⌘ K
              </span>
            </div>
          </form>
          <div className="flex items-center gap-2">
            <span className="relative grid h-8 w-8 place-items-center text-muted" aria-hidden="true">
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                <path d="M8 2.2a3.2 3.2 0 0 1 3.2 3.2v1.7l.8 1.6a.7.7 0 0 1-.6 1H4.6a.7.7 0 0 1-.6-1l.8-1.6V5.4A3.2 3.2 0 0 1 8 2.2Z" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6.6 11.8a1.4 1.4 0 0 0 2.8 0" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-pine" />
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-pine text-[11px] font-medium text-white" title="Jonah Ellis">
              JE
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

function Mark() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#1f7a4d" />
      <path d="M7 12.2 10.2 15.4 17 8.6" fill="none" stroke="#f7f6f3" strokeWidth="2" />
    </svg>
  );
}
