"use client";

interface BlessedButtonProps {
  onClick: () => void;
}

export function BlessedButton({ onClick }: BlessedButtonProps) {
  return (
    <div className="text-center">
      <button
        onClick={onClick}
        className="w-full py-[18px] px-6 rounded-xl
          bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
          hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
          transition-all duration-150 cursor-pointer
          text-[15px] font-medium text-[var(--text-secondary)]"
      >
        I&apos;m Feeling Blessed
      </button>
      <p className="text-[11px] text-[var(--text-faint)] mt-2.5 tracking-[0.2px]">
        Let God choose for you
      </p>
    </div>
  );
}
