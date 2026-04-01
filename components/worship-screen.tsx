"use client";

import { useState, useCallback } from "react";
import { VibeBar } from "./vibe-bar";
import { YouTubePlayer } from "./youtube-player";
import { getSongsByVibe, searchSongs, type VibeType, type Song } from "@/lib/music";

interface WorshipScreenProps {
  isReady: boolean;
  onReady: () => void;
}

const ENCOURAGEMENTS = [
  '"Enter his gates with thanksgiving, and his courts with praise."',
  '"Be still, and know that I am God."',
  '"The Lord is near to all who call on him."',
  '"Draw near to God, and he will draw near to you."',
  '"In your presence there is fullness of joy."',
];

export function WorshipScreen({ isReady, onReady }: WorshipScreenProps) {
  const [vibe, setVibe] = useState<VibeType>("worship");
  const [songs, setSongs] = useState<Song[]>(getSongsByVibe("worship"));
  const [songIndex, setSongIndex] = useState(0);
  const [encourageIndex] = useState(
    Math.floor(Math.random() * ENCOURAGEMENTS.length)
  );

  function handleVibeChange(newVibe: VibeType) {
    setVibe(newVibe);
    const newSongs = getSongsByVibe(newVibe);
    setSongs(newSongs);
    setSongIndex(0);
  }

  function handleSearch(query: string) {
    const results = searchSongs(query);
    if (results.length > 0) {
      setSongs(results);
      setSongIndex(0);
    }
  }

  const handleNext = useCallback(() => {
    setSongIndex((i) => (i + 1) % songs.length);
  }, [songs.length]);

  function handlePrev() {
    setSongIndex((i) => (i - 1 + songs.length) % songs.length);
  }

  const currentSong = songs[songIndex];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none animate-[breathe_8s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.015) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 text-center max-w-[480px] w-full px-8">
        <p className="text-[13px] font-medium text-[var(--text-ghost)] tracking-[2px] uppercase mb-8">
          Prepare your heart
        </p>

        <div className="w-[320px] mx-auto mb-8">
          <VibeBar
            activeVibe={vibe}
            onVibeChange={handleVibeChange}
            onSearch={handleSearch}
          />
        </div>

        {currentSong && (
          <div className="mb-10">
            <YouTubePlayer
              song={currentSong}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          </div>
        )}

        <p className="text-sm italic text-[rgba(255,255,255,0.18)] leading-[1.6]">
          {ENCOURAGEMENTS[encourageIndex]}
        </p>
      </div>

      {/* Ready button */}
      {isReady && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 text-center">
          <button
            onClick={onReady}
            className="py-3.5 px-11 rounded-xl
              bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
              hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
              transition-all duration-150 cursor-pointer
              text-[15px] font-medium text-[var(--text-primary)]"
          >
            Your devotional is ready
          </button>
          <p className="text-[11px] text-[var(--text-faint)] mt-2">
            No rush — stay as long as you&apos;d like
          </p>
        </div>
      )}
    </div>
  );
}
