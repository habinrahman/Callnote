import Link from "next/link";
import { notFound } from "next/navigation";
import { formatWhen } from "@/lib/domain/format";
import { calendarMeetings, getCalendarMeeting } from "@/lib/capture/calendar";

export function generateStaticParams() {
  return calendarMeetings.filter((meeting) => meeting.script.length > 0).map((meeting) => ({ id: meeting.id }));
}

export default async function CalendarMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = getCalendarMeeting(id);
  if (!meeting || meeting.script.length === 0) notFound();
  return (
    <div className="max-w-xl">
      <Link href="/calendar/" className="text-sm text-muted hover:text-ink">
        ← Calendar
      </Link>
      <h1 className="mt-4 font-serif text-[2rem] tracking-tight">{meeting.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {formatWhen(meeting.startsAt)} · {meeting.participants.length} participants · {meeting.durationMin} min
      </p>
      <p className="mt-4 text-sm leading-6">Callnote is ready. Recording uses this browser’s microphone. Callnote does not join {meeting.platform}.</p>
      <ul className="mt-4 space-y-1 text-sm text-muted">
        {meeting.participants.map((person) => (
          <li key={person.name}>
            {person.name} · {person.role}
          </li>
        ))}
      </ul>
      <Link href={`/calendar/${meeting.id}/live/`} className="mt-5 inline-block rounded-md bg-pine px-3 py-2 text-sm text-white">
        Start recording
      </Link>
    </div>
  );
}
