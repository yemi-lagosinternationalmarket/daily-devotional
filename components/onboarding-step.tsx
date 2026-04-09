"use client";


interface Option {
  label: string;
  value: string;
}

interface OnboardingStepProps {
  prompt: string;
  options: readonly Option[];
  detailPlaceholder: string;
  selected: string | null;
  detail: string;
  onSelect: (value: string) => void;
  onDetailChange: (detail: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingStep({
  prompt,
  options,
  detailPlaceholder,
  selected,
  detail,
  onSelect,
  onDetailChange,
  onNext,
  onSkip,
}: OnboardingStepProps) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-8 tracking-[-0.3px] text-center leading-[1.4]">
        {prompt}
      </h2>

      <div className="w-full flex flex-col gap-2.5 mb-6">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full text-left px-5 py-3.5 rounded-xl text-[14px] leading-[1.4]
              transition-all duration-150 cursor-pointer
              ${selected === opt.value
                ? "bg-[var(--surface-selected)] border border-[var(--surface-selected-border)] text-[var(--text-primary)]"
                : "bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <textarea
        value={detail}
        onChange={(e) => onDetailChange(e.target.value)}
        placeholder={detailPlaceholder}
        rows={2}
        maxLength={200}
        className="w-full p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]
          text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]
          outline-none focus:border-[var(--surface-hover-border)] resize-none mb-6"
      />

      <div className="w-full flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-[var(--text-ghost)] hover:text-[var(--text-tertiary)] transition-colors cursor-pointer"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="py-2.5 px-8 rounded-xl bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
            hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
            transition-all duration-150 cursor-pointer text-sm font-medium text-[var(--text-primary)]
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
