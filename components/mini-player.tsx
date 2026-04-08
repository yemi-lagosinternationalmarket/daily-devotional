"use client";

import { useMusicPlayer } from "@/lib/music-context";
import { Toast } from "./toast";

export function MiniPlayer() {
  const { currentSong, playing, togglePlay, next, progress, showMiniPlayer, toastMessage, dismissToast } = useMusicPlayer();

  return (
    <>
      {toastMessage && <Toast message={toastMessage} onDismiss={dismissToast} />}

      {showMiniPlayer && currentSong && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          {/* Progress bar on top edge */}
          <div className="h-[2px] bg-[rgba(255,255,255,0.04)]">
            <div
              className="h-full bg-[rgba(255,255,255,0.2)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="h-12 bg-[var(--background)] border-t border-[var(--surface-border)] flex items-center px-4 gap-3">
            {/* Thumbnail */}
            {(currentSong.albumArt || currentSong.youtubeId) && (
              <img
                src={currentSong.albumArt || `https://img.youtube.com/vi/${currentSong.youtubeId}/default.jpg`}
                alt=""
                className="w-8 h-8 rounded object-cover opacity-60"
              />
            )}

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {currentSong.title}
              </p>
              <p className="text-[10px] text-[var(--text-faint)] truncate">
                {currentSong.artist}
              </p>
            </div>

            {/* Controls */}
            <button
              onClick={togglePlay}
              className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              onClick={next}
              className="w-8 h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors text-sm"
            >
              ⏭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
