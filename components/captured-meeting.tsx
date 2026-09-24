"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatClock, formatDue } from "@/lib/domain/format";
import { getCaptured, saveCaptured, type CapturedMeeting } from "@/lib/capture/db";
import { sectionsFor, sliceSection, type StructureId } from "@/lib/intelligence/present";
import { PlaybackBar } from "@/components/playback-bar";
import { TranscriptPane } from "@/components/transcript-pane";

export function CapturedMeetingView({ id }: { id: string }) {
  const [meeting, setMeeting] = useState<CapturedMeeting | null | undefined>(undefined);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [structure, setStructure] = useState<StructureId>("general");
  const [query, setQuery] = useState("");
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [highlightLabel, setHighlightLabel] = useState("");

  useEffect(() => {
    void getCaptured(id).then(setMeeting);
    const raw = window.localStorage.getItem(`fanthom-actions-${id}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) setDoneIds(parsed);
    } catch {
      setDoneIds([]);
    }
  }, [id]);

  useEffect(() => {
    if (!meeting?.audio) return;
    const element = new Audio(URL.createObjectURL(meeting.audio));
    element.preload = "auto";
    document.body.appendChild(element);
    const onTime = () => setTime(element.currentTime);
    const onEnd = () => setPlaying(false);
    element.addEventListener("timeupdate", onTime);
    element.addEventListener("ended", onEnd);
    setAudio(element);
    const mark = Number(new URLSearchParams(window.location.search).get("t"));
    if (Number.isFinite(mark) && mark > 0) {
      const seekTo = () => {
        element.currentTime = mark;
        setTime(mark);
      };
      if (element.readyState >= 1) seekTo();
      else element.addEventListener("loadedmetadata", seekTo, { once: true });
    }
    return () => {
      element.pause();
      element.removeEventListener("timeupdate", onTime);
      element.removeEventListener("ended", onEnd);
      element.remove();
      URL.revokeObjectURL(element.src);
    };
  }, [meeting]);

  useEffect(() => {
    if (!audio) return;
    audio.playbackRate = rate;
    audio.volume = volume;
    if (playing) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [audio, playing, rate, volume]);

  if (meeting === undefined) return <p className="text-sm text-muted">Loading recording…</p>;
  if (!meeting) return <p className="text-sm text-muted">This recording is only in this browser, and it is not here.</p>;

  const speakers = meeting.participants.map((person, index) => ({ id: `p${index}`, name: person.name, role: person.role }));
  const speakerId = (name: string) => speakers.find((person) => person.name === name)?.id ?? speakers[0]?.id ?? "p0";
  const segments = meeting.lines.map((line, index) => ({
    id: `c${index}`,
    speakerId: speakerId(line.speaker),
    startSec: line.startSec,
    endSec: meeting.lines[index + 1]?.startSec ?? meeting.durationSec,
    text: line.text,
  }));
  const end = audio?.duration && Number.isFinite(audio.duration) ? audio.duration : meeting.durationSec;

  function seek(seconds: number) {
    const next = Math.max(0, seconds);
    setTime(next);
    setPlaying(true);
    if (audio) audio.currentTime = Math.min(end, next);
  }

  const sections = sectionsFor(structure);

  return (
    <div>
      <Link href="/calendar/" className="text-sm text-muted hover:text-ink">
        ← Calendar
      </Link>
      <h1 className="mt-4 font-serif text-[2rem] tracking-tight">{meeting.title}</h1>
      <p className="mt-2 text-sm text-muted">Recorded in this browser · {meeting.platform} was not joined</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <div>
          <PlaybackBar
            seed={meeting.id}
            label="Recording"
            time={time}
            start={0}
            end={end}
            playing={playing}
            rate={rate}
            marks={meeting.highlights.map((item) => ({ at: item.startSec, label: item.label }))}
            onToggle={() => setPlaying((value) => !value)}
            onSeek={seek}
            onRate={setRate}
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-muted">
            Volume
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          </label>
          {!meeting.audio ? <p className="mt-2 text-xs text-muted">No audio was saved for this session.</p> : null}
        </div>
        <TranscriptPane speakers={speakers} segments={segments} time={time} query={query} onQuery={setQuery} onSeek={seek} />
        <article className="rounded-md border border-line bg-card">
          <header className="flex items-start justify-between gap-3 px-4 py-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.14em] text-muted">{structure.toUpperCase()}</p>
              <h2 className="mt-2 font-serif text-2xl leading-snug">{meeting.notes.headline}</h2>
            </div>
            <select aria-label="Template" value={structure} onChange={(event) => setStructure(event.target.value as StructureId)} className="rounded-md border border-line bg-card px-2 py-1.5 text-sm">
              <option value="general">General</option>
              <option value="incident">Incident review</option>
              <option value="sales">Sales</option>
              <option value="discovery">Customer discovery</option>
              <option value="interview">Interview</option>
            </select>
          </header>
          {sections.map((section) => (
            <section key={section.id} className="border-t border-line px-4 py-4">
              <h3 className="text-sm font-medium">{section.label}</h3>
              {section.kind === "prose" ? <p className="mt-2 text-sm leading-6">{meeting.notes.summary}</p> : null}
              {section.kind === "points" ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {sliceSection(meeting.notes.decisions, section).map((item) => (
                    <li key={item.text}>
                      <button type="button" onClick={() => seek(item.timestampSec)} className="text-left hover:text-pine">
                        <span className="tabular-nums">{formatClock(item.timestampSec)}</span> · {item.text}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.kind === "actions" ? (
                <ul className="mt-2 space-y-3 text-sm">
                  {sliceSection(meeting.notes.actions, section).map((item, index) => {
                    const actionId = `a${index}`;
                    const done = doneIds.includes(actionId);
                    return (
                      <li key={actionId} className="flex gap-3">
                        <input
                          type="checkbox"
                          checked={done}
                          aria-label={`Mark complete: ${item.task}`}
                          className="mt-1 accent-pine"
                          onChange={() => {
                            const next = done ? doneIds.filter((value) => value !== actionId) : [...doneIds, actionId];
                            setDoneIds(next);
                            window.localStorage.setItem(`fanthom-actions-${meeting.id}`, JSON.stringify(next));
                          }}
                        />
                        <div>
                          <p className={done ? "text-muted line-through" : ""}>{item.task}</p>
                          <p className="text-xs text-muted">
                            {item.owner}
                            {item.dueDate ? ` · Due ${formatDue(item.dueDate)}` : ""} ·{" "}
                            <button type="button" onClick={() => seek(item.timestampSec)} className="tabular-nums text-pine">
                              {formatClock(item.timestampSec)}
                            </button>
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {section.kind === "topics" ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {sliceSection(meeting.notes.topics, section).map((item) => (
                    <li key={item.label}>
                      <button type="button" onClick={() => seek(item.timestampSec)} className="font-medium hover:text-pine">
                        {formatClock(item.timestampSec)} · {item.label}
                      </button>
                      <p className="text-muted">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.kind === "moments" ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {sliceSection(meeting.lines, section).map((item) => (
                    <li key={`${item.startSec}-${item.text}`}>
                      <button type="button" onClick={() => seek(item.startSec)} className="text-left hover:text-pine">
                        {formatClock(item.startSec)} · {item.speaker}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.kind === "list" ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {sliceSection(meeting.notes.followUps, section).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </div>
      <section className="mt-8" aria-label="Highlights">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">Highlights</h2>
        <p className="mt-1 text-xs text-muted">Saved in this browser only. They are not synced to other people.</p>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const label = highlightLabel.trim().slice(0, 72) || "Marked moment";
            const line = [...meeting.lines].reverse().find((item) => item.startSec <= time);
            const next = {
              ...meeting,
              highlights: [
                ...meeting.highlights,
                {
                  id: `h-${meeting.highlights.length + 1}`,
                  startSec: time,
                  label,
                  speaker: line?.speaker ?? "Speaker",
                  excerpt: line?.text ?? "Marked during playback.",
                },
              ],
            };
            setMeeting(next);
            setHighlightLabel("");
            void saveCaptured(next);
          }}
        >
          <input
            value={highlightLabel}
            onChange={(event) => setHighlightLabel(event.target.value)}
            placeholder="Highlight title"
            maxLength={72}
            aria-label="Highlight title"
            className="w-56 rounded-md border border-line bg-card px-2 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-md border border-line bg-card px-3 py-1.5 text-sm">
            Highlight at {formatClock(time)}
          </button>
        </form>
        <ul className="mt-3">
          {meeting.highlights.map((item) => (
            <li key={item.id}>
              <Link href={`/share/captured/?id=${meeting.id}&h=${item.id}`} className="text-sm text-pine hover:underline">
                Share
              </Link>
              <button type="button" onClick={() => seek(item.startSec)} className="ml-3 text-left text-sm hover:text-pine">
                {item.label} · {formatClock(item.startSec)} · {item.speaker}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
