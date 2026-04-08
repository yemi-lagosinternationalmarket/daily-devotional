export interface Song {
  title: string;
  artist: string;
  youtubeId: string;
  spotifyUri?: string;
  albumArt?: string;
  vibe: "praise" | "worship" | "instrumental";
  tags?: string[];
}

const SONGS: Song[] = [
  // ── PRAISE — upbeat, energetic ──
  { title: "Jireh", artist: "Elevation Worship & Maverick City", youtubeId: "mC-zw0zCCtg", vibe: "praise", tags: ["peace", "trust", "gratitude", "identity"] },
  { title: "Goodness of God", artist: "Bethel Music", youtubeId: "n0FBb6hnwTo", vibe: "praise", tags: ["gratitude", "faithfulness", "peace"] },
  { title: "Graves into Gardens", artist: "Elevation Worship", youtubeId: "KwX1f2gYKZ4", vibe: "praise", tags: ["strength", "purpose", "anxiety"] },
  { title: "Way Maker", artist: "Leeland", youtubeId: "iJCV_2H9xD0", vibe: "praise", tags: ["peace", "trust", "anxiety", "purpose"] },
  { title: "Great Are You Lord", artist: "All Sons & Daughters", youtubeId: "uHz0w-HG4iU", vibe: "praise", tags: ["gratitude", "peace"] },
  { title: "Battle Belongs", artist: "Phil Wickham", youtubeId: "qtvQNzPHn-w", vibe: "praise", tags: ["strength", "anxiety", "purpose"] },
  { title: "Raise a Hallelujah", artist: "Bethel Music", youtubeId: "G2XtRuPfaAU", vibe: "praise", tags: ["strength", "anxiety", "peace"] },
  { title: "Do It Again", artist: "Elevation Worship", youtubeId: "ZOBIPb-6PTc", vibe: "praise", tags: ["trust", "faithfulness", "strength"] },
  { title: "Who You Say I Am", artist: "Hillsong Worship", youtubeId: "IcC1Bp13n_4", vibe: "praise", tags: ["identity", "purpose", "forgiveness"] },
  { title: "Living Hope", artist: "Phil Wickham", youtubeId: "u-1fwZtKJSM", vibe: "praise", tags: ["purpose", "strength", "gratitude"] },
  { title: "King of Kings", artist: "Hillsong Worship", youtubeId: "dQl4izxPeNU", vibe: "praise", tags: ["identity", "purpose", "gratitude"] },
  { title: "Build My Life", artist: "Pat Barrett", youtubeId: "Z32HiCoFzlU", vibe: "praise", tags: ["purpose", "identity", "gratitude"] },
  { title: "This Is Amazing Grace", artist: "Phil Wickham", youtubeId: "XFRjr_x-yxU", vibe: "praise", tags: ["forgiveness", "gratitude", "identity"] },
  { title: "10,000 Reasons", artist: "Matt Redman", youtubeId: "XtwIT8JjddM", vibe: "praise", tags: ["gratitude", "peace", "patience"] },
  { title: "How Great Is Our God", artist: "Chris Tomlin", youtubeId: "KBD18rsVJHk", vibe: "praise", tags: ["gratitude", "identity", "purpose"] },
  { title: "Oceans", artist: "Hillsong United", youtubeId: "dy9nwe9_xzw", vibe: "praise", tags: ["trust", "peace", "anxiety", "patience"] },
  { title: "Cornerstone", artist: "Hillsong Worship", youtubeId: "izrk-erhDdk", vibe: "praise", tags: ["identity", "strength", "trust"] },
  { title: "No Longer Slaves", artist: "Bethel Music", youtubeId: "f8TkUMJtK5k", vibe: "praise", tags: ["identity", "anxiety", "forgiveness"] },
  { title: "Tremble", artist: "Mosaic MSC", youtubeId: "SzZZb6RbLJs", vibe: "praise", tags: ["strength", "anxiety", "peace"] },
  { title: "Lion and the Lamb", artist: "Bethel Music", youtubeId: "C9ujBoud26k", vibe: "praise", tags: ["strength", "identity", "purpose"] },
  { title: "Surrounded", artist: "Michael W. Smith", youtubeId: "YBl84oZxnJ4", vibe: "praise", tags: ["anxiety", "peace", "strength"] },

  // ── WORSHIP — slow, intimate ──
  { title: "Holy Spirit", artist: "Francesca Battistelli", youtubeId: "UvBBC7-PSHo", vibe: "worship", tags: ["peace", "patience", "identity"] },
  { title: "So Will I", artist: "Hillsong Worship", youtubeId: "p2IPg-qS-_w", vibe: "worship", tags: ["purpose", "identity", "gratitude"] },
  { title: "O Come to the Altar", artist: "Elevation Worship", youtubeId: "eKo6dG1Utp4", vibe: "worship", tags: ["forgiveness", "anxiety", "peace"] },
  { title: "What a Beautiful Name", artist: "Hillsong Worship", youtubeId: "nQWFzMvCfLE", vibe: "worship", tags: ["identity", "strength", "gratitude"] },
  { title: "Reckless Love", artist: "Cory Asbury", youtubeId: "Sc6SSHuZvQE", vibe: "worship", tags: ["forgiveness", "identity", "relationships"] },
  { title: "Here Again", artist: "Elevation Worship", youtubeId: "01tVZ8x6t4M", vibe: "worship", tags: ["peace", "patience", "trust"] },
  { title: "Great Things", artist: "Phil Wickham", youtubeId: "y4CY3nf1Mvw", vibe: "worship", tags: ["gratitude", "trust", "purpose"] },
  { title: "Firm Foundation", artist: "Cody Carnes", youtubeId: "x9ndiD0_qNk", vibe: "worship", tags: ["identity", "strength", "trust"] },
  { title: "Trust In God", artist: "Elevation Worship", youtubeId: "QS04WbSnxok", vibe: "worship", tags: ["trust", "anxiety", "peace"] },
  { title: "Promises", artist: "Maverick City Music", youtubeId: "q5m09rqOoxE", vibe: "worship", tags: ["trust", "patience", "faithfulness"] },
  { title: "Worthy of It All", artist: "Bethel Music", youtubeId: "KRsSfuhB9U8", vibe: "worship", tags: ["gratitude", "identity", "purpose"] },
  { title: "Hymn of Heaven", artist: "Phil Wickham", youtubeId: "CjB0mkj0XaM", vibe: "worship", tags: ["peace", "purpose", "gratitude"] },
  { title: "Even So Come", artist: "Passion", youtubeId: "TF5-MpVNfwc", vibe: "worship", tags: ["patience", "purpose", "trust"] },
  { title: "Revelation Song", artist: "Kari Jobe", youtubeId: "8-Gxjtd6Wp4", vibe: "worship", tags: ["gratitude", "identity", "peace"] },
  { title: "Forever (We Sing Hallelujah)", artist: "Kari Jobe", youtubeId: "ZIcijWNmozw", vibe: "worship", tags: ["gratitude", "peace", "purpose"] },
  { title: "Nothing Else", artist: "Cody Carnes", youtubeId: "RG5kF-a42Cc", vibe: "worship", tags: ["peace", "patience", "identity"] },
  { title: "Gratitude", artist: "Brandon Lake", youtubeId: "Na6P_kLI2FE", vibe: "worship", tags: ["gratitude", "peace", "relationships"] },
  { title: "Yet Not I But Through Christ In Me", artist: "CityAlight", youtubeId: "zundjUFazfg", vibe: "worship", tags: ["identity", "strength", "purpose"] },
  { title: "Christ Be Magnified", artist: "Cody Carnes", youtubeId: "jjGMlYywK9M", vibe: "worship", tags: ["identity", "purpose", "gratitude"] },
  { title: "Egypt", artist: "Cory Asbury", youtubeId: "uEeCl1KyXiI", vibe: "worship", tags: ["trust", "patience", "strength"] },

  // ── INSTRUMENTAL — no lyrics, piano/ambient ──
  { title: "Alone With God", artist: "DappyTKeys", youtubeId: "xHNB7-7HgFU", vibe: "instrumental", tags: ["peace", "patience", "anxiety"] },
  { title: "Prayer & Quiet Time", artist: "DappyTKeys", youtubeId: "fonQBzSBv8Q", vibe: "instrumental", tags: ["peace", "anxiety", "patience"] },
  { title: "Christian Piano Worship", artist: "DappyTKeys", youtubeId: "QB6KyIvSB98", vibe: "instrumental", tags: ["peace", "gratitude", "patience"] },
  { title: "Blessed Assurance Piano", artist: "DappyTKeys", youtubeId: "L7_PumJ9DU0", vibe: "instrumental", tags: ["trust", "peace", "gratitude"] },
  { title: "Holy Spirit Soaking Piano", artist: "DappyTKeys", youtubeId: "bmmwzYtCpmU", vibe: "instrumental", tags: ["peace", "patience", "identity"] },
  { title: "Create In Me A Clean Heart", artist: "DappyTKeys", youtubeId: "Ug0QVIlowtI", vibe: "instrumental", tags: ["forgiveness", "peace", "patience"] },
  { title: "God's Promises Soaking Piano", artist: "DappyTKeys", youtubeId: "xMrJE8vkOpY", vibe: "instrumental", tags: ["trust", "peace", "strength"] },
  { title: "Rest in God", artist: "DappyTKeys", youtubeId: "pz28zId59UE", vibe: "instrumental", tags: ["peace", "anxiety", "patience"] },
  { title: "3 Hour Peaceful Piano", artist: "DappyTKeys", youtubeId: "81hxv1KYk3A", vibe: "instrumental", tags: ["peace", "patience", "anxiety"] },
  { title: "Seek The Lord Soaking Worship", artist: "DappyTKeys", youtubeId: "41sqgwkyt0g", vibe: "instrumental", tags: ["purpose", "peace", "patience"] },
  { title: "Be Still Soaking Piano", artist: "DappyTKeys", youtubeId: "q6rVXv5kAF4", vibe: "instrumental", tags: ["peace", "anxiety", "patience"] },
  { title: "Prayer Background Music", artist: "DappyTKeys", youtubeId: "u-2uOe7g354", vibe: "instrumental", tags: ["peace", "patience", "trust"] },
  { title: "Relaxing Hymns Instrumental", artist: "Prayer Pray", youtubeId: "ymSb-jdEVlA", vibe: "instrumental", tags: ["peace", "gratitude", "patience"] },
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

// Map moods to topics for song matching
const MOOD_TO_TOPICS: Record<string, string[]> = {
  Stressed: ["peace", "anxiety", "patience"],
  Joyful: ["gratitude", "purpose", "identity"],
  Tired: ["peace", "patience", "strength"],
  Restless: ["peace", "anxiety", "patience"],
  Hopeful: ["purpose", "gratitude", "identity"],
  Overwhelmed: ["peace", "anxiety", "patience"],
  Grateful: ["gratitude", "peace", "identity"],
  Hurting: ["forgiveness", "peace", "relationships"],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getSongsForContext(vibe: VibeType, topic?: string | null, mood?: string | null): Song[] {
  const vibeSongs = getSongsByVibe(vibe);
  const searchTags: string[] = [];

  if (topic) searchTags.push(topic.toLowerCase());
  if (mood && MOOD_TO_TOPICS[mood]) searchTags.push(...MOOD_TO_TOPICS[mood]);

  if (searchTags.length === 0) return shuffle(vibeSongs);

  // Score songs by how many tags match
  const scored = vibeSongs.map((s) => {
    const matchCount = (s.tags || []).filter((t) => searchTags.includes(t)).length;
    return { song: s, score: matchCount };
  });

  scored.sort((a, b) => b.score - a.score);

  const matching = scored.filter((s) => s.score > 0).map((s) => s.song);
  const rest = scored.filter((s) => s.score === 0).map((s) => s.song);

  return [...shuffle(matching), ...shuffle(rest)];
}
