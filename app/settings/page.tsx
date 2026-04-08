"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { exchangeCode, startSpotifyAuth, parsePlaylistId, getSpotifyPlaylistName } from "@/lib/spotify";

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

import { Suspense } from "react";

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

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  // Handle Spotify OAuth callback
  useEffect(() => {
    const code = searchParams.get("spotify_code");
    if (code) {
      exchangeCode(code).then(async (tokens) => {
        await save({
          spotify_access_token: tokens.access_token,
          spotify_refresh_token: tokens.refresh_token,
          spotify_connected: true,
        } as Partial<Settings>);
        // Clean URL
        router.replace("/settings");
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function save(partial: Partial<Settings>) {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    const updated = await res.json();
    setSettings(updated);
    setSaved("Saved");
    setTimeout(() => setSaved(""), 2000);
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-ghost)]">Loading...</p>
      </div>
    );
  }

  const inputClass = "w-full p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] outline-none focus:border-[var(--surface-hover-border)]";
  const labelClass = "text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-3";
  const sectionClass = "mb-10";

  return (
    <div className="min-h-screen max-w-[640px] mx-auto px-8 py-12">
      <button
        onClick={() => router.push("/")}
        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer mb-8"
      >
        &larr; Back
      </button>

      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.3px]">
          Settings
        </h1>
        {saved && (
          <span className="text-sm text-[rgba(100,255,100,0.6)]">{saved}</span>
        )}
      </div>

      {/* Bible Translation */}
      <div className={sectionClass}>
        <p className={labelClass}>Bible Translation</p>
        <div className="flex gap-2">
          {["ESV", "NIV", "NLT", "KJV"].map((t) => (
            <button
              key={t}
              onClick={() => save({ bible_translation: t })}
              className={`py-2.5 px-5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
                ${settings.bible_translation === t
                  ? "bg-[var(--surface-selected)] border border-[var(--surface-selected-border)] text-[var(--text-primary)]"
                  : "bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Default Vibe */}
      <div className={sectionClass}>
        <p className={labelClass}>Default Worship Vibe</p>
        <div className="flex gap-2">
          {["praise", "worship", "instrumental"].map((v) => (
            <button
              key={v}
              onClick={() => save({ default_vibe: v })}
              className={`py-2.5 px-5 rounded-xl text-sm font-medium capitalize transition-all duration-150 cursor-pointer
                ${settings.default_vibe === v
                  ? "bg-[var(--surface-selected)] border border-[var(--surface-selected-border)] text-[var(--text-primary)]"
                  : "bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

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

      {/* Account */}
      <div className={sectionClass}>
        <p className={labelClass}>Account</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="py-2.5 px-6 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]
            hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]
            transition-all duration-150 cursor-pointer text-sm text-[var(--text-secondary)]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-ghost)]">Loading...</p>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
