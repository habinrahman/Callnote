import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDuration, formatWhen } from "@/lib/domain/format";
import { getMeeting } from "@/lib/domain/queries";
import { BackHome } from "@/components/bits";
import { MeetingWorkspace } from "@/components/meeting-workspace";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const meeting = getMeeting(id);
  return { title: meeting ? `${meeting.title} · Fathom` : "Meeting" };
}

export default async function MeetingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const meeting = getMeeting(id);
  if (!meeting) notFound();

  if (meeting.status === "processing") {
    return (
      <div>
        <BackHome />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{meeting.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {formatWhen(meeting.startedAt)} · {formatDuration(meeting.durationSec)} ·{" "}
          {meeting.speakers.map((person) => `${person.name}, ${person.role}`).join(" · ")}
        </p>
        <div className="mt-6 rounded-lg border border-line bg-card px-5 py-8">
          <p className="text-xs font-medium uppercase tracking-wide text-amber">Processing</p>
          <p className="mt-2 max-w-lg text-sm leading-6">
            The notetaker has the recording. Transcript, summary, and action items show up on this page when they are ready. Nothing here is missing because the call was empty.
          </p>
        </div>
      </div>
    );
  }

  const initial = Number(t);
  const initialTime = Number.isFinite(initial) ? Math.min(meeting.durationSec, Math.max(0, initial)) : 0;
  return <MeetingWorkspace meeting={meeting} initialTime={initialTime} />;
}
