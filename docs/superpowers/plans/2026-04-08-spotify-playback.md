# Spotify Web Playback SDK Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the Spotify Web Playback SDK so that when a user has Spotify Premium connected, all worship music plays through Spotify instead of YouTube — including support for user-designated playlists per vibe.

**Architecture:** `MusicProvider` in `music-context.tsx` gains a `backend` field (`"youtube" | "spotify"`). On mount it fetches user settings; if Spotify is connected, it loads the Spotify Web Playback SDK and creates a `Spotify.Player` instance. All existing controls (`play`, `pause`, `next`, `prev`, `seek`, `volume`) delegate to the SDK. YouTube remains the fallback. The `Song` type gains optional `spotifyUri` and `albumArt` fields. Settings UI adds three playlist-per-vibe input fields. A toast component handles fallback notifications.

**Tech Stack:** Spotify Web Playback SDK, Spotify Web API, Next.js App Router, React context, PostgreSQL, Vitest

**Spec:** `docs/superpowers/specs/2026-04-08-spotify-playback-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/music.ts` | Modify | Add `spotifyUri`, `albumArt` to `Song` type |
| `lib/spotify.ts` | Modify | Add `parsePlaylistId()`, `getPlaylistTracks()`, `getSpotifyPlaylistName()` |
| `lib/types.ts` | Modify | Add playlist columns to `UserSettings` |
| `lib/queries.ts` | Modify | Add playlist columns to `allowed` array |
| `init.sql` | Modify | Add 3 playlist columns to `user_settings` |
| `lib/music-context.tsx` | Rewrite | Dual-backend (YouTube/Spotify), token refresh, error fallback |
| `components/toast.tsx` | Create | Simple auto-dismiss toast component |
| `components/worship-screen.tsx` | Modify | Use Spotify search + album art when connected |
| `components/mini-player.tsx` | Modify | Use `albumArt` field when available |
| `app/settings/page.tsx` | Modify | Add 3 playlist input fields with name resolution |
| `app/api/settings/route.ts` | No change | Already delegates to `updateUserSettings` which uses `allowed` array |
| `__tests__/lib/spotify.test.ts` | Create | Test `parsePlaylistId()` |

---

## Task 1: Extend Song type and UserSettings type

**Files:**
- Modify: `lib/music.ts:1-7`
- Modify: `lib/types.ts:63-76`

- [ ] **Step 1: Update Song interface in lib/music.ts**

```ts
export interface Song {
  title: string;
  artist: string;
  youtubeId: string;
  spotifyUri?: string;
  albumArt?: string;
  vibe: "praise" | "worship" | "instrumental";
  tags?: string[];
}
```

- [ ] **Step 2: Update UserSettings interface in lib/types.ts**

Add the three playlist fields after the existing Spotify fields:

```ts
export interface UserSettings {
  id: string;
  user_id: string;
  llm_base_url: string;
  llm_api_key: string | null;
  llm_model: string;
  bible_translation: string;
  default_vibe: string;
  theme: string;
  spotify_access_token: string | null;
  spotify_refresh_token: string | null;
  spotify_connected: boolean;
  spotify_playlist_praise: string | null;
  spotify_playlist_worship: string | null;
  spotify_playlist_instrumental: string | null;
  updated_at: string;
}
```

- [ ] **Step 3: Run existing tests to verify nothing breaks**

