import Link from "next/link";
import { formatClock } from "@/lib/domain/format";
import { meetings } from "@/lib/seed/meetings";
import { speakerName } from "@/components/bits";
import { CapturedHighlights } from "@/components/captured-highlights";

export const metadata = { title: "Highlights" };

export default function HighlightsPage() {
  const groups = meetings.filter((meeting) => meeting.highlights.length > 0);
  return (
    <div>
      <h1 className="font-serif text-[2rem] tracking-tight">Highlights</h1>
      <p className="mt-1 text-sm text-muted">Important moments extracted from your meetings.</p>
      <CapturedHighlights />
      <div className="mt-8 space-y-8">
        {groups.map((meeting) => (
          <section key={meeting.id}>
            <h2 className="text-sm text-muted">
              <Link href={`/meetings/${meeting.id}`} className="hover:text-ink">
                {meeting.title}
              </Link>
            </h2>
            <ol className="mt-3">
              {meeting.highlights.map((highlight) => (
                <li key={highlight.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 border-b border-line/80 py-3 last:border-b-0">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-pine" aria-hidden="true" />
                  <div>
                    <Link href={`/meetings/${meeting.id}?t=${Math.floor(highlight.startSec)}`} className="font-medium hover:text-pine">
                      {highlight.label}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">{speakerName(meeting.speakers, highlight.speakerId)}</p>
                    <p className="mt-1 text-sm leading-5">{highlight.excerpt}</p>
                  </div>
                  <span className="text-xs tabular-nums text-muted">{formatClock(highlight.startSec)}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
