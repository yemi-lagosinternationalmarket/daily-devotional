import { describe, it, expect } from "vitest";
import { getSongsByVibe, type VibeType } from "@/lib/music";

describe("getSongsByVibe", () => {
  it("returns songs for praise vibe", () => {
    const songs = getSongsByVibe("praise");
    expect(songs.length).toBeGreaterThan(0);
    songs.forEach((s) => {
      expect(s).toHaveProperty("title");
      expect(s).toHaveProperty("artist");
      expect(s).toHaveProperty("youtubeId");
    });
  });

  it("returns songs for worship vibe", () => {
    const songs = getSongsByVibe("worship");
    expect(songs.length).toBeGreaterThan(0);
  });

  it("returns songs for instrumental vibe", () => {
    const songs = getSongsByVibe("instrumental");
    expect(songs.length).toBeGreaterThan(0);
  });

  it("returns different songs per vibe", () => {
    const praise = getSongsByVibe("praise");
    const instrumental = getSongsByVibe("instrumental");
    expect(praise[0].youtubeId).not.toEqual(instrumental[0].youtubeId);
  });
});
