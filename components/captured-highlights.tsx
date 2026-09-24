"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatClock } from "@/lib/domain/format";
import { listCaptured, type CapturedMeeting } from "@/lib/capture/db";

export function CapturedHighlights() {
  const [meetings, setMeetings] = useState<CapturedMeeting[]>([]);
  useEffect(() => {
    void listCaptured().then(setMeetings).catch(() => setMeetings([]));
  }, []);
  const groups = meetings.filter((meeting) => meeting.highlights.length > 0);
  if (groups.length === 0) return null;
  return (
    <div className="mt-8 space-y-6">
      {groups.map((meeting) => (
        <section key={meeting.id}>
          <h2 className="text-sm text-muted">{meeting.title}</h2>
          <ul className="mt-2">
            {meeting.highlights.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 border-b border-line py-2 text-sm">
                <Link href={`/meetings/captured/?id=${meeting.id}&t=${Math.floor(item.startSec)}`} className="hover:text-pine">
                  {item.label}
                  <span className="mt-0.5 block text-xs text-muted">{item.speaker}</span>
                  <span className="mt-1 block text-sm leading-5 text-ink">{item.excerpt}</span>
                </Link>
                <span className="text-xs tabular-nums text-muted">{formatClock(item.startSec)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
