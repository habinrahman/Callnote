"use client";

import { useState } from "react";
import Link from "next/link";
import { formatClock, formatWhen } from "@/lib/domain/format";
import type { ClipView } from "@/lib/domain/types";
import { northwindDemo } from "@/lib/audio/northwind-demo";
import { speakerName } from "@/components/bits";
import { PlaybackBar } from "@/components/playback-bar";
import { TranscriptPane } from "@/components/transcript-pane";
import { usePlayback } from "@/components/use-playback";

export function ShareView({ view }: { view: ClipView }) {
  const { clip } = view;
  const demo = view.meetingId === "northwind-renewal" ? northwindDemo : null;
  const cues = demo
    ? demo.cues.filter((cue) => cue.meetingEnd > clip.startSec && cue.meetingStart < clip.endSec)
    : [];
  const { time, playing, rate, audioStatus, setPlaying, setRate, seek } = usePlayback({
    segments: view.segments,
    start: clip.startSec,
    end: clip.endSec,
    initialTime: clip.startSec,
    src: demo?.src,
    cues: [...cues],
  });
  const [query, setQuery] = useState("");

  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-pine">Callnote clip</p>
      <h1 className="mt-1 font-serif text-[2rem] tracking-tight">{clip.title}</h1>
      <p className="mt-2 text-sm text-muted">
        From {view.meetingTitle} · {formatWhen(view.startedAt)}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6">{clip.note}</p>
      <p className="mt-2 text-sm">
        <Link href={`/meetings/${view.meetingId}?t=${Math.floor(clip.startSec)}`} className="font-medium text-pine hover:underline">
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
            status={
              audioStatus === "loading"
                ? "Loading audio"
                : audioStatus === "unavailable"
                  ? "Audio unavailable"
                  : audioStatus === "ended"
                    ? "End of demo audio"
                    : undefined
            }
          />
          {demo && audioStatus !== "unavailable" ? (
            <p className="mt-2 text-xs text-muted">Demo audio of what was said in this moment. It is not a full meeting recording.</p>
          ) : null}
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
