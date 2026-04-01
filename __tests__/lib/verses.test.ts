import { describe, it, expect } from "vitest";
import { getVerseOfDay } from "@/lib/verses";

describe("getVerseOfDay", () => {
  it("returns a verse object with text and reference", () => {
    const verse = getVerseOfDay(new Date("2026-04-01"));
    expect(verse).toHaveProperty("text");
    expect(verse).toHaveProperty("ref");
    expect(verse.text.length).toBeGreaterThan(0);
    expect(verse.ref.length).toBeGreaterThan(0);
  });

  it("returns the same verse for the same date", () => {
    const a = getVerseOfDay(new Date("2026-04-01"));
    const b = getVerseOfDay(new Date("2026-04-01"));
    expect(a).toEqual(b);
  });

  it("returns different verses for different dates", () => {
    const a = getVerseOfDay(new Date("2026-04-01"));
    const b = getVerseOfDay(new Date("2026-04-02"));
    expect(a.ref).not.toEqual(b.ref);
  });
});
