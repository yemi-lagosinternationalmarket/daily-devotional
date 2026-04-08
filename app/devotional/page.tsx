"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Devotional } from "@/lib/types";
import { useMusicPlayer } from "@/lib/music-context";
import { StepIndicator } from "@/components/step-indicator";
import { StepRead } from "@/components/step-read";
import { StepObserve } from "@/components/step-observe";
import { StepReflect } from "@/components/step-reflect";
import { StepApply } from "@/components/step-apply";
import { StepPray } from "@/components/step-pray";
import { StepComplete } from "@/components/step-complete";
import { AmbientPlayer } from "@/components/ambient-player";

function DevotionalContent() {
  const router = useRouter();
  const music = useMusicPlayer();
  const searchParams = useSearchParams();
  const devotionalId = searchParams.get("id");
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [step, setStep] = useState(0);

  // Adjust volume based on step
  useEffect(() => {
    if (step === 4) {
      // Pray step — fade to quiet
      music.setVolume(25);
    } else if (step === 5) {
      // Complete — hide mini player
      music.setShowMiniPlayer(false);
      music.setVolume(30);
    } else {
      music.setVolume(50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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

  // Ambient plays during Read (0) through Apply (3), quieter during Pray (4), off on Complete (5)
  const ambientActive = step >= 0 && step <= 3;
  const ambientVolume = step === 3 ? 10 : 15;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-16">
      {/* Ambient background music */}
      <AmbientPlayer active={ambientActive} volume={ambientVolume} />

      {step < totalSteps && (
        <StepIndicator total={totalSteps} current={step} onGoTo={setStep} />
      )}

      {/* Back button */}
      <button
        onClick={() => step === 0 ? router.push("/") : setStep(step - 1)}
        className="fixed top-8 left-8 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer z-10"
      >
        ← Back
      </button>

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
