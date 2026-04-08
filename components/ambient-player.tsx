"use client";

import { useEffect, useRef, useState } from "react";

// Soft ambient worship loops — long, no lyrics, pure atmosphere
const AMBIENT_TRACKS = [
  { id: "q6rVXv5kAF4", label: "Be Still" },
  { id: "81hxv1KYk3A", label: "Peaceful Piano" },
  { id: "41sqgwkyt0g", label: "Seek The Lord" },
  { id: "xMrJE8vkOpY", label: "God's Promises" },
  { id: "Ug0QVIlowtI", label: "Clean Heart" },
];

interface AmbientPlayerProps {
  active: boolean; // true during Read through Apply
  volume?: number; // 0-100, default 15
}

export function AmbientPlayer({ active, volume = 15 }: AmbientPlayerProps) {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [trackIndex] = useState(Math.floor(Math.random() * AMBIENT_TRACKS.length));

  const track = AMBIENT_TRACKS[trackIndex];

  // Create container outside React's DOM tree
  useEffect(() => {
    const el = document.createElement("div");
    el.id = "yt-ambient-player";
    el.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";
    document.body.appendChild(el);
    containerRef.current = el;
    return () => { el.remove(); };
  }, []);

  // Create player once
  useEffect(() => {
    if (!active) return;

    function create() {
      if (!containerRef.current || playerRef.current) return;

      // Create a fresh child div (YT.Player replaces the element)
      containerRef.current.innerHTML = "";
      const el = document.createElement("div");
      containerRef.current.appendChild(el);

      playerRef.current = new YT.Player(el, {
        width: "1",
        height: "1",
        videoId: track.id,
        playerVars: {
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          autoplay: 1,
          loop: 1,
          playlist: track.id, // Required for loop to work
        },
        events: {
          onReady: (e: YT.PlayerEvent) => {
            e.target.setVolume(volume);
            e.target.playVideo();
            setReady(true);
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

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      setReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, track.id]);

  // Sync volume
  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (muted) {
      playerRef.current.setVolume(0);
    } else {
      playerRef.current.setVolume(volume);
    }
  }, [volume, muted, ready]);

  // Pause/resume based on active
  useEffect(() => {
    if (!ready || !playerRef.current) return;
    if (active) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [active, ready]);

  if (!active) return null;

  return (
    <>
      {/* Tiny mute toggle in bottom-right */}
      <button
        onClick={() => setMuted(!muted)}
        className="fixed bottom-16 right-4 z-50 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--surface-border)]
          flex items-center justify-center text-xs cursor-pointer
          hover:bg-[var(--surface-hover)] transition-colors"
        title={muted ? "Unmute ambient" : "Mute ambient"}
      >
        {muted ? "🔇" : "🎵"}
      </button>
    </>
  );
}
