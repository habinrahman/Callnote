"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { nextPlayhead } from "@/lib/domain/format";
import type { TranscriptSegment } from "@/lib/domain/types";

export type AudioCue = {
  meetingStart: number;
  meetingEnd: number;
  audioStart: number;
  audioEnd: number;
};

export type AudioStatus = "off" | "loading" | "ready" | "unavailable" | "ended";

function assetSrc(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path}`;
}

function cueAtAudio(cues: AudioCue[], audioTime: number) {
  return cues.find((cue) => audioTime >= cue.audioStart && audioTime < cue.audioEnd - 0.04) ?? null;
}

function cueAtMeeting(cues: AudioCue[], meetingTime: number) {
  return (
    cues.find((cue) => meetingTime >= cue.meetingStart && meetingTime < cue.meetingEnd) ??
    cues.find((cue) => cue.meetingStart >= meetingTime - 0.05) ??
    null
  );
}

function meetingTimeFromAudio(cue: AudioCue, audioTime: number) {
  const audioSpan = Math.max(cue.audioEnd - cue.audioStart, 0.05);
  const progress = Math.min(1, Math.max(0, (audioTime - cue.audioStart) / audioSpan));
  return cue.meetingStart + progress * (cue.meetingEnd - cue.meetingStart);
}

function audioTimeFromMeeting(cue: AudioCue, meetingTime: number) {
  const span = Math.max(cue.meetingEnd - cue.meetingStart, 0.05);
  const progress = Math.min(1, Math.max(0, (meetingTime - cue.meetingStart) / span));
  return cue.audioStart + progress * (cue.audioEnd - cue.audioStart);
}

export function usePlayback({
  segments,
  start,
  end,
  initialTime,
  src,
  cues = [],
}: {
  segments: TranscriptSegment[];
  start: number;
  end: number;
  initialTime: number;
  src?: string;
  cues?: AudioCue[];
}) {
  const [time, setTime] = useState(initialTime);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>(src ? "loading" : "off");
  const timeRef = useRef(initialTime);
  const rateRef = useRef(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const statusRef = useRef(audioStatus);
  const cuesRef = useRef(cues);
  const bounds = useRef({ start, end });
  bounds.current = { start, end };
  cuesRef.current = cues;
  statusRef.current = audioStatus;

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    rateRef.current = rate;
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    if (!src) return;
    const audio = new Audio(assetSrc(src));
    audio.preload = "auto";
    audioRef.current = audio;
    document.body.appendChild(audio);
    const ready = () => {
      if (statusRef.current === "unavailable") return;
      setAudioStatus("ready");
    };
    const fail = () => setAudioStatus("unavailable");
    audio.addEventListener("canplay", ready);
    audio.addEventListener("error", fail);
    return () => {
      audio.pause();
      audio.removeEventListener("canplay", ready);
      audio.removeEventListener("error", fail);
      audio.remove();
      audioRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || audioStatus !== "ready") return;
    const onTime = () => {
      const cue = cueAtAudio(cuesRef.current, audio.currentTime);
      if (!cue) {
        const last = cuesRef.current[cuesRef.current.length - 1];
        if (last && audio.currentTime >= last.audioEnd - 0.04) {
          audio.pause();
          setPlaying(false);
          setAudioStatus("ended");
          timeRef.current = Math.min(bounds.current.end, last.meetingEnd);
          setTime(timeRef.current);
        }
        return;
      }
      const meeting = meetingTimeFromAudio(cue, audio.currentTime);
      if (audio.currentTime >= cue.audioEnd - 0.05 || meeting >= cue.meetingEnd - 0.05) {
        const next = nextPlayhead(cue.meetingEnd - 0.05, 0.1, segments, bounds.current.end);
        if (next >= bounds.current.end - 0.05 || next <= cue.meetingStart) {
          audio.pause();
          setPlaying(false);
          setAudioStatus("ended");
          timeRef.current = bounds.current.end;
          setTime(bounds.current.end);
          return;
        }
        const nextCue = cueAtMeeting(cuesRef.current, next);
        if (!nextCue) return;
        audio.currentTime = nextCue.audioStart;
        timeRef.current = nextCue.meetingStart;
        setTime(nextCue.meetingStart);
        return;
      }
      timeRef.current = meeting;
      setTime(meeting);
    };
    const onEnded = () => {
      audio.pause();
      setPlaying(false);
      setAudioStatus("ended");
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioStatus, segments]);

  useEffect(() => {
    if (audioStatus === "ready" || audioStatus === "loading") return;
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const delta = ((now - last) / 1000) * rateRef.current;
      last = now;
      const next = nextPlayhead(timeRef.current, delta, segments, bounds.current.end);
      timeRef.current = next;
      setTime(next);
      if (next >= bounds.current.end) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, audioStatus, segments]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || (audioStatus !== "ready" && audioStatus !== "ended")) return;
    audio.playbackRate = rateRef.current;
    if (!playing) {
      audio.pause();
      return;
    }
    if (audioStatus === "ended") setAudioStatus("ready");
    const pending = audio.play();
    pending?.catch(() => {
      setAudioStatus("unavailable");
      setPlaying(false);
    });
  }, [playing, audioStatus]);

  const seek = useCallback((seconds: number) => {
    const next = Math.min(bounds.current.end, Math.max(bounds.current.start, seconds));
    timeRef.current = next;
    setTime(next);
    setPlaying(true);
    if (statusRef.current === "ended") setAudioStatus("ready");
    const audio = audioRef.current;
    const cue = cueAtMeeting(cuesRef.current, next);
    if (audio && cue && statusRef.current !== "unavailable" && statusRef.current !== "off") {
      audio.currentTime = audioTimeFromMeeting(cue, next);
    }
    return next;
  }, []);

  const park = useCallback((seconds: number) => {
    const next = Math.min(bounds.current.end, Math.max(bounds.current.start, seconds));
    timeRef.current = next;
    setTime(next);
    const audio = audioRef.current;
    const cue = cueAtMeeting(cuesRef.current, next);
    if (audio && cue && statusRef.current !== "unavailable") {
      const apply = () => {
        audio.currentTime = audioTimeFromMeeting(cue, next);
      };
      if (audio.readyState >= 1) apply();
      else audio.addEventListener("loadedmetadata", apply, { once: true });
    }
  }, []);

  return { time, playing, rate, audioStatus, setPlaying, setRate, seek, park };
}
