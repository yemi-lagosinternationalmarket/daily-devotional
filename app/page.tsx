"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Greeting } from "@/components/greeting";
import { VerseOfDay } from "@/components/verse-of-day";
import { IntentionTabs } from "@/components/intention-tabs";
import { BlessedButton } from "@/components/blessed-button";

export default function Home() {
  const router = useRouter();
  const [hasApiKey, setHasApiKey] = useState(true); // default true to avoid flash

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(s => {
      setHasApiKey(!!s?.llm_api_key);
    }).catch(() => {});
  }, []);

  function handleIntention(data: {
    topic?: string;
    mood?: string;
    free_text?: string;
  }) {
    const params = new URLSearchParams();
    if (data.topic) params.set("topic", data.topic);
    if (data.mood) params.set("mood", data.mood);
    if (data.free_text) params.set("free_text", data.free_text);

    const inputType = data.topic && data.mood
      ? "combined"
      : data.topic
        ? "topic"
        : data.mood
          ? "mood"
          : "free_text";
    params.set("input_type", inputType);

    router.push(`/worship?${params.toString()}`);
  }

  function handleBlessed() {
    router.push("/worship?input_type=blessed");
  }

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

      {/* Right panel — intention */}
      <div className="flex-1 flex flex-col p-12 md:px-14 md:py-12 overflow-y-auto">
        {/* Mobile greeting */}
        <div className="md:hidden mb-8">
          <Greeting />
          <VerseOfDay />
        </div>

        {hasApiKey ? (
          <>
            <p className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-7">
              Set your intention
            </p>

            <IntentionTabs onSubmit={handleIntention} />

            <div className="mt-auto pt-8">
              <BlessedButton onClick={handleBlessed} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center gap-4">
            <p className="text-[var(--text-secondary)]">Set up your AI provider to get started.</p>
            <button
              onClick={() => router.push("/settings")}
              className="py-3 px-8 rounded-xl bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
                hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
                transition-all duration-150 cursor-pointer text-[15px] font-medium text-[var(--text-primary)]"
            >
              Go to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
