interface StepReflectProps {
  content: string;
  onNext: () => void;
}

export function StepReflect({ content, onNext }: StepReflectProps) {
  return (
    <div className="max-w-[640px] mx-auto px-8">
      <p className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase text-center mb-5">
        Reflect
      </p>

      <div className="text-base text-[var(--text-secondary)] leading-[1.8] whitespace-pre-wrap">
        {content}
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2">
        <button
          onClick={onNext}
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
