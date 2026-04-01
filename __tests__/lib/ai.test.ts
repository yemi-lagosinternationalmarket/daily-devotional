import { describe, it, expect } from "vitest";
import { buildDevotionalPrompt, parseDevotionalResponse } from "@/lib/ai";

describe("buildDevotionalPrompt", () => {
  it("includes topic in prompt when provided", () => {
    const prompt = buildDevotionalPrompt({
      topic: "Peace",
      mood: null,
      free_text: null,
      input_type: "topic",
      exclude_refs: [],
    });
    expect(prompt).toContain("Peace");
    expect(prompt).toContain("scripture");
  });

  it("includes mood in prompt when provided", () => {
    const prompt = buildDevotionalPrompt({
      topic: null,
      mood: "Stressed",
      free_text: null,
      input_type: "mood",
      exclude_refs: [],
    });
    expect(prompt).toContain("Stressed");
  });

  it("includes exclusion list when provided", () => {
    const prompt = buildDevotionalPrompt({
      topic: "Peace",
      mood: null,
      free_text: null,
      input_type: "topic",
      exclude_refs: ["Philippians 4:6-7"],
    });
    expect(prompt).toContain("Philippians 4:6-7");
  });

  it("handles blessed input type", () => {
    const prompt = buildDevotionalPrompt({
      topic: null,
      mood: null,
      free_text: null,
      input_type: "blessed",
      exclude_refs: [],
    });
    expect(prompt).toContain("choose");
  });
});

describe("parseDevotionalResponse", () => {
  it("parses valid JSON response", () => {
    const json = JSON.stringify({
      scripture_ref: "Psalm 46:10",
      scripture_text: "Be still and know that I am God.",
      scripture_translation: "ESV",
      full_chapter_text: "God is our refuge...",
      observe_question: "What does it mean to be still?",
      reflect_content: "Being still is hard...",
      apply_action: "Spend 5 minutes in silence.",
      apply_time_estimate: "~5 minutes",
      pray_text: "Lord, help me be still...",
      key_verse: "Be still, and know that I am God.",
    });
    const result = parseDevotionalResponse(json);
    expect(result.scripture_ref).toBe("Psalm 46:10");
    expect(result.apply_time_estimate).toBe("~5 minutes");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseDevotionalResponse("not json")).toThrow();
  });
});
