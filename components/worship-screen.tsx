"use client";

import { useState, useEffect, useCallback } from "react";
import { VibeBar } from "./vibe-bar";
import { useMusicPlayer } from "@/lib/music-context";
import { getSongsForContext, searchSongs, type VibeType, type Song } from "@/lib/music";
import { searchSpotify, getPlaylistTracks, getWorshipPlaylist, type SpotifyTrack } from "@/lib/spotify";

interface WorshipScreenProps {
  isReady: boolean;
  onReady: () => void;
  onBack: () => void;
  status: string | null;
  error?: boolean;
  defaultVibe?: string;
  topic?: string | null;
  mood?: string | null;
}

const ENCOURAGEMENTS = [
  '"Enter his gates with thanksgiving, and his courts with praise."',
  '"Be still, and know that I am God."',
  '"The Lord is near to all who call on him."',
  '"Draw near to God, and he will draw near to you."',
  '"In your presence there is fullness of joy."',
];

function spotifyTrackToSong(track: SpotifyTrack, vibe: VibeType): Song {
  return {
    title: track.name,
    artist: track.artists,
    youtubeId: "",
    spotifyUri: track.uri,
    albumArt: track.albumArt,
    vibe,
  };
}

export function WorshipScreen({ isReady, onReady, onBack, status, error, defaultVibe, topic, mood }: WorshipScreenProps) {
  const music = useMusicPlayer();
  const initialVibe = (defaultVibe as VibeType) || "worship";
  const [vibe, setVibe] = useState<VibeType>(initialVibe);
  const [encourageIndex] = useState(Math.floor(Math.random() * ENCOURAGEMENTS.length));
  const [spotifySettings, setSpotifySettings] = useState<{
    connected: boolean;
    accessToken: string | null;
    playlists: Record<VibeType, string | null>;
  }>({ connected: false, accessToken: null, playlists: { praise: null, worship: null, instrumental: null } });

  // Fetch Spotify settings on mount
  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((s) => {
      if (s?.spotify_connected && s?.spotify_access_token) {
        setSpotifySettings({
          connected: true,
          accessToken: s.spotify_access_token,
          playlists: {
            praise: s.spotify_playlist_praise || null,
            worship: s.spotify_playlist_worship || null,
            instrumental: s.spotify_playlist_instrumental || null,
          },
        });
      }
    }).catch(() => {});
  }, []);

  // Load songs for a vibe (Spotify or YouTube)
  const loadVibePlaylist = useCallback(async (v: VibeType) => {
    if (spotifySettings.connected && spotifySettings.accessToken) {
      const playlistId = spotifySettings.playlists[v];
      let tracks: SpotifyTrack[];

      if (playlistId) {
        tracks = await getPlaylistTracks(playlistId, spotifySettings.accessToken, v);
      } else {
        tracks = await getWorshipPlaylist(v, spotifySettings.accessToken);
      }

      if (tracks.length > 0) {
        const songs = tracks.map((t) => spotifyTrackToSong(t, v));
        music.setPlaylist(songs, true);
        music.play();
        return;
      }
    }

    // Fallback: YouTube curated
    const songs = getSongsForContext(v, topic, mood);
    music.setPlaylist(songs, true);
    music.play();
  }, [spotifySettings, topic, mood, music]);

  // Set initial playlist on mount
  useEffect(() => {
    music.setShowMiniPlayer(false);
    loadVibePlaylist(initialVibe);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifySettings.connected]);

  function handleVibeChange(newVibe: VibeType) {
    setVibe(newVibe);
    loadVibePlaylist(newVibe);
  }

  async function handleSearch(query: string) {
    if (spotifySettings.connected && spotifySettings.accessToken) {
      const tracks = await searchSpotify(query, spotifySettings.accessToken);
      if (tracks.length > 0) {
        const songs = tracks.map((t) => spotifyTrackToSong(t, vibe));
        music.setPlaylist(songs, true);
        music.play();
        return;
      }
    }

    // Fallback: local search
    const results = searchSongs(query);
    if (results.length > 0) {
      music.setPlaylist(results, true);
      music.play();
    }
  }

  function handleReady() {
    music.setShowMiniPlayer(true);
    music.setVolume(60);
    onReady();
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    music.seek(pct);
  }

  const albumArtUrl = music.currentSong?.albumArt
    || (music.currentSong?.youtubeId ? `https://img.youtube.com/vi/${music.currentSong.youtubeId}/mqdefault.jpg` : null);

  const nextSong = music.playlist[(music.songIndex + 1) % music.playlist.length] || null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <button
        onClick={onBack}
        className="fixed top-8 left-8 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer z-10"
      >
        ← Back
      </button>

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

        {music.currentSong && (
          <div className="mb-10">
            {/* Album art */}
            <div className="w-[280px] h-[158px] rounded-[14px] bg-[var(--surface)] border border-[var(--surface-border)] mx-auto mb-6 overflow-hidden relative">
              {albumArtUrl && (
                <img
                  src={albumArtUrl}
                  alt={music.currentSong.title}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${music.playing ? "opacity-60" : "opacity-40"}`}
                />
              )}
            </div>

            <p className="text-base font-semibold text-[var(--text-primary)] mb-1 tracking-[-0.2px]">
              {music.currentSong.title}
            </p>
            <p className="text-[13px] text-[var(--text-tertiary)] mb-5">
              {music.currentSong.artist}
            </p>

            {/* Scrubber */}
            <div
              onClick={handleSeek}
              className="w-[260px] h-[3px] bg-[rgba(255,255,255,0.06)] rounded-sm mx-auto mb-2 overflow-hidden cursor-pointer group"
            >
              <div
                className="h-full bg-[rgba(255,255,255,0.25)] group-hover:bg-[rgba(255,255,255,0.4)] rounded-sm transition-colors"
                style={{ width: `${music.progress}%` }}
              />
            </div>
            <div className="flex justify-between w-[260px] mx-auto text-[11px] text-[var(--text-faint)] tabular-nums mb-5">
              <span>{music.currentTime}</span>
              <span>{music.duration}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-8">
              <button onClick={music.prev} className="w-9 h-9 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors text-base">
                ⏮
              </button>
              <button
                onClick={music.togglePlay}
                className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.08)] border border-[var(--interactive-border)]
                  flex items-center justify-center text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.1)]
                  cursor-pointer transition-all text-lg"
              >
                {music.playing ? "⏸" : "▶"}
              </button>
              <button onClick={music.next} className="w-9 h-9 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] cursor-pointer transition-colors text-base">
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
        )}

        <p className="text-sm italic text-[rgba(255,255,255,0.18)] leading-[1.6]">
          {ENCOURAGEMENTS[encourageIndex]}
        </p>
      </div>

      {/* Bottom area */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 text-center">
        {isReady ? (
          <>
            <button
              onClick={handleReady}
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
          </>
        ) : status ? (
          <div className="flex flex-col items-center gap-4">
            {!error && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.4)] animate-[bounce_1.4s_ease-in-out_infinite]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.4)] animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.4)] animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
            )}
            <p className={`text-[13px] transition-all duration-500 ${error ? "text-[rgba(255,255,255,0.35)]" : "text-[var(--text-ghost)]"}`}>
              {status}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
