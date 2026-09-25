import { listStoredMeetings, summarize } from "@/lib/db";

export const runtime = "nodejs";

export function GET(request: Request) {
  const shared = new URL(request.url).searchParams.get("shared") === "1";
  const meetings = listStoredMeetings()
    .filter((meeting) => (shared ? meeting.clips.length > 0 : true))
    .map(summarize)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  return Response.json(meetings);
}