Run: `npx vitest run __tests__/lib/music.test.ts`
Expected: All 4 tests PASS (adding optional fields doesn't break existing Song objects)

- [ ] **Step 4: Commit**

```bash
git add lib/music.ts lib/types.ts
git commit -m "feat(spotify): extend Song and UserSettings types with Spotify fields"
```

---

## Task 2: Database migration and queries update

**Files:**
- Modify: `init.sql:14-27`
- Modify: `lib/queries.ts:17`

- [ ] **Step 1: Add columns to init.sql**

After the `spotify_connected` line (line 25), add:

```sql
  spotify_playlist_praise TEXT,
  spotify_playlist_worship TEXT,
  spotify_playlist_instrumental TEXT,
```

- [ ] **Step 2: Run the ALTER TABLE on the live database**

Since the DB already exists, run the migration directly:

```bash
docker exec devotional-db psql -U devotional -d devotional -c "
  ALTER TABLE user_settings
    ADD COLUMN IF NOT EXISTS spotify_playlist_praise TEXT,
    ADD COLUMN IF NOT EXISTS spotify_playlist_worship TEXT,
    ADD COLUMN IF NOT EXISTS spotify_playlist_instrumental TEXT;
"
```

Expected: `ALTER TABLE`

- [ ] **Step 3: Add new columns to allowed list in queries.ts**

Change line 17 in `lib/queries.ts` from:

```ts
  const allowed = ["llm_base_url", "llm_api_key", "llm_model", "bible_translation", "default_vibe", "theme", "spotify_access_token", "spotify_refresh_token", "spotify_connected"];
```

to:

```ts
  const allowed = ["llm_base_url", "llm_api_key", "llm_model", "bible_translation", "default_vibe", "theme", "spotify_access_token", "spotify_refresh_token", "spotify_connected", "spotify_playlist_praise", "spotify_playlist_worship", "spotify_playlist_instrumental"];
```

- [ ] **Step 4: Commit**

```bash
git add init.sql lib/queries.ts
git commit -m "feat(spotify): add playlist columns to user_settings"
```

---

## Task 3: Spotify playlist helpers and tests

**Files:**
- Modify: `lib/spotify.ts`
- Create: `__tests__/lib/spotify.test.ts`

- [ ] **Step 1: Write tests for parsePlaylistId**

Create `__tests__/lib/spotify.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parsePlaylistId } from "@/lib/spotify";

describe("parsePlaylistId", () => {
  it("extracts ID from full Spotify URL", () => {
    expect(parsePlaylistId("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")).toBe("37i9dQZF1DXcBWIGoYBM5M");
  });

  it("extracts ID from URL with query params", () => {
    expect(parsePlaylistId("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc123")).toBe("37i9dQZF1DXcBWIGoYBM5M");
  });

  it("extracts ID from Spotify URI", () => {
    expect(parsePlaylistId("spotify:playlist:37i9dQZF1DXcBWIGoYBM5M")).toBe("37i9dQZF1DXcBWIGoYBM5M");
  });

  it("returns raw string if already a plain ID", () => {
    expect(parsePlaylistId("37i9dQZF1DXcBWIGoYBM5M")).toBe("37i9dQZF1DXcBWIGoYBM5M");
  });

  it("returns null for empty string", () => {
    expect(parsePlaylistId("")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(parsePlaylistId("https://example.com/not-spotify")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/lib/spotify.test.ts`
Expected: FAIL — `parsePlaylistId` is not exported from `@/lib/spotify`

- [ ] **Step 3: Implement parsePlaylistId, getPlaylistTracks, getSpotifyPlaylistName**

Add to the bottom of `lib/spotify.ts`:

```ts
/**
 * Extract a Spotify playlist ID from a URL, URI, or raw ID.
 * Returns null if the input can't be parsed.
 */
export function parsePlaylistId(input: string): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();

  // https://open.spotify.com/playlist/ABC123?si=...
  const urlMatch = trimmed.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // spotify:playlist:ABC123
  const uriMatch = trimmed.match(/^spotify:playlist:([A-Za-z0-9]+)$/);
  if (uriMatch) return uriMatch[1];

  // Plain ID (alphanumeric, 22 chars typical)
  if (/^[A-Za-z0-9]{15,}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * Fetch tracks from a Spotify playlist, mapped to Song[].
 */
export async function getPlaylistTracks(
  playlistId: string,
  accessToken: string,
  vibe: "praise" | "worship" | "instrumental"
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&fields=items(track(id,name,uri,duration_ms,artists(name),album(images)))`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) return [];
  const data = await response.json();

  return (data.items || [])
    .filter((item: Record<string, unknown>) => item.track)
    .map((item: Record<string, unknown>) => {
      const t = item.track as Record<string, unknown>;
      return {
        id: t.id as string,
        name: t.name as string,
        artists: ((t.artists as Array<{ name: string }>) || []).map((a) => a.name).join(", "),
        uri: t.uri as string,
        albumArt: ((t.album as Record<string, unknown>)?.images as Array<{ url: string }>)?.[1]?.url || "",
        durationMs: t.duration_ms as number,
      };
    });
}

