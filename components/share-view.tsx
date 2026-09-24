"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatClock, formatWhen, nextPlayhead } from "@/lib/domain/format";
import type { ClipView } from "@/lib/domain/types";
import { BackHome, speakerName } from "@/components/bits";
import { PlaybackBar } from "@/components/playback-bar";
import { TranscriptPane } from "@/components/transcript-pane";

export function ShareView({ view }: { view: ClipView }) {
  const { clip } = view;
  const [time, setTime] = useState(clip.startSec);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [query, setQuery] = useState("");
  const timeRef = useRef(clip.startSec);
  const rateRef = useRef(1);

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
      const next = nextPlayhead(timeRef.current, delta, view.segments, clip.endSec);
      timeRef.current = next;
      setTime(next);
      if (next >= clip.endSec) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, clip.endSec]);

  function seek(seconds: number) {
    const next = Math.min(clip.endSec, Math.max(clip.startSec, seconds));
    timeRef.current = next;
    setTime(next);
    setPlaying(true);
  }

  return (
    <div>
      <BackHome />
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-pine">Callnote clip</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{clip.title}</h1>
      <p className="mt-2 text-sm text-muted">
        From {view.meetingTitle} · {formatWhen(view.startedAt)}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6">{clip.note}</p>
      <p className="mt-2 text-sm">
        <Link href={`/meetings/${view.meetingId}?t=${Math.floor(clip.startSec)}`} className="text-pine hover:underline">
          Open the full meeting at {formatClock(clip.startSec)}
        </Link>
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <div>
          <PlaybackBar
            seed={clip.id}
            label="Recording"
            time={time}
            start={clip.startSec}
            end={clip.endSec}
            playing={playing}
            rate={rate}
            onToggle={() => setPlaying((value) => !value)}
            onSeek={seek}
            onRate={setRate}
          />
          <p className="mt-4 text-sm leading-6 text-muted">
            {speakerName(view.speakers, view.segments[0]?.speakerId ?? "")} and others,{" "}
            {formatClock(clip.startSec)}–{formatClock(clip.endSec)}.
          </p>
        </div>
        <TranscriptPane
          speakers={view.speakers}
          segments={view.segments}
          time={time}
          query={query}
          onQuery={setQuery}
          onSeek={seek}
        />
      </div>
    </div>
  );
}
