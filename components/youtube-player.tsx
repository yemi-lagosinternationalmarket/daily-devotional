"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Song } from "@/lib/music";

interface YouTubePlayerProps {
  song: Song;
  nextSong?: Song;
  onNext: () => void;
  onPrev: () => void;
}

export function YouTubePlayer({ song, nextSong, onNext, onPrev }: YouTubePlayerProps) {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  function fmt(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // Load YT IFrame API once
  useEffect(() => {
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }, []);

  // Create player when song changes
  useEffect(() => {
    function create() {
      if (!containerRef.current) return;
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      setReady(false);
      setPlaying(false);
      setProgress(0);
      setCurrentTime("0:00");
      setDuration("0:00");

      playerRef.current = new YT.Player(containerRef.current, {
        width: "280",
        height: "158",
        videoId: song.youtubeId,
        playerVars: { controls: 0, disablekb: 1, fs: 0, modestbranding: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: YT.OnStateChangeEvent) => {
            setPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.ENDED) onNextRef.current();
          },
        },
      });
    }

    const win = window as unknown as { YT?: typeof YT; onYouTubeIframeAPIReady?: () => void };
    if (win.YT?.Player) {
      create();
    } else {
      const prev = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => { prev?.(); create(); };
    }

    return () => { playerRef.current?.destroy(); playerRef.current = null; };
  }, [song.youtubeId]);

  // Progress polling
  useEffect(() => {
    const interval = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime || !p?.getDuration) return;
      const cur = p.getCurrentTime();
      const dur = p.getDuration();
      if (dur > 0) {
        setProgress((cur / dur) * 100);
        setCurrentTime(fmt(cur));
        setDuration(fmt(dur));
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handlePlay = useCallback(() => {
    if (!playerRef.current || !ready) return;
    if (!started) {
      playerRef.current.playVideo();
      setStarted(true);
    } else if (playing) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [ready, started, playing]);

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const p = playerRef.current;
    if (!p?.getDuration || !p?.seekTo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    p.seekTo(pct * p.getDuration(), true);
  }

  function handlePrev() {
    onPrev();
    setStarted(false);
  }

  function handleNext() {
    onNext();
    setStarted(false);
  }

  return (
    <div className="text-center">
      {/* Video area */}
      <div className="w-[280px] h-[158px] rounded-[14px] bg-[var(--surface)] border border-[var(--surface-border)] mx-auto mb-6 overflow-hidden relative">
        <div ref={containerRef} className={started ? "w-full h-full pointer-events-none" : "absolute -left-[9999px] w-px h-px"} />
        {/* Overlay to block YouTube hover UI */}
        {started && <div className="absolute inset-0" />}
        {!started && (
          <div className="absolute inset-0">
            <img
              src={`https://img.youtube.com/vi/${song.youtubeId}/mqdefault.jpg`}
              alt={song.title}
              className="w-full h-full object-cover opacity-40"
            />
          </div>
        )}
      </div>

      <p className="text-base font-semibold text-[var(--text-primary)] mb-1 tracking-[-0.2px]">
        {song.title}
      </p>
      <p className="text-[13px] text-[var(--text-tertiary)] mb-5">
        {song.artist}
      </p>

      {/* Scrubber */}
      <div
        onClick={handleSeek}
        className="w-[260px] h-[3px] bg-[rgba(255,255,255,0.06)] rounded-sm mx-auto mb-2 overflow-hidden cursor-pointer group"
      >
        <div
          className="h-full bg-[rgba(255,255,255,0.25)] group-hover:bg-[rgba(255,255,255,0.4)] rounded-sm transition-colors"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between w-[260px] mx-auto text-[11px] text-[var(--text-faint)] tabular-nums mb-5">
        <span>{currentTime}</span>
        <span>{duration}</span>
      </div>

      {/* Controls: prev / play-pause / next */}
      <div className="flex items-center justify-center gap-8">
        <button onClick={handlePrev} className="w-9 h-9 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors text-base">
          ⏮
        </button>
        <button
          onClick={handlePlay}
          className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[var(--interactive-border)]
            flex items-center justify-center text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.1)]
            cursor-pointer transition-all text-lg"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={handleNext} className="w-9 h-9 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors text-base">
          ⏭
        </button>
      </div>

      {/* Up next */}
      {nextSong && (
        <p className="text-[11px] text-[var(--text-faint)] mt-4">
          Up next: {nextSong.title} — {nextSong.artist}
        </p>
      )}
    </div>
  );
}
