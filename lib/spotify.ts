/**
 * Spotify Integration
 *
 * Uses Spotify Web API for search + Web Playback SDK for playback.
 * Auth: PKCE flow (client-side, no server secret).
 *
 * Requires user to set SPOTIFY_CLIENT_ID in Settings or env.
 * Playback requires Spotify Premium.
 */

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-modify-playback-state",
  "user-read-playback-state",
].join(" ");

function getClientId(): string {
  return process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
}

function getRedirectUri(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/spotify/callback`;
  }
  return "";
}

// PKCE helpers
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function startSpotifyAuth(): Promise<void> {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error("Spotify Client ID not configured");
  }

  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlEncode(hashed);

  sessionStorage.setItem("spotify_code_verifier", codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: getRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
  if (!codeVerifier) throw new Error("No code verifier found");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) throw new Error("Token exchange failed");
  return response.json();
}

export async function refreshToken(refresh_token: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      grant_type: "refresh_token",
      refresh_token,
    }),
  });

  if (!response.ok) throw new Error("Token refresh failed");
  return response.json();
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  uri: string;
  albumArt: string;
  durationMs: number;
}

export async function searchSpotify(
  query: string,
  accessToken: string
): Promise<SpotifyTrack[]> {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query + " worship")}&type=track&limit=10`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) return [];
  const data = await response.json();

  return (data.tracks?.items || []).map((t: Record<string, unknown>) => ({
    id: t.id,
    name: t.name,
    artists: ((t.artists as Array<{ name: string }>) || []).map((a) => a.name).join(", "),
    uri: t.uri,
    albumArt: ((t.album as Record<string, unknown>)?.images as Array<{ url: string }>)?.[1]?.url || "",
    durationMs: t.duration_ms,
  }));
}

export async function getWorshipPlaylist(
  vibe: "praise" | "worship" | "instrumental",
  accessToken: string
): Promise<SpotifyTrack[]> {
  const queries: Record<string, string> = {
    praise: "worship praise upbeat gospel",
    worship: "worship intimate slow christian",
    instrumental: "worship piano instrumental",
  };

  return searchSpotify(queries[vibe], accessToken);
}

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

  // Plain ID (alphanumeric, 15+ chars)
  if (/^[A-Za-z0-9]{15,}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * Fetch tracks from a Spotify playlist, mapped to SpotifyTrack[].
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
