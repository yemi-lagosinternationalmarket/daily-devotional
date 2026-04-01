"use client";

import { useEffect, useRef, useState } from "react";
import type { Song } from "@/lib/music";

interface YouTubePlayerProps {
  song: Song;
  onNext: () => void;
  onPrev: () => void;
}

export function YouTubePlayer({ song, onNext, onPrev }: YouTubePlayerProps) {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existing) document.head.appendChild(tag);

    function initPlayer() {
      if (!containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        height: "0",
        width: "0",
        videoId: song.youtubeId,
        playerVars: { autoplay: 1, controls: 0 },
        events: {
          onReady: () => setIsPlaying(true),
          onStateChange: (e: YT.OnStateChangeEvent) => {
            if (e.data === YT.PlayerState.ENDED) onNext();
            setIsPlaying(e.data === YT.PlayerState.PLAYING);
          },
        },
      });
    }

    if ((window as unknown as { YT?: typeof YT }).YT?.Player) {
      initPlayer();
    } else {
      (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      playerRef.current?.destroy();
    };
  }, [song.youtubeId, onNext]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current?.getCurrentTime) return;
      const cur = playerRef.current.getCurrentTime();
      const dur = playerRef.current.getDuration();
      if (dur > 0) {
        setProgress((cur / dur) * 100);
        setCurrentTime(formatTime(cur));
        setDuration(formatTime(dur));
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  function formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function togglePlay() {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }

  return (
    <div className="text-center">
      {/* Hidden YouTube iframe */}
      <div ref={containerRef} className="hidden" />

      {/* Album art placeholder */}
      <div className="w-[180px] h-[180px] rounded-[14px] bg-[var(--surface)] border border-[var(--surface-border)] mx-auto mb-6 flex items-center justify-center">
        <span className="text-[44px] opacity-15">♫</span>
      </div>

      <p className="text-base font-semibold text-[var(--text-primary)] mb-1 tracking-[-0.2px]">
        {song.title}
      </p>
      <p className="text-[13px] text-[var(--text-tertiary)] mb-[18px]">
        {song.artist}
      </p>

      {/* Progress bar */}
      <div className="w-[260px] h-[3px] bg-[rgba(255,255,255,0.06)] rounded-sm mx-auto mb-2 overflow-hidden">
        <div
          className="h-full bg-[rgba(255,255,255,0.25)] rounded-sm transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between w-[260px] mx-auto text-[11px] text-[var(--text-faint)] tabular-nums">
        <span>{currentTime}</span>
        <span>{duration}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8 mt-[18px]">
        <button onClick={onPrev} className="w-9 h-9 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors text-base">
          ⏮
        </button>
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[var(--interactive-border)]
            flex items-center justify-center text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.1)]
            cursor-pointer transition-all text-lg"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button onClick={onNext} className="w-9 h-9 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors text-base">
          ⏭
        </button>
      </div>
    </div>
  );
}
