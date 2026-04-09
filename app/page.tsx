"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Greeting } from "@/components/greeting";
import { VerseOfDay } from "@/components/verse-of-day";
import { ProfileMenu } from "@/components/profile-menu";
import { OnboardingStep } from "@/components/onboarding-step";
import { isCheckinDue, getNextCheckinQuestion, CHECKIN_QUESTIONS } from "@/lib/persona";
import type { Persona } from "@/lib/types";

const SUGGESTIONS = [
  "I'm feeling anxious about today",
  "Teach me about forgiveness",
  "I need strength right now",
  "I'm grateful but restless",
  "Help me find peace",
  "I feel overwhelmed",
  "I want to understand my purpose",
  "I'm tired and need encouragement",
  "Show me something about patience",
  "I'm hurting and need hope",
];

export default function Home() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);
  const [checkin, setCheckin] = useState<{ question: typeof CHECKIN_QUESTIONS[number]; persona: Persona } | null>(null);
  const [checkinSelected, setCheckinSelected] = useState<string | null>(null);
  const [checkinDetail, setCheckinDetail] = useState("");

  // Redirect to onboarding if persona not set, or show check-in if due
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s && s.persona === null) {
          router.push("/onboarding");
        } else if (s?.persona && isCheckinDue(s.persona)) {
          const idx = getNextCheckinQuestion(s.persona);
          setCheckin({ question: CHECKIN_QUESTIONS[idx], persona: s.persona });
          setCheckinSelected(s.persona[CHECKIN_QUESTIONS[idx].key as keyof Persona] as string || null);
          setReady(true);
        } else {
          setReady(true);
        }
      })
      .catch(() => setReady(true));
  }, [router]);

  async function handleCheckinDone() {
    if (!checkin) return;
    const q = checkin.question;
    const updated: Persona = {
      ...checkin.persona,
      [q.key]: checkinSelected || checkin.persona[q.key as keyof Persona],
      last_checkin: new Date().toISOString(),
    };
    if (checkinDetail) {
      (updated as Record<string, unknown>)[q.detailKey] = checkinDetail;
    }
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona: updated }),
    }).catch(() => {});
    setCheckin(null);
  }

  function handleCheckinSkip() {
    // Just mark the check-in as done without changing answers
    if (!checkin) return;
    const updated: Persona = { ...checkin.persona, last_checkin: new Date().toISOString() };
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona: updated }),
    }).catch(() => {});
    setCheckin(null);
  }

  const suggestions = useMemo(() => {
    const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, []);

  function submit(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return;
    const params = new URLSearchParams();
    params.set("free_text", trimmed);
    params.set("input_type", "free_text");
    router.push(`/worship?${params.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(text);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-ghost)]">Loading...</p>
      </div>
    );
  }

  if (checkin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-xs text-[var(--text-ghost)] mb-6">Quick check-in</p>
        <OnboardingStep
          prompt={checkin.question.prompt}
          options={checkin.question.options}
          detailPlaceholder={checkin.question.detailPlaceholder}
          selected={checkinSelected}
          detail={checkinDetail}
          onSelect={setCheckinSelected}
          onDetailChange={setCheckinDetail}
          onNext={handleCheckinDone}
          onSkip={handleCheckinSkip}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <ProfileMenu />

      {/* Left panel — greeting */}
      <div className="hidden md:flex w-[440px] flex-col items-center justify-center px-14 relative">
        <div className="absolute top-20 bottom-20 right-0 w-px bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.05)] to-transparent" />
        <Greeting />
        <VerseOfDay />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:px-14 md:py-10">
        {/* Mobile greeting */}
        <div className="md:hidden mb-12">
          <Greeting />
          <VerseOfDay />
        </div>

        <div className="w-full max-w-[520px]">
          {/* Suggestions */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="text-left px-4 py-3 rounded-xl text-[13px] leading-[1.4]
                  text-[var(--text-tertiary)] border border-[var(--surface-border)]
                  hover:border-[var(--surface-hover-border)] hover:text-[var(--text-secondary)]
                  transition-all duration-150 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your heart today?"
              rows={1}
              className="w-full pl-5 pr-14 py-4 rounded-2xl
                bg-[var(--surface)] border border-[var(--surface-border)]
                text-[15px] text-[var(--text-primary)] leading-[1.5]
                placeholder:text-[var(--text-ghost)] resize-none
                outline-none focus:border-[var(--surface-hover-border)]
                min-h-[56px] max-h-[160px]"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={() => submit(text)}
              disabled={!text.trim()}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg
                flex items-center justify-center transition-all duration-150 cursor-pointer
                ${text.trim()
                  ? "bg-[var(--text-primary)] text-[var(--background)]"
                  : "bg-[var(--surface-hover)] text-[var(--text-faint)]"
                }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Feeling Blessed */}
          <div className="text-center mt-5">
            <p className="text-[13px] text-[var(--text-ghost)]">
              or let God choose &mdash;{" "}
              <span
                role="button"
                tabIndex={0}
                onClick={() => router.push("/worship?input_type=blessed")}
                onKeyDown={(e) => e.key === "Enter" && router.push("/worship?input_type=blessed")}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                style={{ cursor: "pointer" }}
              >
                I&apos;m Feeling Blessed
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
