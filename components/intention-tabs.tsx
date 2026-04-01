"use client";

import { useState } from "react";
import { TopicGrid } from "./topic-grid";
import { MoodPills } from "./mood-pills";

type Tab = "topic" | "mood" | "speak";

interface IntentionTabsProps {
  onSubmit: (data: { topic?: string; mood?: string; free_text?: string }) => void;
}

export function IntentionTabs({ onSubmit }: IntentionTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("topic");
  const [freeText, setFreeText] = useState("");

  const tabs: { key: Tab; label: string }[] = [
    { key: "topic", label: "Topic" },
    { key: "mood", label: "Mood" },
    { key: "speak", label: "Speak freely" },
  ];

  return (
    <div className="flex flex-col flex-1">
      {/* Tab switcher */}
      <div className="flex bg-[rgba(255,255,255,0.03)] rounded-[10px] p-[3px] gap-[2px] mb-7">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 text-center text-[13px] font-medium rounded-lg transition-all duration-200 cursor-pointer
              ${activeTab === t.key
                ? "bg-[rgba(255,255,255,0.06)] text-[var(--text-primary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === "topic" && (
        <TopicGrid onSelect={(topic) => onSubmit({ topic })} />
      )}

      {activeTab === "mood" && (
        <MoodPills onSelect={(mood) => onSubmit({ mood })} />
      )}

      {activeTab === "speak" && (
        <div className="flex flex-col flex-1">
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="What's weighing on you this morning? What are you thankful for? Just say it however it comes out..."
            className="flex-1 min-h-[160px] p-[18px] rounded-xl
              bg-[var(--surface)] border border-[var(--surface-border)]
              text-sm text-[var(--text-primary)] leading-[1.7]
              placeholder:text-[var(--text-ghost)] resize-none
              outline-none focus:border-[var(--surface-hover-border)]"
          />
          <p className="text-xs text-[var(--text-faint)] mt-2.5">
            No structure needed. Write like you&apos;d talk to God.
          </p>
          {freeText.trim() && (
            <button
              onClick={() => onSubmit({ free_text: freeText })}
              className="mt-4 py-3 px-6 rounded-xl
                bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
                hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
                transition-all duration-150 cursor-pointer
                text-[15px] font-medium text-[var(--text-secondary)]"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}
