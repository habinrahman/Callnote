import { notFound } from "next/navigation";
import { calendarMeetings, getCalendarMeeting } from "@/lib/capture/calendar";
import { RecordingSession } from "@/components/recording-session";

export function generateStaticParams() {
  return calendarMeetings.filter((meeting) => meeting.script.length > 0).map((meeting) => ({ id: meeting.id }));
}

export default async function LivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = getCalendarMeeting(id);
  if (!meeting || meeting.script.length === 0) notFound();
  return <RecordingSession meeting={meeting} autoStart />;
}
