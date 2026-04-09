"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStep } from "@/components/onboarding-step";
import { ONBOARDING_QUESTIONS } from "@/lib/persona";
import type { Persona } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState<Persona>({});
  const [saving, setSaving] = useState(false);

  const totalSteps = ONBOARDING_QUESTIONS.length;
  const isComplete = step >= totalSteps;

  async function savePersona(data: Persona) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: Object.keys(data).length > 0 ? data : {} }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Retry once silently — if it fails again, still proceed
      try {
        await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona: Object.keys(data).length > 0 ? data : {} }),
        });
      } catch {}
    }
    setSaving(false);
  }

  async function handleNext() {
    const nextStep = step + 1;
    if (nextStep >= totalSteps) {
      await savePersona(persona);
      setStep(nextStep);
    } else {
      setStep(nextStep);
    }
  }

  async function handleSkip() {
    const q = ONBOARDING_QUESTIONS[step];
    const updated = { ...persona };
    delete updated[q.key];
    delete updated[q.detailKey];
    setPersona(updated);

    const nextStep = step + 1;
    if (nextStep >= totalSteps) {
      await savePersona(updated);
      setStep(nextStep);
    } else {
      setStep(nextStep);
    }
  }

  function handleSelect(value: string) {
    const q = ONBOARDING_QUESTIONS[step];
    setPersona((prev) => ({ ...prev, [q.key]: value }));
  }

  function handleDetailChange(detail: string) {
    const q = ONBOARDING_QUESTIONS[step];
    setPersona((prev) => ({
      ...prev,
      [q.detailKey]: detail || undefined,
    }));
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3 tracking-[-0.3px]">
          We're glad you're here.
        </h2>
        <p className="text-sm text-[var(--text-tertiary)] mb-8">
          Let's get started.
        </p>
        <button
          onClick={() => router.push("/")}
          disabled={saving}
          className="py-3 px-10 rounded-xl bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
            hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
            transition-all duration-150 cursor-pointer text-[15px] font-medium text-[var(--text-primary)]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Begin"}
        </button>
      </div>
    );
  }

  const q = ONBOARDING_QUESTIONS[step];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <OnboardingStep
        key={step}
        prompt={q.prompt}
        options={q.options}
        detailPlaceholder={q.detailPlaceholder}
        selected={(persona[q.key] as string) || null}
        detail={(persona[q.detailKey] as string) || ""}
        onSelect={handleSelect}
        onDetailChange={handleDetailChange}
        onNext={handleNext}
        onSkip={handleSkip}
      />
    </div>
  );
}
