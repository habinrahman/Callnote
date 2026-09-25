import { listStoredMeetings } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const highlights = (await listStoredMeetings()).flatMap((meeting) =>
    meeting.highlights.map((highlight) => ({
      ...highlight,
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      speakerName: meeting.speakers.find((speaker) => speaker.id === highlight.speakerId)?.name ?? "",
    })),
  );
  return Response.json(highlights);
}
