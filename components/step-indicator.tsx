interface StepIndicatorProps {
  total: number;
  current: number;
}

export function StepIndicator({ total, current }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        return (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300
              ${isCurrent ? "w-6 bg-[rgba(255,255,255,0.5)]" : "w-2"}
              ${isDone ? "bg-[rgba(255,255,255,0.25)]" : ""}
              ${!isDone && !isCurrent ? "bg-[rgba(255,255,255,0.06)]" : ""}
            `}
          />
        );
      })}
    </div>
  );
}
