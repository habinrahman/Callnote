"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatClock } from "@/lib/domain/format";
import { getCaptured, type CapturedHighlight, type CapturedMeeting } from "@/lib/capture/db";

function ClipBody({ meeting, highlight }: { meeting: CapturedMeeting; highlight: CapturedHighlight }) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!meeting.audio) return;
    const element = new Audio(URL.createObjectURL(meeting.audio));
    document.body.appendChild(element);
    const seekTo = () => {
      element.currentTime = highlight.startSec;
    };
    element.addEventListener("loadedmetadata", seekTo);
    element.addEventListener("ended", () => setPlaying(false));
    setAudio(element);
    return () => {
      element.pause();
      element.remove();
      URL.revokeObjectURL(element.src);
    };
  }, [meeting, highlight.startSec]);

  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-pine">Callnote clip</p>
      <h1 className="mt-1 font-serif text-[2rem] tracking-tight">{highlight.label}</h1>
      <p className="mt-2 text-sm text-muted">
        From {meeting.title} · {highlight.speaker} · {formatClock(highlight.startSec)}
      </p>
      <p className="mt-3 max-w-2xl text-sm leading-6">{highlight.excerpt}</p>
      {audio ? (
        <button
          type="button"
          className="mt-4 rounded-md bg-pine px-3 py-1.5 text-sm text-white"
          onClick={() => {
            if (playing) {
              audio.pause();
              setPlaying(false);
              return;
            }
            audio.currentTime = highlight.startSec;
            void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
          }}
        >
          {playing ? "Pause" : "Play clip"}
        </button>
      ) : (
        <p className="mt-4 text-sm text-muted">No audio was saved with this highlight.</p>
      )}
      <p className="mt-4 text-sm text-muted">This clip plays the browser recording. It is not a link into {meeting.platform}.</p>
      <Link href={`/meetings/captured/?id=${meeting.id}&t=${Math.floor(highlight.startSec)}`} className="mt-4 inline-block text-sm text-pine hover:underline">
        Open the recording at {formatClock(highlight.startSec)}
      </Link>
    </div>
  );
}

function Clip() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const highlightId = params.get("h") ?? "";
  const [meeting, setMeeting] = useState<CapturedMeeting | null | undefined>(undefined);

  useEffect(() => {
    if (!id) {
      setMeeting(null);
      return;
    }
    void getCaptured(id).then(setMeeting);
  }, [id]);

  if (meeting === undefined) return <p className="text-sm text-muted">Loading clip…</p>;
  if (!meeting) return <p className="text-sm text-muted">This clip is stored in the browser that recorded it.</p>;
  const highlight = meeting.highlights.find((item) => item.id === highlightId) ?? meeting.highlights[0];
  if (!highlight) return <p className="text-sm text-muted">No highlight was saved.</p>;
  return (
    <ClipBody meeting={meeting} highlight={highlight} />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading clip…</p>}>
      <Clip />
    </Suspense>
  );
}
