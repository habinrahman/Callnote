"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatClock, formatDue, formatDuration, formatWhen } from "@/lib/domain/format";
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
      const next = Math.min(end, timeRef.current + delta);
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
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{meeting.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {formatWhen(meeting.startedAt)} · {formatDuration(meeting.durationSec)} ·{" "}
            {meeting.speakers.map((person) => person.name).join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted">
            <span className="sr-only">Summary template</span>
            <select
              value={template.id}
              onChange={(event) => setTemplateId(event.target.value)}
              className="rounded-md border border-line bg-card px-2 py-1.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
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
            className="rounded-md border border-line bg-card px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            Copy link
          </button>
          {clip ? (
            <button
              type="button"
              onClick={() => copyLink(`/share/${clip.id}`, "Clip link copied")}
              className="rounded-md bg-pine px-3 py-1.5 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            >
              Share clip
            </button>
          ) : null}
        </div>
      </div>
      {copied ? <p className="mt-2 text-sm text-pine">{copied}</p> : null}
      <p className="mt-2 text-xs text-muted">Space plays or pauses when you are not typing.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <div className="space-y-6">
          <PlaybackBar
            seed={meeting.id}
            time={time}
            start={0}
            end={end}
            playing={playing}
            rate={rate}
            onToggle={() => setPlaying((value) => !value)}
            onSeek={seek}
            onRate={setRate}
          />

          <section aria-label="Highlights">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Highlights</h2>
            <ul className="mt-2 space-y-2">
              {meeting.highlights.map((highlight) => (
                <li key={highlight.id}>
                  <button
                    type="button"
                    onClick={() => seek(highlight.startSec)}
                    className="w-full rounded-lg border border-line bg-card px-3 py-3 text-left hover:border-pine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
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
            </ul>
          </section>

          <article className="rounded-lg border border-line bg-card p-4 sm:p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{template.name}</p>
            <h2 className="mt-2 text-xl font-semibold leading-snug">{template.headline}</h2>
            <h3 className="mt-5 text-sm font-medium">Executive summary</h3>
            <p className="mt-1 text-sm leading-6 text-ink">{template.executiveSummary}</p>

            <h3 className="mt-5 text-sm font-medium">Key topics</h3>
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

            <h3 className="mt-5 text-sm font-medium">Decisions</h3>
            <ul className="mt-2 space-y-2">
              {meeting.decisions.map((item) => (
                <li key={item.id}>
                  <TimeButton seconds={item.timestampSec} onSeek={seek}>
                    {item.text}
                  </TimeButton>
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-sm font-medium">Action items</h3>
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
                      <p className="mt-1 text-xs text-muted">
                        {item.owner}
                        {item.dueDate ? ` · due ${formatDue(item.dueDate)}` : ""}
                        {" · "}
                        <button
                          type="button"
                          onClick={() => seek(item.timestampSec)}
                          className="tabular-nums text-pine underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
                        >
                          {formatClock(item.timestampSec)}
                        </button>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <h3 className="mt-5 text-sm font-medium">Follow-ups</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
              {template.followUps.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <h3 className="mt-5 text-sm font-medium">Important moments</h3>
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
          </article>
        </div>
        <TranscriptPane
          speakers={meeting.speakers}
          segments={meeting.segments}
          time={time}
          query={transcriptQuery}
          onQuery={setTranscriptQuery}
          onSeek={seek}
        />
      </div>
    </div>
  );
}
