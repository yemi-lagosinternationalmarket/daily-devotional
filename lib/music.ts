export interface Song {
  title: string;
  artist: string;
  youtubeId: string;
  vibe: "praise" | "worship" | "instrumental";
}

const SONGS: Song[] = [
  // Praise — upbeat, energetic
  { title: "Jireh", artist: "Maverick City Music", youtubeId: "GjEuUjSLaGE", vibe: "praise" },
  { title: "Goodness of God", artist: "Bethel Music", youtubeId: "wOIGjBmOvOE", vibe: "praise" },
  { title: "Graves into Gardens", artist: "Elevation Worship", youtubeId: "mhwC1GGbSV0", vibe: "praise" },
  { title: "Way Maker", artist: "Sinach", youtubeId: "n_0CaJhlFuA", vibe: "praise" },
  { title: "Great Are You Lord", artist: "All Sons & Daughters", youtubeId: "sIaT8Jl2zpI", vibe: "praise" },
  { title: "Battle Belongs", artist: "Phil Wickham", youtubeId: "johgSkNj3-A", vibe: "praise" },
  // Worship — slow, intimate
  { title: "Holy Spirit", artist: "Francesca Battistelli", youtubeId: "ItBn3eWB-3U", vibe: "worship" },
  { title: "So Will I", artist: "Hillsong Worship", youtubeId: "C2U9TkrGB6k", vibe: "worship" },
  { title: "O Come to the Altar", artist: "Elevation Worship", youtubeId: "oVB0CnzNotc", vibe: "worship" },
  { title: "What a Beautiful Name", artist: "Hillsong Worship", youtubeId: "nQWFzMvCfLE", vibe: "worship" },
  { title: "Reckless Love", artist: "Cory Asbury", youtubeId: "Sc6SSHuZvQE", vibe: "worship" },
  { title: "Here Again", artist: "Elevation Worship", youtubeId: "mQrdVsgbJuw", vibe: "worship" },
  // Instrumental — no lyrics
  { title: "Peaceful Piano Worship", artist: "Worship Instrumentals", youtubeId: "EQJ2zRpjblg", vibe: "instrumental" },
  { title: "Soaking Worship Music", artist: "Instrumental Worship", youtubeId: "y5MNbSHOvgM", vibe: "instrumental" },
  { title: "Quiet Time Piano", artist: "Worship Piano", youtubeId: "FjHGZj2IjBk", vibe: "instrumental" },
  { title: "Instrumental Hymns", artist: "Piano Worship", youtubeId: "Dx5qFachd3A", vibe: "instrumental" },
];

export type VibeType = Song["vibe"];

export function getSongsByVibe(vibe: VibeType): Song[] {
  return SONGS.filter((s) => s.vibe === vibe);
}

export function getRandomSong(vibe: VibeType): Song {
  const songs = getSongsByVibe(vibe);
  return songs[Math.floor(Math.random() * songs.length)];
}

export function searchSongs(query: string): Song[] {
  const q = query.toLowerCase();
  return SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q)
  );
}
