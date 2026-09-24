"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTime } from "@/lib/domain/format";
import { calendarMeetings, type CalendarMeeting } from "@/lib/capture/calendar";
import { readCalendarConnection, writeCalendarConnection, type CalendarConnection } from "@/lib/capture/db";

const statusLabel = {
  upcoming: "Upcoming",
  ready: "Ready",
  scheduled: "Notetaker scheduled",
  recorded: "Recorded",
};

function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

function dayHeading(iso: string) {
  const day = dayKey(iso);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  if (day === today) return "Today";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

function MeetingCard({ meeting }: { meeting: CalendarMeeting }) {
  return (
    <li className="rounded-md border border-line bg-card px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm tabular-nums text-muted">{formatTime(meeting.startsAt)}</p>
          <h2 className="mt-1 font-medium">{meeting.title}</h2>
          <p className="mt-1 text-xs text-muted">
            {meeting.participants.length} participants · {meeting.durationMin} min · {meeting.platform}
          </p>
        </div>
        <span className="text-xs font-medium text-pine">{statusLabel[meeting.status]}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {meeting.script.length > 0 ? (
          <Link href={`/calendar/${meeting.id}/`} className="rounded-md bg-pine px-3 py-1.5 text-sm text-white">
            Start Callnote
          </Link>
        ) : null}
        {meeting.libraryHref ? (
          <Link href={meeting.libraryHref} className="rounded-md border border-line bg-card px-3 py-1.5 text-sm">
            Open saved meeting
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export function CalendarBoard() {
  const [connection, setConnection] = useState<CalendarConnection | null>(null);
  const [chooser, setChooser] = useState(false);

  useEffect(() => {
    setConnection(readCalendarConnection());
  }, []);

  function connect(provider: CalendarConnection["provider"]) {
    const next = { provider, name: "Jordan Lee" };
    writeCalendarConnection(next);
    setConnection(next);
    setChooser(false);
  }

  const groups = new Map<string, CalendarMeeting[]>();
  for (const meeting of calendarMeetings) {
    const key = dayKey(meeting.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), meeting]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-[2rem] tracking-tight">Calendar</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">Upcoming meetings from a demo calendar. Callnote does not call Google or Microsoft.</p>
        </div>
        {connection ? (
          <div className="text-sm">
            <p className="font-medium">Calendar connected</p>
            <p className="text-muted">Connected as {connection.name}</p>
            <p className="text-xs text-muted">Demo connection · {connection.provider}</p>
          </div>
        ) : (
          <button type="button" onClick={() => setChooser(true)} className="rounded-md bg-pine px-3 py-2 text-sm text-white">
            Connect calendar
          </button>
        )}
      </div>
      {chooser && !connection ? (
        <div className="mt-6 max-w-md rounded-md border border-line bg-card px-4 py-4">
          <h2 className="font-serif text-2xl tracking-tight">Connect your calendar</h2>
          <p className="mt-2 text-sm text-muted">Demo connection only. Nothing is sent to Google or Microsoft.</p>
          <div className="mt-4 space-y-2">
            {(["Google Calendar", "Microsoft Outlook"] as const).map((provider) => (
              <div key={provider} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2">
                <span className="text-sm">{provider}</span>
                <button type="button" onClick={() => connect(provider)} className="text-sm text-pine">
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {connection ? (
        <div className="mt-8 space-y-8">
          {[...groups.entries()].map(([key, items]) => (
            <section key={key}>
              <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted">{dayHeading(items[0].startsAt).toUpperCase()}</h2>
              <ul className="mt-3 space-y-3">
                {items.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">Connect a demo calendar to see today’s meetings.</p>
      )}
    </div>
  );
}
