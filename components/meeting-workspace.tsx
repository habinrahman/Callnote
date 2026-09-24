"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { formatClock, formatDue, formatDuration, formatWhen, nextPlayhead } from "@/lib/domain/format";
import type { Meeting } from "@/lib/domain/types";
import { BackHome, speakerName, TimeButton } from "@/components/bits";
import { PlaybackBar } from "@/components/playback-bar";
import { TranscriptPane } from "@/components/transcript-pane";

function storageKey(meetingId: string): string {
  return `fanthom-actions-${meetingId}`;
}

export function MeetingWorkspace({ meeting, initialTime }: { meeting: Meeting; initialTime: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [time, setTime] = useState(initialTime);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [templateId, setTemplateId] = useState(meeting.defaultTemplateId);
  const [transcriptQuery, setTranscriptQuery] = useState("");
  const [copied, setCopied] = useState("");
  const [doneIds, setDoneIds] = useState<string[] | null>(null);
  const timeRef = useRef(initialTime);
  const rateRef = useRef(1);
  const end = meeting.durationSec;

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = ((now - last) / 1000) * rateRef.current;
      last = now;
      const next = nextPlayhead(timeRef.current, delta, meeting.segments, end);
      timeRef.current = next;
      setTime(next);
      if (next >= end) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, end]);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("t");
    if (!raw) return;
    const next = Number(raw);
    if (!Number.isFinite(next)) return;
    const clamped = Math.min(end, Math.max(0, next));
    timeRef.current = clamped;
    setTime(clamped);
  }, [end]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(meeting.id));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) setDoneIds(parsed);
    } catch {
      setDoneIds(null);
    }
  }, [meeting.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      if (event.code !== "Space") return;
      event.preventDefault();
      setPlaying((value) => !value);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function seek(seconds: number) {
    const next = Math.min(end, Math.max(0, seconds));
    timeRef.current = next;
    setTime(next);
    setPlaying(true);
    router.replace(`${pathname}?t=${Math.floor(next)}`, { scroll: false });
  }

  function toggleDone(id: string) {
    const current = doneIds ?? meeting.actionItems.filter((item) => item.done).map((item) => item.id);
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    setDoneIds(next);
    window.localStorage.setItem(storageKey(meeting.id), JSON.stringify(next));
  }

  async function copyLink(url: string, label: string) {
    const absolute = new URL(url, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(label);
    } catch {
      setCopied(absolute);
    }
  }

  const template = meeting.templates.find((item) => item.id === templateId) ?? meeting.templates[0];
  const completed = (id: string, seedDone: boolean) => (doneIds ? doneIds.includes(id) : seedDone);
  const clip = meeting.clips[0];

  return (
    <div>
      <BackHome />
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl tracking-tight">{meeting.title}</h1>
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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span>Template</span>
            <select
              value={template.id}
              onChange={(event) => setTemplateId(event.target.value)}
              className="rounded-md border border-line bg-card px-2 py-1.5 text-sm text-ink"
            >
              {meeting.templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => copyLink(`${pathname}?t=${Math.floor(time)}`, "Meeting link copied")}
            className="rounded-md border border-line bg-card px-3 py-1.5 text-sm hover:border-pine"
          >
            Copy link
          </button>
          {clip ? (
            <>
              <Link
                href={`/share/${clip.id}`}
                className="rounded-md bg-pine px-3 py-1.5 text-sm text-white hover:bg-pine-deep"
              >
                Open shared clip
              </Link>
              <button
                type="button"
                onClick={() => copyLink(`/share/${clip.id}`, "Clip link copied")}
                className="rounded-md border border-line bg-card px-3 py-1.5 text-sm hover:border-pine"
              >
                Copy clip link
              </button>
            </>
          ) : null}
        </div>
      </div>
      {copied ? <p className="mt-2 text-sm text-pine">{copied}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <div className="order-1 lg:col-start-1">
          <PlaybackBar
            seed={meeting.id}
            label="Recording"
            time={time}
            start={0}
            end={end}
            playing={playing}
            rate={rate}
            marks={meeting.highlights.map((highlight) => ({ at: highlight.startSec, label: highlight.label }))}
            onToggle={() => setPlaying((value) => !value)}
            onSeek={seek}
            onRate={setRate}
          />
        </div>
        <div className="order-2 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <TranscriptPane
            speakers={meeting.speakers}
            segments={meeting.segments}
            time={time}
            query={transcriptQuery}
            onQuery={setTranscriptQuery}
            onSeek={seek}
          />
        </div>
        <div className="order-3 lg:col-start-1">
          <article className="overflow-hidden rounded-md border border-line bg-card shadow-[var(--shadow-rest)]">
            <header className="px-4 py-4 sm:px-5">
              <p className="text-xs font-medium tracking-wide text-muted">{template.name}</p>
              <h2 className="mt-1 font-serif text-xl leading-snug">{template.headline}</h2>
            </header>
            <section className="border-t border-line px-4 py-4 sm:px-5">
            <h3 className="text-sm font-medium">Executive summary</h3>
            <p className="mt-1 text-sm leading-6 text-ink">{template.executiveSummary}</p>

            </section>
            <section className="border-t border-line px-4 py-4 sm:px-5">
            <h3 className="text-sm font-medium">Decisions</h3>
            <ul className="mt-2 space-y-2">
              {meeting.decisions.map((item) => (
                <li key={item.id}>
                  <TimeButton seconds={item.timestampSec} onSeek={seek}>
                    {item.text}
                  </TimeButton>
                </li>
              ))}
            </ul>

            </section>
            <section className="border-t border-line px-4 py-4 sm:px-5">
            <h3 className="text-sm font-medium">Action items</h3>
            <ul className="mt-2 space-y-3">
              {meeting.actionItems.map((item) => {
                const done = completed(item.id, item.done);
                return (
                  <li key={item.id} className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleDone(item.id)}
                      aria-label={`Mark complete: ${item.task}`}
                      className="mt-1 accent-pine"
                    />
                    <div>
                      <p className={done ? "text-sm text-muted line-through" : "text-sm"}>{item.task}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="rounded bg-sand px-1.5 py-0.5 text-ink">{item.owner}</span>
                        {item.dueDate ? <span>Due {formatDue(item.dueDate)}</span> : null}
                        <button
                          type="button"
                          onClick={() => seek(item.timestampSec)}
                          className="tabular-nums text-pine hover:underline"
                        >
                          {formatClock(item.timestampSec)}
                        </button>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            </section>
            <section className="border-t border-line px-4 py-4 sm:px-5">
            <h3 className="text-sm font-medium">Key topics</h3>
            <ul className="mt-2 space-y-3">
              {meeting.topics.map((item) => (
                <li key={item.id}>
                  <TimeButton seconds={item.timestampSec} onSeek={seek}>
                    {item.label}
                  </TimeButton>
                  <p className="mt-1 text-sm leading-5 text-muted">{item.detail}</p>
                </li>
              ))}
            </ul>

            </section>
            <section className="border-t border-line px-4 py-4 sm:px-5">
            <h3 className="text-sm font-medium">Follow-ups</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
              {template.followUps.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            </section>
          </article>
        </div>
        <div className="order-4 space-y-6 lg:col-start-1">
          <section aria-label="Highlights">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Highlights</h2>
            <ol className="mt-3 border-l border-line">
              {meeting.highlights.map((highlight) => (
                <li key={highlight.id} className="relative pl-4">
                  <span className="absolute -left-[5px] top-3 h-2 w-2 rounded-full bg-pine" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => seek(highlight.startSec)}
                    className="w-full py-2 text-left hover:text-pine"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{highlight.label}</span>
                      <span className="text-xs tabular-nums text-muted">{formatClock(highlight.startSec)}</span>
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {speakerName(meeting.speakers, highlight.speakerId)}
                    </span>
                    <span className="mt-1 block text-sm leading-5">{highlight.excerpt}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <section aria-label="Important moments">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Important moments</h2>
            <ul className="mt-2 space-y-2">
              {meeting.moments.map((item) => (
                <li key={item.id}>
                  <TimeButton seconds={item.timestampSec} onSeek={seek}>
                    {item.label}
                  </TimeButton>
                  <p className="mt-1 text-sm leading-5 text-muted">{item.excerpt}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
