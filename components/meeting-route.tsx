"use client";

import { useEffect, useState } from "react";
import { formatDuration, formatWhen } from "@/lib/domain/format";
import type { Meeting } from "@/lib/domain/types";
import { apiPath } from "@/lib/api-path";
import { MeetingWorkspace } from "@/components/meeting-workspace";

export function MeetingRoute({ id }: { id: string }) {
  const [meeting, setMeeting] = useState<Meeting | null | undefined>(undefined);

  useEffect(() => {
    void fetch(apiPath(`/api/meetings/${id}/`))
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setMeeting(data as Meeting | null))
      .catch(() => setMeeting(null));
  }, [id]);

  if (meeting === undefined) return <p className="text-sm text-muted">Loading meeting…</p>;
  if (!meeting) return <p className="text-sm text-muted">That meeting is not in the workspace.</p>;
  if (meeting.status === "processing") {
    return (
      <div className="mx-auto max-w-lg py-16">
        <p className="text-sm font-medium text-pine">Processing meeting</p>
        <h1 className="mt-3 text-[28px] font-semibold tracking-tight">{meeting.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {formatWhen(meeting.startedAt)} · {formatDuration(meeting.durationSec)}
        </p>
        <ul className="mt-8 divide-y divide-line border-y border-line text-sm">
          <li className="flex items-center gap-3 py-3 text-muted">◎ Recording received</li>
          <li className="flex items-center gap-3 py-3">C Preparing transcript and meeting insights</li>
          <li className="flex items-center gap-3 py-3 text-muted">Notes will appear here when ready</li>
        </ul>
        <p className="mt-6 text-sm text-muted">This prototype shows the expected product state. No live processing is running.</p>
      </div>
    );
  }
  return <MeetingWorkspace meeting={meeting} initialTime={0} />;
}
