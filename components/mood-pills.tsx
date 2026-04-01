"use client";

const MOODS = [
  { emoji: "😬", label: "Stressed" },
  { emoji: "😊", label: "Joyful" },
  { emoji: "😴", label: "Tired" },
  { emoji: "😖", label: "Restless" },
  { emoji: "🌞", label: "Hopeful" },
  { emoji: "😰", label: "Overwhelmed" },
  { emoji: "🙏", label: "Grateful" },
  { emoji: "💔", label: "Hurting" },
];

interface MoodPillsProps {
  onSelect: (mood: string) => void;
}

export function MoodPills({ onSelect }: MoodPillsProps) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {MOODS.map((m) => (
        <button
          key={m.label}
          onClick={() => onSelect(m.label)}
          className="flex items-center gap-2 px-[18px] py-3 rounded-full
            bg-[var(--surface)] border border-[var(--surface-border)]
            hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]
            text-sm text-[var(--text-secondary)] transition-all duration-150 cursor-pointer"
        >
          <span className="text-base grayscale-[20%]">{m.emoji}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}