/**
 * Fetch just the name of a Spotify playlist.
 */
export async function getSpotifyPlaylistName(
  playlistId: string,
  accessToken: string
): Promise<string | null> {
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=name`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) return null;
  const data = await response.json();
  return data.name || null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/lib/spotify.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Run all existing tests for regression**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add lib/spotify.ts __tests__/lib/spotify.test.ts
git commit -m "feat(spotify): add playlist ID parser, track fetcher, and name resolver"
```

---

## Task 4: Toast component

**Files:**
- Create: `components/toast.tsx`

- [ ] **Step 1: Create the toast component**

Create `components/toast.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, duration = 5000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade-out
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]
        py-2.5 px-5 rounded-xl
        bg-[rgba(30,30,32,0.95)] border border-[var(--surface-border)]
        text-[13px] text-[var(--text-secondary)]
        transition-opacity duration-300
        ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {message}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/toast.tsx
git commit -m "feat: add Toast component for transient notifications"
```

---

## Task 5: Rewrite MusicProvider with dual backend

This is the core task. `lib/music-context.tsx` gets rewritten to support both YouTube and Spotify backends.

**Files:**
- Modify: `lib/music-context.tsx` (full rewrite)

- [ ] **Step 1: Rewrite music-context.tsx**

Replace the entire contents of `lib/music-context.tsx` with:

```tsx
"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import type { Song } from "./music";
import { refreshToken as spotifyRefreshToken } from "./spotify";

type Backend = "youtube" | "spotify";

interface MusicState {
  currentSong: Song | null;
  playlist: Song[];
  songIndex: number;
  playing: boolean;
  started: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  volume: number;
  showMiniPlayer: boolean;
  backend: Backend;
  toastMessage: string | null;
}

interface MusicControls {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  setPlaylist: (songs: Song[], autoplay?: boolean) => void;
  setShowMiniPlayer: (show: boolean) => void;
  dismissToast: () => void;
}

const MusicContext = createContext<(MusicState & MusicControls) | null>(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusicPlayer must be inside MusicProvider");
  return ctx;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [playlist, setPlaylistState] = useState<Song[]>([]);
  const [songIndex, setSongIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolumeState] = useState(100);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [backend, setBackend] = useState<Backend>("youtube");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs for players
  const ytPlayerRef = useRef<YT.Player | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const spotifyPlayerRef = useRef<Spotify.Player | null>(null);
  const spotifyDeviceIdRef = useRef<string | null>(null);
  const spotifyTokenRef = useRef<string | null>(null);

  const currentSong = playlist[songIndex] || null;

  // ── Fallback to YouTube ──
  const fallbackToYouTube = useCallback((message?: string) => {
    setBackend("youtube");
    if (spotifyPlayerRef.current) {
      spotifyPlayerRef.current.disconnect();
      spotifyPlayerRef.current = null;
    }
    spotifyDeviceIdRef.current = null;
    if (message) setToastMessage(message);
  }, []);

  // ── Spotify token refresh ──
  const refreshSpotifyToken = useCallback(async (): Promise<string | null> => {
    try {
      const settingsRes = await fetch("/api/settings");
      const settings = await settingsRes.json();
      if (!settings?.spotify_refresh_token) return null;

      const tokens = await spotifyRefreshToken(settings.spotify_refresh_token);
      spotifyTokenRef.current = tokens.access_token;

      // Save refreshed token back to DB
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotify_access_token: tokens.access_token,
          spotify_refresh_token: tokens.refresh_token,
        }),
      });

      return tokens.access_token;
    } catch {
      return null;
    }
  }, []);

  // ── Initialize backend on mount ──
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/settings");
        const settings = await res.json();

        if (!settings?.spotify_connected || !settings?.spotify_access_token) {
          setBackend("youtube");
          return;
        }

        spotifyTokenRef.current = settings.spotify_access_token;

        // Load Spotify SDK script
        if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
          const script = document.createElement("script");
          script.src = "https://sdk.scdn.co/spotify-player.js";
          document.head.appendChild(script);
        }

        // Wait for SDK to be ready
        await new Promise<void>((resolve) => {
          const win = window as unknown as { Spotify?: typeof Spotify; onSpotifyWebPlaybackSDKReady?: () => void };
          if (win.Spotify?.Player) {
            resolve();
            return;
          }
          const prev = win.onSpotifyWebPlaybackSDKReady;
          win.onSpotifyWebPlaybackSDKReady = () => {
            prev?.();
            resolve();
          };
        });

        if (cancelled) return;

        const player = new Spotify.Player({
          name: "Daily Devotional",
          getOAuthToken: async (cb) => {
            let token = spotifyTokenRef.current;
            if (!token) {
              token = await refreshSpotifyToken();
            }
            cb(token || "");
          },
          volume: volume / 100,
        });

        // Error handlers — all fall back to YouTube
        const errorHandler = (msg: string) => () => {
          if (!cancelled) fallbackToYouTube(msg);
        };
        player.addListener("initialization_error", errorHandler("Spotify unavailable, using built-in music."));
        player.addListener("authentication_error", async () => {
          const newToken = await refreshSpotifyToken();
          if (!newToken && !cancelled) {
            fallbackToYouTube("Spotify unavailable, using built-in music.");
          }
        });
        player.addListener("account_error", errorHandler("Spotify Premium required. Using built-in music."));
        player.addListener("playback_error", errorHandler("Spotify playback error. Using built-in music."));

        // Ready
        player.addListener("ready", ({ device_id }: { device_id: string }) => {
          if (cancelled) return;
          spotifyDeviceIdRef.current = device_id;
          spotifyPlayerRef.current = player;
          setBackend("spotify");
        });

        player.addListener("not_ready", () => {
          spotifyDeviceIdRef.current = null;
        });

        // State changes for progress tracking
        player.addListener("player_state_changed", (state: Spotify.PlaybackState | null) => {
          if (!state || cancelled) return;
          setPlaying(!state.paused);
          if (state.duration > 0) {
            setProgress((state.position / state.duration) * 100);
            setCurrentTime(fmt(state.position / 1000));
            setDuration(fmt(state.duration / 1000));
          }
          // Track ended — advance to next
          if (state.paused && state.position === 0 && state.track_window.previous_tracks.length > 0) {
            setSongIndex((i) => (i + 1) % (playlist.length || 1));
          }
        });

        await player.connect();
      } catch {
        if (!cancelled) setBackend("youtube");
      }
    }

    init();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── YouTube setup (only when backend is youtube) ──
  useEffect(() => {
    if (backend !== "youtube" || typeof window === "undefined") return;

    // Create hidden container
    if (!document.getElementById("yt-music-player")) {
      const el = document.createElement("div");
      el.id = "yt-music-player";
      el.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";
      document.body.appendChild(el);
      ytContainerRef.current = el;
    }

    // Load YT API
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
  }, [backend]);

  // ── Play song when currentSong or songIndex changes ──
  const videoId = currentSong?.youtubeId;
  const spotifyUri = currentSong?.spotifyUri;

  // YouTube: create player when song changes
  useEffect(() => {
    if (backend !== "youtube" || !videoId) return;

    function create() {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }

      const parent = document.getElementById("yt-music-player");
      if (!parent) return;
      parent.innerHTML = "";
      const el = document.createElement("div");
      parent.appendChild(el);

      setProgress(0);
      setCurrentTime("0:00");
      setDuration("0:00");

      ytPlayerRef.current = new YT.Player(el, {
        width: "1",
        height: "1",
        videoId,
        playerVars: { controls: 0, disablekb: 1, fs: 0, modestbranding: 1, autoplay: 1 },
        events: {
          onReady: (e: YT.PlayerEvent) => {
            e.target.setVolume(volume);
            if (started) e.target.playVideo();
          },
          onStateChange: (e: YT.OnStateChangeEvent) => {
            setPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.ENDED) {
              setSongIndex((i) => (i + 1) % playlist.length);
            }
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
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, backend]);

  // Spotify: play track when song changes
  useEffect(() => {
    if (backend !== "spotify" || !spotifyUri || !spotifyDeviceIdRef.current) return;

    const token = spotifyTokenRef.current;
    if (!token) return;

    setProgress(0);
    setCurrentTime("0:00");
    setDuration("0:00");

    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceIdRef.current}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [spotifyUri] }),
    }).then((res) => {
      if (res.ok) {
        setPlaying(true);
        setStarted(true);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyUri, songIndex, backend]);

  // ── YouTube progress polling ──
  useEffect(() => {
    if (backend !== "youtube") return;
    const interval = setInterval(() => {
      const p = ytPlayerRef.current;
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
  }, [backend]);

  // ── Spotify progress polling ──
  useEffect(() => {
    if (backend !== "spotify") return;
    const interval = setInterval(async () => {
      const state = await spotifyPlayerRef.current?.getCurrentState();
      if (!state) return;
      if (state.duration > 0) {
        setProgress((state.position / state.duration) * 100);
        setCurrentTime(fmt(state.position / 1000));
        setDuration(fmt(state.duration / 1000));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [backend]);

  // ── Volume sync ──
  useEffect(() => {
    if (backend === "youtube") {
      ytPlayerRef.current?.setVolume?.(volume);
    } else {
      spotifyPlayerRef.current?.setVolume(volume / 100);
    }
  }, [volume, backend]);

  // ── Controls ──
  const play = useCallback(() => {
    if (backend === "youtube") {
      ytPlayerRef.current?.playVideo();
    } else {
      spotifyPlayerRef.current?.resume();
    }
    setStarted(true);
    setPlaying(true);
  }, [backend]);

  const pause = useCallback(() => {
    if (backend === "youtube") {
      ytPlayerRef.current?.pauseVideo();
    } else {
      spotifyPlayerRef.current?.pause();
    }
    setPlaying(false);
  }, [backend]);

  const togglePlay = useCallback(() => {
    if (playing) pause(); else play();
  }, [playing, play, pause]);

  const next = useCallback(() => {
    setSongIndex((i) => (i + 1) % playlist.length);
  }, [playlist.length]);

  const prev = useCallback(() => {
    setSongIndex((i) => (i - 1 + playlist.length) % playlist.length);
  }, [playlist.length]);

  const seek = useCallback((pct: number) => {
    if (backend === "youtube") {
      const p = ytPlayerRef.current;
      if (p?.getDuration && p?.seekTo) {
        p.seekTo(pct * p.getDuration(), true);
      }
    } else {
      spotifyPlayerRef.current?.getCurrentState().then((state) => {
        if (state) {
          spotifyPlayerRef.current?.seek(pct * state.duration);
        }
      });
    }
  }, [backend]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
  }, []);

  const setPlaylist = useCallback((songs: Song[], autoplay = true) => {
    setPlaylistState(songs);
    setSongIndex(0);
    if (autoplay) setStarted(true);
  }, []);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  return (
    <MusicContext.Provider value={{
      currentSong, playlist, songIndex, playing, started, progress,
      currentTime, duration, volume, showMiniPlayer, backend, toastMessage,
      play, pause, togglePlay, next, prev, seek, setVolume,
      setPlaylist, setShowMiniPlayer, dismissToast,
    }}>
      {children}
    </MusicContext.Provider>
  );
}
```

- [ ] **Step 2: Run existing tests**

Run: `npx vitest run`
Expected: All tests PASS (music-context isn't unit-tested, Song type is backward-compatible)

- [ ] **Step 3: Manual smoke test — YouTube still works**

Open the app in a browser. Without Spotify connected, navigate to the worship screen. Verify music plays via YouTube as before.

- [ ] **Step 4: Commit**

```bash
git add lib/music-context.tsx
git commit -m "feat(spotify): rewrite MusicProvider with dual YouTube/Spotify backend"
```

---

## Task 6: Update worship-screen for Spotify

**Files:**
- Modify: `components/worship-screen.tsx`

- [ ] **Step 1: Update worship-screen.tsx**

Replace the entire contents of `components/worship-screen.tsx` with:

```tsx
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
          <div className="flex items-center gap-2.5">
            {!error && (
              <div className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.25)] animate-[pulse_2s_ease-in-out_infinite]" />
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
```

- [ ] **Step 2: Verify the app compiles**

Check the terminal running `npm run dev` for TypeScript errors. There should be none.

- [ ] **Step 3: Manual smoke test**

Without Spotify: worship screen should work identically to before (YouTube curated songs, vibe switching, search).

- [ ] **Step 4: Commit**

```bash
git add components/worship-screen.tsx
git commit -m "feat(spotify): worship screen uses Spotify search and playlists when connected"
```

---

## Task 7: Update mini-player for Spotify album art

**Files:**
- Modify: `components/mini-player.tsx`

- [ ] **Step 1: Update mini-player to use albumArt field**

Replace the entire contents of `components/mini-player.tsx` with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/mini-player.tsx
git commit -m "feat(spotify): mini-player uses Spotify album art and shows toast"
```

---

## Task 8: Settings UI — playlist input fields

**Files:**
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: Update the Spotify section in settings**

In `app/settings/page.tsx`, replace the Spotify section (lines 198-229) with:

```tsx
      {/* Spotify */}
      <div className={sectionClass}>
        <p className={labelClass}>Spotify</p>
        <p className="text-xs text-[var(--text-faint)] mb-4">
          Connect Spotify for full music catalog access. Requires Spotify Premium for playback.
        </p>
        {settings.spotify_connected ? (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1DB954]" />
                <span className="text-sm text-[var(--text-secondary)]">Connected</span>
              </div>
              <button
                onClick={() => save({
                  spotify_connected: false,
                  spotify_access_token: null,
                  spotify_refresh_token: null,
                  spotify_playlist_praise: null,
                  spotify_playlist_worship: null,
                  spotify_playlist_instrumental: null,
                } as unknown as Partial<Settings>)}
                className="text-sm text-[var(--text-faint)] hover:text-[var(--text-ghost)] cursor-pointer"
              >
                Disconnect
              </button>
            </div>

            <SpotifyPlaylistField
              label="Praise Playlist"
              value={settings.spotify_playlist_praise || ""}
              accessToken={settings.spotify_access_token}
              onSave={(id) => save({ spotify_playlist_praise: id } as unknown as Partial<Settings>)}
            />
            <SpotifyPlaylistField
              label="Worship Playlist"
              value={settings.spotify_playlist_worship || ""}
              accessToken={settings.spotify_access_token}
              onSave={(id) => save({ spotify_playlist_worship: id } as unknown as Partial<Settings>)}
            />
            <SpotifyPlaylistField
              label="Instrumental Playlist"
              value={settings.spotify_playlist_instrumental || ""}
              accessToken={settings.spotify_access_token}
              onSave={(id) => save({ spotify_playlist_instrumental: id } as unknown as Partial<Settings>)}
            />
          </div>
        ) : (
          <button
            onClick={() => startSpotifyAuth()}
            className="py-2.5 px-6 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]
              hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]
              transition-all duration-150 cursor-pointer text-sm text-[var(--text-secondary)]
              flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-[#1DB954] opacity-50" />
            Connect Spotify
          </button>
        )}
      </div>
```

- [ ] **Step 2: Add the SpotifyPlaylistField component**

Add this component and the updated Settings interface to the same file, above `function SettingsContent()`:

```tsx
import { parsePlaylistId, getSpotifyPlaylistName } from "@/lib/spotify";

interface Settings {
  llm_base_url: string;
  llm_api_key: string | null;
  llm_model: string;
  spotify_connected: boolean;
  spotify_access_token: string | null;
  spotify_playlist_praise: string | null;
  spotify_playlist_worship: string | null;
  spotify_playlist_instrumental: string | null;
  bible_translation: string;
  default_vibe: string;
  theme: string;
}

function SpotifyPlaylistField({
  label,
  value,
  accessToken,
  onSave,
}: {
  label: string;
  value: string;
  accessToken: string | null;
  onSave: (playlistId: string | null) => void;
}) {
  const [input, setInput] = useState(value);
  const [playlistName, setPlaylistName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolve playlist name on mount if we have a saved ID
  useEffect(() => {
    if (value && accessToken) {
      setLoading(true);
      getSpotifyPlaylistName(value, accessToken)
        .then((name) => setPlaylistName(name))
        .finally(() => setLoading(false));
    }
  }, [value, accessToken]);

  async function handleBlur() {
    const trimmed = input.trim();
    if (!trimmed) {
      onSave(null);
      setPlaylistName(null);
      return;
    }

    const id = parsePlaylistId(trimmed);
    if (!id) return;

    // Save the parsed ID (not the raw URL)
    setInput(id);
    onSave(id);

    // Resolve playlist name
    if (accessToken) {
      setLoading(true);
      const name = await getSpotifyPlaylistName(id, accessToken);
      setPlaylistName(name);
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-2">
        {label}
      </p>
      <input
        className="w-full p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] outline-none focus:border-[var(--surface-hover-border)]"
        placeholder="Paste Spotify playlist link or URI"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={handleBlur}
      />
      {loading ? (
        <p className="text-[11px] text-[var(--text-faint)] mt-1.5">Loading...</p>
      ) : playlistName ? (
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">→ {playlistName}</p>
      ) : value ? (
        <p className="text-[11px] text-[var(--text-faint)] mt-1.5">Could not resolve playlist name</p>
      ) : (
        <p className="text-[11px] text-[var(--text-faint)] mt-1.5">(not set — will use default search)</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Remove the old Settings interface**

Delete the old `interface Settings` block (lines 8-16 in the original file) since the new one above replaces it. Also remove the duplicate `useState` import if present — `SpotifyPlaylistField` uses `useState` and `useEffect` which are already imported at the top.

- [ ] **Step 4: Verify the app compiles**

Check the terminal for TypeScript errors. There should be none.

- [ ] **Step 5: Manual smoke test**

1. Open Settings. Verify the Spotify section shows "Connect Spotify" when disconnected.
2. If you can connect Spotify: verify the three playlist fields appear, paste a playlist URL, verify the name resolves below.
3. Verify disconnecting clears the playlist fields.

- [ ] **Step 6: Commit**

```bash
git add app/settings/page.tsx
git commit -m "feat(spotify): add per-vibe playlist input fields to settings"
```

---

## Task 9: End-to-end manual verification

No code changes in this task — just verification against the spec's fallback matrix.

- [ ] **Step 1: Test YouTube fallback (no Spotify)**

1. Ensure Spotify is disconnected in Settings.
2. Go to home, pick a topic, enter worship screen.
3. Verify: music plays via YouTube, vibe switching works, search filters local library.

- [ ] **Step 2: Test Spotify with default search (connected, no custom playlists)**

1. Connect Spotify in Settings (requires Premium account and `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` env var).
2. Do NOT set any custom playlists.
3. Enter worship screen.
4. Verify: music plays via Spotify SDK, vibe switching triggers keyword search playlists, search uses Spotify API.

- [ ] **Step 3: Test Spotify with custom playlists**

1. In Settings, paste a Spotify playlist URL for the "Worship" vibe.
2. Enter worship screen, select "Worship" vibe.
3. Verify: tracks from the designated playlist play.
4. Switch to "Praise" vibe (no custom playlist set).
5. Verify: falls back to keyword search.

- [ ] **Step 4: Test error fallback**

1. Disconnect from the internet or invalidate the Spotify token manually.
2. Enter worship screen.
3. Verify: toast appears ("Spotify unavailable, using built-in music."), YouTube takes over, toast auto-dismisses.

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS.
