"use client";

import { useRouter } from "next/navigation";
import type { Devotional } from "@/lib/types";

interface StepCompleteProps {
  devotional: Devotional;
}

export function StepComplete({ devotional }: StepCompleteProps) {
  const router = useRouter();

  function handleWantMore() {
    const params = new URLSearchParams();
    if (devotional.topic) params.set("topic", devotional.topic);
    if (devotional.mood) params.set("mood", devotional.mood);
    if (devotional.free_text) params.set("free_text", devotional.free_text);
    params.set("input_type", devotional.input_type);
    params.set("want_more", "true");
    params.set("parent_id", devotional.id);
    router.push(`/worship?${params.toString()}`);
  }

  return (
    <div className="max-w-[640px] mx-auto px-8 text-center">
      {/* Checkmark */}
      <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(255,255,255,0.12)]
        flex items-center justify-center mx-auto mb-7 text-[28px] text-[rgba(255,255,255,0.5)]
        animate-[spring-in_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
        ✓
      </div>

      <h2 className="text-[28px] font-semibold text-[var(--text-primary)] mb-3 tracking-[-0.3px]">
        Well done.
      </h2>
      <p className="text-[15px] text-[var(--text-tertiary)] mb-9 leading-[1.6]">
        You showed up today. That matters.
      </p>

      {/* Key verse takeaway */}
      <div className="p-5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]
        text-[15px] italic text-[var(--text-tertiary)] leading-[1.7] max-w-[400px] mx-auto mb-2">
        &ldquo;{devotional.key_verse}&rdquo;
      </div>
      <p className="text-[11px] text-[var(--text-faint)] mb-9">
        {devotional.scripture_ref} {devotional.scripture_translation}
      </p>

      {/* Want more */}
      <button
        onClick={handleWantMore}
        className="py-3.5 px-11 rounded-xl
          bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
          hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
          transition-all duration-150 cursor-pointer
          text-[15px] font-medium text-[var(--text-secondary)] mb-8"
      >
        Want more?
      </button>

      <div>
        <button
          onClick={() => router.push("/journal")}
          className="text-[13px] text-[var(--text-faint)] hover:text-[var(--text-ghost)] transition-colors cursor-pointer"
        >
          View your journal →
        </button>
      </div>
    </div>
  );
}
