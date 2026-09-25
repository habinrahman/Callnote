"use client";

import { useEffect, useState } from "react";
import { apiPath } from "@/lib/api-path";
import type { MeetingSummary } from "@/lib/domain/types";
import { MeetingRows } from "@/components/meeting-rows";

export default function SharedPage() {
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  useEffect(() => {
    void fetch(apiPath("/api/meetings/?shared=1"))
      .then((response) => response.json())
      .then((data) => setMeetings(data as MeetingSummary[]))
      .catch(() => setMeetings([]));
  }, []);
  return (
    <MeetingRows
      meetings={meetings}
      title="Shared with me"
      subtitle="Meeting intelligence shared across your workspace."
    />
  );
}
