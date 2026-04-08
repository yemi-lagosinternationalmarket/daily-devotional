"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, duration = 5000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade-out
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]
        py-2.5 px-5 rounded-xl
        bg-[rgba(30,30,32,0.95)] border border-[var(--surface-border)]
        text-[13px] text-[var(--text-secondary)]
        transition-opacity duration-300
        ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {message}
    </div>
  );
}
