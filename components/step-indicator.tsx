interface StepIndicatorProps {
  total: number;
  current: number;
  onGoTo?: (step: number) => void;
}

export function StepIndicator({ total, current, onGoTo }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        return (
          <div
            key={i}
            onClick={isDone && onGoTo ? () => onGoTo(i) : undefined}
            className={`h-2 rounded-full transition-all duration-300
              ${isCurrent ? "w-6 bg-[rgba(255,255,255,0.5)]" : "w-2"}
              ${isDone ? "bg-[rgba(255,255,255,0.25)] cursor-pointer hover:bg-[rgba(255,255,255,0.4)]" : ""}
              ${!isDone && !isCurrent ? "bg-[rgba(255,255,255,0.06)]" : ""}
            `}
          />
        );
      })}
    </div>
  );
}
