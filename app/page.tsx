"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Greeting } from "@/components/greeting";
import { VerseOfDay } from "@/components/verse-of-day";

const CHIPS = [
  { label: "Peace", icon: "☷", type: "topic" },
  { label: "Strength", icon: "⚕", type: "topic" },
  { label: "Gratitude", icon: "✿", type: "topic" },
  { label: "Purpose", icon: "✦", type: "topic" },
  { label: "Patience", icon: "⌘", type: "topic" },
  { label: "Forgiveness", icon: "❥", type: "topic" },
  { label: "Identity", icon: "☆", type: "topic" },
  { label: "Relationships", icon: "☘", type: "topic" },
  { label: "Stressed", icon: "😬", type: "mood" },
  { label: "Joyful", icon: "😊", type: "mood" },
  { label: "Tired", icon: "😴", type: "mood" },
  { label: "Restless", icon: "😖", type: "mood" },
  { label: "Hopeful", icon: "🌞", type: "mood" },
  { label: "Overwhelmed", icon: "😰", type: "mood" },
  { label: "Grateful", icon: "🙏", type: "mood" },
  { label: "Hurting", icon: "💔", type: "mood" },
] as const;

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState("");

  function toggleChip(label: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function handleContinue() {
    const params = new URLSearchParams();
    const topics = CHIPS.filter((c) => c.type === "topic" && selected.has(c.label)).map((c) => c.label);
    const moods = CHIPS.filter((c) => c.type === "mood" && selected.has(c.label)).map((c) => c.label);

    if (topics.length) params.set("topic", topics.join(", "));
    if (moods.length) params.set("mood", moods.join(", "));
    if (freeText.trim()) params.set("free_text", freeText.trim());

    const hasTopics = topics.length > 0;
    const hasMoods = moods.length > 0;
    const hasFreeText = !!freeText.trim();

    const inputType = hasTopics && hasMoods ? "combined"
      : hasTopics ? "topic"
      : hasMoods ? "mood"
      : hasFreeText ? "free_text"
      : "blessed";

    params.set("input_type", inputType);
    router.push(`/worship?${params.toString()}`);
  }

  function handleBlessed() {
    router.push("/worship?input_type=blessed");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleContinue();
    }
  }

  const hasSelection = selected.size > 0 || freeText.trim().length > 0;

  return (
    <div className="min-h-screen flex">
      <button
        onClick={() => router.push("/settings")}
        className="fixed top-8 right-8 text-[var(--text-ghost)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer text-lg z-10"
        title="Settings"
      >
        &#9881;
      </button>

      {/* Left panel — greeting */}
      <div className="hidden md:flex w-[440px] flex-col items-center justify-center px-14 relative">
        <div className="absolute top-20 bottom-20 right-0 w-px bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.05)] to-transparent" />
        <Greeting />
        <VerseOfDay />
      </div>

      {/* Right panel — chat-style input */}
      <div className="flex-1 flex flex-col justify-end p-8 md:px-14 md:py-10 overflow-y-auto">
        {/* Mobile greeting */}
        <div className="md:hidden mb-8">
          <Greeting />
          <VerseOfDay />
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => toggleChip(chip.label)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] transition-all duration-150 cursor-pointer border
                ${selected.has(chip.label)
                  ? "bg-[var(--surface-selected)] border-[var(--surface-selected-border)] text-[var(--text-primary)]"
                  : "bg-[var(--surface)] border-[var(--surface-border)] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)] hover:text-[var(--text-secondary)]"
                }`}
            >
              <span className="text-sm grayscale-[30%]">{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="relative">
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your heart today?"
            rows={1}
            className="w-full px-5 py-4 pr-12 rounded-2xl
              bg-[var(--surface)] border border-[var(--surface-border)]
              text-sm text-[var(--text-primary)] leading-[1.6]
              placeholder:text-[var(--text-ghost)] resize-none
              outline-none focus:border-[var(--surface-hover-border)]
              min-h-[56px] max-h-[160px]"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleContinue}
            disabled={!hasSelection}
            className={`flex-1 py-3.5 px-6 rounded-xl text-[15px] font-medium transition-all duration-150 cursor-pointer border
              ${hasSelection
                ? "bg-[var(--interactive-bg)] border-[var(--interactive-border)] text-[var(--text-primary)] hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]"
                : "bg-[var(--surface)] border-[var(--surface-border)] text-[var(--text-faint)] cursor-not-allowed"
              }`}
          >
            Continue
          </button>
          <button
            onClick={handleBlessed}
            className="flex-1 py-3.5 px-6 rounded-xl text-[15px] font-medium transition-all duration-150 cursor-pointer border
              bg-[var(--surface)] border-[var(--surface-border)] text-[var(--text-secondary)]
              hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]"
          >
            I&apos;m Feeling Blessed
          </button>
        </div>
      </div>
    </div>
  );
}
