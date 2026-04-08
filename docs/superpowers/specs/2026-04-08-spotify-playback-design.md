# Spotify Web Playback SDK Integration — Design Spec

Wire up Spotify as the primary music backend when connected. YouTube remains the fallback for users without Spotify. Users can designate their own Spotify playlists per vibe.

---

## Playback Architecture

`music-context.tsx` gains a `backend` mode: `"youtube"` or `"spotify"`.

**Spotify mode:** Loads the Spotify Web Playback SDK (`https://sdk.scdn.co/spotify-player.js`), creates a `Spotify.Player` instance, and transfers playback to the browser. All existing controls (play, pause, next, prev, seek, volume) delegate to the SDK instead of the YouTube IFrame API. The worship screen and mini-player call the same `useMusicPlayer()` hook — no UI changes needed.

**YouTube mode:** Current behavior, unchanged. Active when Spotify is not connected or when Spotify fails.

**Backend selection:** On mount, `MusicProvider` checks if the user has Spotify connected (via the settings API). If yes and a valid access token exists, initialize the Spotify SDK. Otherwise, initialize YouTube.

### Song Type Extension

The `Song` type in `music.ts` gains an optional `spotifyUri` field:

```ts
export interface Song {
  title: string;
  artist: string;
  youtubeId: string;
  spotifyUri?: string;        // e.g. "spotify:track:abc123"
  albumArt?: string;          // Spotify album art URL
  vibe: "praise" | "worship" | "instrumental";
  tags?: string[];
}
```

When in Spotify mode, playlists are populated from Spotify API responses mapped to this type. The `youtubeId` field can be empty for Spotify-sourced tracks.

---

## Playlist Designation

Users assign a Spotify playlist to each vibe in Settings.

### Database

Three new columns in `user_settings`:

```sql
spotify_playlist_praise TEXT,        -- Spotify playlist ID
spotify_playlist_worship TEXT,       -- Spotify playlist ID
spotify_playlist_instrumental TEXT   -- Spotify playlist ID
```

### Worship Screen Behavior

When switching vibes:

1. **Custom playlist set for this vibe** — Fetch tracks from `GET /v1/playlists/{id}/tracks`, map to `Song[]`, load into player.
2. **No custom playlist** — Fall back to keyword search via existing `getWorshipPlaylist()` in `spotify.ts`.
3. **Spotify not connected** — Use curated YouTube library (current behavior).

### Search

When Spotify is connected, the search bar on the worship screen uses `searchSpotify()` instead of the local `searchSongs()`. Results play via the Spotify SDK.

---

## Token Management

Spotify access tokens expire after 1 hour.

**On music context init:**
1. Fetch user settings (includes `spotify_access_token`, `spotify_refresh_token`, `spotify_connected`).
2. Attempt to initialize the Spotify SDK with the access token.
3. If the SDK reports `authentication_error`, refresh the token using `refreshToken()` from `lib/spotify.ts`.
4. Save the new access token back to the DB via `PUT /api/settings`.
5. Retry SDK init with the fresh token.
6. If refresh also fails, fall back to YouTube.

**During playback:** The SDK emits `authentication_error` if the token expires mid-session. Same refresh-and-retry flow, one attempt. If it fails, switch to YouTube.

---

## Settings UI

The Spotify section expands when connected to show three playlist fields:

```
Spotify
● Connected                              Disconnect

PRAISE PLAYLIST
[  Paste Spotify playlist link or URI              ]
  → "Sunday Morning Praise Mix"

WORSHIP PLAYLIST
[  Paste Spotify playlist link or URI              ]
  → "Intimate Worship"

INSTRUMENTAL PLAYLIST
[  Paste Spotify playlist link or URI              ]
  (not set — will use default search)
```

**Input parsing:** Accepts `https://open.spotify.com/playlist/ABC123?si=...` or `spotify:playlist:ABC123`. Extracts the playlist ID on blur/save.

**Confirmation:** After saving, fetch the playlist name from `GET /v1/playlists/{id}` and display it below the field.

**No playlist set:** Show "(not set — will use default search)" in faint text.

---

## Error Handling

All Spotify SDK error events (`initialization_error`, `authentication_error`, `account_error`, `playback_error`) trigger the same response:

1. Flip `backend` to `"youtube"`.
2. Load the curated YouTube playlist for the current vibe.
3. Show a one-line toast: "Spotify unavailable, using built-in music." Toast auto-dismisses after 5 seconds.

No retry logic. No modal. The user can reconnect in Settings.

Token refresh failure follows the same path — silent fallback to YouTube.

---

## Fallback Matrix

| Condition | Backend | Music Source |
|-----------|---------|-------------|
| No Spotify connected | YouTube | Curated 69-song library |
| Spotify connected, custom playlists set | Spotify SDK | User's playlists |
| Spotify connected, no custom playlists | Spotify SDK | Keyword search per vibe |
| Spotify connected, Premium lapsed | YouTube (auto-fallback) | Curated library + toast |
| Spotify token expired, refresh succeeds | Spotify SDK | Resumes normally |
| Spotify token expired, refresh fails | YouTube (auto-fallback) | Curated library + toast |

---

## Files Changed

| File | Change |
|------|--------|
| `lib/music-context.tsx` | Add Spotify SDK init, dual backend switching, token refresh |
| `lib/music.ts` | Add `spotifyUri` and `albumArt` to `Song` type |
| `lib/spotify.ts` | Add `getPlaylistTracks()` function, playlist ID parser |
| `components/worship-screen.tsx` | Use Spotify search when connected, album art from Spotify |
| `components/mini-player.tsx` | Use `albumArt` field instead of YouTube thumbnail when available |
| `app/settings/page.tsx` | Add three playlist input fields in Spotify section |
| `app/api/settings/route.ts` | Handle new playlist columns in GET/PUT |
| `init.sql` | Add three `spotify_playlist_*` columns to `user_settings` |

---

## What This Does NOT Include

- Apple Music integration (future, same pattern)
- Spotify Free tier playback (SDK requires Premium; Free users stay on YouTube)
- Playlist creation or syncing from the app to Spotify
- Social/shared playlist features
