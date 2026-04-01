interface StepPrayProps {
  text: string;
  onNext: () => void;
}

export function StepPray({ text, onNext }: StepPrayProps) {
  return (
    <div className="max-w-[640px] mx-auto px-8">
      <p className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase text-center mb-5">
        Pray
      </p>

      <p className="text-[17px] italic text-[var(--text-secondary)] leading-[1.9]">
        {text}
      </p>

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2">
        <button
          onClick={onNext}
          className="py-3.5 px-11 rounded-xl
            bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
            hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
            transition-all duration-150 cursor-pointer
            text-[15px] font-medium text-[var(--text-primary)]"
        >
          Amen ✓
        </button>
      </div>
    </div>
  );
}
