"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Devotional } from "@/lib/types";
import { StepIndicator } from "@/components/step-indicator";
import { StepRead } from "@/components/step-read";
import { StepObserve } from "@/components/step-observe";
import { StepReflect } from "@/components/step-reflect";
import { StepApply } from "@/components/step-apply";
import { StepPray } from "@/components/step-pray";
import { StepComplete } from "@/components/step-complete";

function DevotionalContent() {
  const searchParams = useSearchParams();
  const devotionalId = searchParams.get("id");
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!devotionalId) return;
    fetch(`/api/devotional/${devotionalId}`)
      .then((r) => r.json())
      .then(setDevotional);
  }, [devotionalId]);

  if (!devotional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-ghost)]">Loading...</p>
      </div>
    );
  }

  const totalSteps = 5;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-16">
      {step < totalSteps && (
        <StepIndicator total={totalSteps} current={step} />
      )}

      {step === 0 && (
        <StepRead devotional={devotional} onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <StepObserve
          question={devotional.observe_question}
          devotionalId={devotional.id}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepReflect content={devotional.reflect_content} onNext={() => setStep(3)} />
      )}
      {step === 3 && (
        <StepApply
          action={devotional.apply_action}
          timeEstimate={devotional.apply_time_estimate}
          devotionalId={devotional.id}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && (
        <StepPray text={devotional.pray_text} onNext={() => setStep(5)} />
      )}
      {step === 5 && (
        <StepComplete devotional={devotional} />
      )}
    </div>
  );
}

export default function DevotionalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-ghost)]">Loading...</p>
      </div>
    }>
      <DevotionalContent />
    </Suspense>
  );
}
