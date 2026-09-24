import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDuration, formatWhen } from "@/lib/domain/format";
import { getMeeting, listMeetings } from "@/lib/domain/queries";
import { BackHome } from "@/components/bits";
import { MeetingWorkspace } from "@/components/meeting-workspace";

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
    openGraph: meeting
      ? { title: `${meeting.title} · Callnote`, description: meeting.preview, siteName: "Callnote" }
      : undefined,
  };
}

export function generateStaticParams() {
  return listMeetings().map((meeting) => ({ id: meeting.id }));
}

export const dynamicParams = false;

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = getMeeting(id);
  if (!meeting) notFound();

  if (meeting.status === "processing") {
    return (
      <div>
        <BackHome />
        <h1 className="mt-4 font-serif text-3xl tracking-tight">{meeting.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {formatWhen(meeting.startedAt)} · {formatDuration(meeting.durationSec)}
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {meeting.speakers.map((person) => (
            <li key={person.id} className="text-sm">
              <span className="font-medium">{person.name}</span>
              <span className="text-muted"> · {person.role}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 max-w-xl rounded-md border border-line bg-card px-5 py-6">
          <p className="text-sm font-medium">Processing meeting…</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="text-muted">Recording received</li>
            <li>Preparing transcript and meeting insights</li>
          </ul>
          <p className="mt-4 text-sm leading-6 text-muted">
            The recording is in Callnote. The transcript, summary, and action items for this call are not in the demo yet.
          </p>
        </div>
      </div>
    );
  }

  return <MeetingWorkspace meeting={meeting} initialTime={0} />;
}
