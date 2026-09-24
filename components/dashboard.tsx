import Link from "next/link";
import { formatDay, formatDuration, formatWhen } from "@/lib/domain/format";
import { listMeetings, searchMeetings } from "@/lib/domain/queries";
import type { MeetingSummary, SearchHit } from "@/lib/domain/types";
import { MarkedText } from "@/components/bits";

function MeetingRow({ meeting }: { meeting: MeetingSummary }) {
  const processing = meeting.status === "processing";
  return (
    <li>
      <Link
        href={`/meetings/${meeting.id}`}
        className="block rounded-lg border border-line bg-card px-4 py-4 hover:border-pine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">{meeting.title}</h2>
          <span className="text-xs text-muted">{formatWhen(meeting.startedAt)}</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {formatDuration(meeting.durationSec)} · {meeting.participants.join(", ")}
        </p>
        <p className="mt-2 text-sm leading-5">{meeting.preview}</p>
        <p className="mt-2 text-xs text-muted">
          {processing
            ? "Processing"
            : meeting.openActionCount === 0
              ? `${meeting.actionCount} actions, all done`
              : `${meeting.openActionCount} open of ${meeting.actionCount} actions`}
        </p>
      </Link>
    </li>
  );
}

function SearchResults({ query, hits }: { query: string; hits: SearchHit[] }) {
  if (hits.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-card px-4 py-10 text-center">
        <h1 className="text-lg font-semibold">Nothing mentions “{query}”</h1>
        <p className="mt-2 text-sm text-muted">Try a name, a decision, or a phrase from the call.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-pine hover:underline">
          Clear search
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold">
          {hits.length} {hits.length === 1 ? "result" : "results"} for “{query}”
        </h1>
        <Link href="/" className="text-sm text-pine hover:underline">
          Clear
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {hits.map((hit, index) => (
          <li key={`${hit.meetingId}-${hit.kind}-${index}`}>
            <Link
              href={
                hit.timestampSec === null
                  ? `/meetings/${hit.meetingId}`
                  : `/meetings/${hit.meetingId}?t=${Math.floor(hit.timestampSec)}`
              }
              className="block rounded-lg border border-line bg-card px-4 py-3 hover:border-pine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            >
              <span className="text-xs uppercase tracking-wide text-muted">{hit.kind}</span>
              <span className="mt-1 block font-medium">{hit.title}</span>
              <span className="mt-1 block text-sm leading-5 text-ink">
                <MarkedText text={hit.snippet} query={query} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Dashboard({ query }: { query: string }) {
  if (query.trim()) {
    return <SearchResults query={query.trim()} hits={searchMeetings(query)} />;
  }

  const meetings = listMeetings();
  const groups = new Map<string, MeetingSummary[]>();
  for (const meeting of meetings) {
    const day = formatDay(meeting.startedAt);
    groups.set(day, [...(groups.get(day) ?? []), meeting]);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
        Recent calls, with the summary up front and the open actions counted.
      </p>
      <div className="mt-6 space-y-8">
        {[...groups.entries()].map(([day, items]) => (
          <section key={day}>
            <h2 className="text-sm font-medium text-muted">{day}</h2>
            <ul className="mt-2 space-y-3">
              {items.map((meeting) => (
                <MeetingRow key={meeting.id} meeting={meeting} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
