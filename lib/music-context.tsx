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
