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
