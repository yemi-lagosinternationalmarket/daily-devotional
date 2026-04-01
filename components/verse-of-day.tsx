import { getVerseOfDay } from "@/lib/verses";

export function VerseOfDay() {
  const verse = getVerseOfDay();

  return (
    <div className="text-center mt-8">
      <p className="text-[15px] italic text-[var(--text-tertiary)] leading-[1.7] max-w-[280px] mx-auto">
        &ldquo;{verse.text}&rdquo;
      </p>
      <p className="text-[11px] font-medium text-[var(--text-faint)] tracking-[0.5px] mt-2.5">
        {verse.ref}
      </p>
    </div>
  );
}
