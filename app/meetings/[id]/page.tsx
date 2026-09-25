import type { Metadata } from "next";
import { getMeeting, listMeetings } from "@/lib/domain/queries";
import { MeetingRoute } from "@/components/meeting-route";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const meeting = getMeeting(id);
  return {
    title: meeting?.title ?? "Meeting",
    description: meeting?.preview,
  };
}

export function generateStaticParams() {
  return listMeetings().map((meeting) => ({ id: meeting.id }));
}

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MeetingRoute id={id} />;
}
