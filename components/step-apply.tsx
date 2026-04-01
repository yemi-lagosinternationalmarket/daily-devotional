"use client";

import { useState } from "react";

interface StepApplyProps {
  action: string;
  timeEstimate: string;
  devotionalId: string;
  onNext: () => void;
}

export function StepApply({ action, timeEstimate, devotionalId, onNext }: StepApplyProps) {
  const [response, setResponse] = useState("");

  async function handleNext() {
    if (response.trim()) {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          devotional_id: devotionalId,
          step: "apply",
          response_text: response.trim(),
        }),
      });
    }
    onNext();
  }

  return (
    <div className="max-w-[640px] mx-auto px-8">
      <p className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase text-center mb-5">
        Apply
      </p>

      <div className="p-6 rounded-[14px] bg-[var(--surface)] border border-[var(--surface-border)] mb-5">
        <p className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[1.5px] uppercase mb-2.5">
          Today&apos;s step
        </p>
        <p className="text-base font-medium text-[var(--text-primary)] leading-[1.6]">
          {action}
        </p>
        <p className="text-[13px] text-[var(--text-ghost)] mt-2">
          {timeEstimate}
        </p>
      </div>

      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Write it here if you'd like..."
        className="w-full min-h-[80px] p-4 rounded-xl
          bg-[var(--surface)] border border-[var(--surface-border)]
          text-sm text-[var(--text-primary)] leading-[1.7]
          placeholder:text-[var(--text-ghost)] resize-none
          outline-none focus:border-[var(--surface-hover-border)] mb-2"
      />
      <p className="text-xs text-[var(--text-faint)]">
        Optional — just doing it in your head counts too
      </p>

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2">
        <button
          onClick={handleNext}
          className="py-3.5 px-11 rounded-xl
            bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
            hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
            transition-all duration-150 cursor-pointer
            text-[15px] font-medium text-[var(--text-primary)]"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
