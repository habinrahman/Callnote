"use client";

import Link from "next/link";

export default function MeetingError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-md border border-line bg-card px-5 py-10 shadow-[var(--shadow-rest)]">
      <h1 className="font-serif text-2xl tracking-tight">This meeting didn’t load</h1>
      <p className="mt-2 text-sm text-muted">The page failed before the notes could render.</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-pine px-3 py-1.5 text-sm text-white"
        >
          Try again
        </button>
        <Link href="/" className="rounded-md border border-line px-3 py-1.5 text-sm">
          All meetings
        </Link>
      </div>
    </div>
  );
}
