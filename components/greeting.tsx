"use client";

export function Greeting() {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning." : hour < 17 ? "Good afternoon." : "Good evening.";

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="text-center">
      <p className="text-[13px] font-medium text-[var(--text-ghost)] tracking-[1.5px] uppercase mb-4">
        {dateStr}
      </p>
      <h1 className="text-[42px] font-semibold text-[var(--text-primary)] leading-[1.1] tracking-[-0.5px]">
        {greeting}
      </h1>
    </div>
  );
}
