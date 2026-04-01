"use client";

const TOPICS = [
  { icon: "☷", label: "Peace" },
  { icon: "⚕", label: "Strength" },
  { icon: "✿", label: "Gratitude" },
  { icon: "◈", label: "Anxiety" },
  { icon: "✦", label: "Purpose" },
  { icon: "⌘", label: "Patience" },
  { icon: "❥", label: "Forgiveness" },
  { icon: "☆", label: "Identity" },
  { icon: "☘", label: "Relationships" },
];

interface TopicGridProps {
  onSelect: (topic: string) => void;
}

export function TopicGrid({ onSelect }: TopicGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
      {TOPICS.map((t) => (
        <button
          key={t.label}
          onClick={() => onSelect(t.label)}
          className="flex flex-col items-start p-5 rounded-xl
            bg-[var(--surface)] border border-[var(--surface-border)]
            hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]
            transition-all duration-150 cursor-pointer text-left"
        >
          <span className="text-xl mb-2 grayscale-[30%]">{t.icon}</span>
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}
