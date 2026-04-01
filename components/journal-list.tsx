import type { Devotional } from "@/lib/types";

interface JournalListProps {
  devotionals: Devotional[];
  onSelect: (id: string) => void;
}

export function JournalList({ devotionals, onSelect }: JournalListProps) {
  if (devotionals.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-ghost)]">No entries yet. Complete a devotional to see it here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {devotionals.map((d) => {
        const date = new Date(d.created_at).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        const label = d.topic || d.mood || "Blessed";

        return (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className="flex items-start gap-4 p-5 rounded-xl text-left
              bg-[var(--surface)] border border-[var(--surface-border)]
              hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]
              transition-all duration-150 cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-[13px] font-medium text-[var(--text-ghost)]">
                  {date}
                </span>
                <span className="text-[12px] text-[var(--text-faint)] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.03)]">
                  {label}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-[1.5]">
                {d.scripture_ref}
              </p>
              <p className="text-[13px] text-[var(--text-tertiary)] mt-1 italic">
                &ldquo;{d.key_verse.slice(0, 80)}{d.key_verse.length > 80 ? "..." : ""}&rdquo;
              </p>
            </div>
            <span className="text-[var(--text-faint)] text-sm mt-1">→</span>
          </button>
        );
      })}
    </div>
  );
}
