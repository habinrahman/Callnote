"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatClock, formatWhen } from "@/lib/domain/format";
import type { CalendarMeeting } from "@/lib/capture/calendar";
import { saveCaptured, type CapturedHighlight } from "@/lib/capture/db";

function supportedMime() {
  if (typeof MediaRecorder === "undefined") return "";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return "";
}

export function RecordingSession({ meeting, autoStart = false }: { meeting: CalendarMeeting; autoStart?: boolean }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"ready" | "requesting" | "live" | "denied" | "processing">(autoStart ? "requesting" : "ready");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const [highlights, setHighlights] = useState<CapturedHighlight[]>([]);
  const [highlightLabel, setHighlightLabel] = useState("");
  const [notice, setNotice] = useState("");
  const started = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number>(0);
  const contextRef = useRef<AudioContext | null>(null);
  const elapsedRef = useRef(0);
  const highlightsRef = useRef<CapturedHighlight[]>([]);
  const alive = useRef(true);
  const booted = useRef(false);

  const visible = meeting.script.filter((line) => elapsed >= line.startSec);

  function release() {
    window.clearInterval(timer.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") void context.close();
  }

  useEffect(() => {
    alive.current = true;
    if (autoStart && !booted.current) {
      booted.current = true;
      void start();
    }
    return () => {
      alive.current = false;
      release();
    };
    // start is stable enough for the mount-only autoStart path
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setPhase("denied");
      return;
    }
    setPhase("requesting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      const context = new AudioContext();
      contextRef.current = context;
      const analyser = context.createAnalyser();
      context.createMediaStreamSource(media).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const paint = () => {
        if (!stream.current) return;
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const value of data) peak = Math.max(peak, Math.abs(value - 128));
        setLevel(peak / 128);
        if (stream.current) requestAnimationFrame(paint);
      };
      paint();
      const mime = supportedMime();
      const rec = mime ? new MediaRecorder(media, { mimeType: mime }) : new MediaRecorder(media);
      chunks.current = [];
      rec.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      rec.start(250);
      recorder.current = rec;
      started.current = performance.now();
      timer.current = window.setInterval(() => {
        const next = (performance.now() - started.current) / 1000;
        elapsedRef.current = next;
        setElapsed(next);
      }, 200);
      setPhase("live");
    } catch {
      release();
      if (alive.current) setPhase("denied");
    }
  }

  function toggleMute() {
    const track = stream.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }

  function mark() {
    const current = meeting.script.filter((line) => elapsedRef.current >= line.startSec);
    const line = current[current.length - 1];
    const typed = highlightLabel.trim().slice(0, 72);
    const label = typed || (line ? line.text.split(". ")[0].slice(0, 72) : "Marked moment");
    const next = [
      ...highlightsRef.current,
      {
        id: `h-${highlightsRef.current.length + 1}`,
        startSec: elapsedRef.current,
        label,
        speaker: line?.speaker ?? meeting.participants[0]?.name ?? "Speaker",
        excerpt: line?.text ?? "Marked while the recording was running.",
      },
    ];
    highlightsRef.current = next;
    setHighlights(next);
    setHighlightLabel("");
    setNotice(`Highlight created · ${formatClock(elapsedRef.current)} · ${label}`);
  }

  function finish(audio: Blob | null) {
    const seconds = elapsedRef.current;
    const marks = highlightsRef.current;
    release();
    setPhase("processing");
    const id = `captured-${meeting.id}-${Date.now()}`;
    const spoken = meeting.script.filter((line) => line.startSec <= seconds + 0.2);
    window.setTimeout(() => {
      void saveCaptured({
        id,
        sourceId: meeting.id,
        title: meeting.title,
        startedAt: new Date().toISOString(),
        durationSec: Math.max(1, seconds),
        platform: meeting.platform,
        participants: meeting.participants,
        lines: spoken,
        highlights: marks,
        notes: meeting.notes,
        audio,
      }).then(() => router.push(`/meetings/captured/?id=${id}`));
    }, 1600);
  }

  function stop() {
    const rec = recorder.current;
    if (!rec || rec.state === "inactive") {
      finish(chunks.current.length ? new Blob(chunks.current, { type: "audio/webm" }) : null);
      return;
    }
    rec.onstop = () => finish(new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }));
    rec.stop();
  }

  if (phase === "processing") {
    return (
      <div className="max-w-xl rounded-md border border-line bg-card px-5 py-6">
        <p className="text-sm font-medium">Processing meeting</p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="text-muted">Recording received</li>
          <li>Preparing transcript and meeting insights</li>
        </ul>
        <p className="mt-4 text-sm text-muted">Demo transcript events are used. This is not live speech-to-text.</p>
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <div className="max-w-xl">
        <h1 className="font-serif text-[2rem] tracking-tight">{meeting.title}</h1>
        <p className="mt-3 text-sm leading-6">
          Microphone access is unavailable, so Callnote cannot save a recording. The seeded library is unchanged.
        </p>
        <button type="button" onClick={() => setPhase("ready")} className="mt-4 rounded-md border border-line bg-card px-3 py-1.5 text-sm">
          Back
        </button>
      </div>
    );
  }

  if (phase === "requesting") {
    return (
      <div className="max-w-xl">
        <h1 className="font-serif text-[2rem] tracking-tight">{meeting.title}</h1>
        <p className="mt-3 text-sm leading-6">Requesting microphone access. Callnote records in this browser and does not join {meeting.platform}.</p>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className="max-w-xl">
        <h1 className="font-serif text-[2rem] tracking-tight">{meeting.title}</h1>
        <p className="mt-2 text-sm text-muted">
          {formatWhen(meeting.startsAt)} · {meeting.participants.length} participants
        </p>
        <p className="mt-4 text-sm leading-6">Callnote is ready. This records your microphone in the browser. It does not join {meeting.platform}.</p>
        <button type="button" onClick={() => void start()} className="mt-5 rounded-md bg-pine px-3 py-2 text-sm text-white">
          Start recording
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-[2rem] tracking-tight">{meeting.title}</h1>
          <p className="mt-1 text-sm text-muted">{formatWhen(meeting.startsAt)}</p>
          <p className="mt-2 flex items-center gap-2 text-sm" aria-live="polite">
            <span className="h-2 w-2 rounded-full bg-red-700" aria-hidden="true" />
            Recording
            <span className="tabular-nums">{formatClock(elapsed)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={toggleMute} className="rounded-md border border-line bg-card px-3 py-1.5 text-sm">
            {muted ? "Unmute" : "Mute"}
          </button>
          <input
            value={highlightLabel}
            onChange={(event) => setHighlightLabel(event.target.value)}
            placeholder="Highlight title"
            maxLength={72}
            aria-label="Highlight title"
            className="w-40 rounded-md border border-line bg-card px-2 py-1.5 text-sm"
          />
          <button type="button" onClick={mark} className="rounded-md border border-line bg-card px-3 py-1.5 text-sm">
            Highlight moment
          </button>
          <button type="button" onClick={stop} className="rounded-md bg-pine px-3 py-1.5 text-sm text-white">
            Stop recording
          </button>
        </div>
      </div>
      <div className="mt-4 flex h-10 items-end gap-1" aria-label="Audio level">
        {Array.from({ length: 24 }, (_, index) => (
          <span key={index} className="w-1.5 rounded-sm bg-pine" style={{ height: `${8 + level * 32 * ((index % 5) + 1) / 5}px` }} />
        ))}
      </div>
      <section className="mt-6" aria-label="Participants">
        <h2 className="text-sm font-medium">Participants</h2>
        <ul className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
          {meeting.participants.map((person) => (
            <li key={person.name}>{person.name}</li>
          ))}
        </ul>
      </section>
      <p className="mt-4 text-xs text-muted">Demo transcript events for this meeting. Not speech-to-text from the microphone.</p>
      {notice ? <p className="mt-2 text-sm text-pine">{notice}</p> : null}
      {highlights.length > 0 ? (
        <ul className="mt-2 text-sm text-muted">
          {highlights.map((item) => (
            <li key={item.id}>
              {formatClock(item.startSec)} · {item.label}
            </li>
          ))}
        </ul>
      ) : null}
      <ol className="mt-4 max-w-2xl divide-y divide-line rounded-md border border-line bg-card" aria-label="Live transcript">
        {visible.length === 0 ? <li className="px-4 py-6 text-sm text-muted">Waiting for the first demo event.</li> : null}
        {visible.map((line) => (
          <li key={line.startSec} className="px-4 py-3">
            <p className="text-xs text-muted">
              <span className="tabular-nums">{formatClock(line.startSec)}</span> · {line.speaker}
            </p>
            <p className="mt-1 text-sm leading-6">{line.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
