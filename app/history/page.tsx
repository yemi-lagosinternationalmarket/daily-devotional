"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Devotional {
  id: string;
  scripture_ref: string;
  key_verse: string;
  date: string;
  topic: string | null;
  mood: string | null;
  input_type: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/devotional/list")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDevotionals(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by date
  const grouped = devotionals.reduce<Record<string, Devotional[]>>((acc, d) => {
    const key = new Date(d.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <div className="min-h-screen max-w-[640px] mx-auto px-8 py-12">
      <button
        onClick={() => router.push("/")}
        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer mb-8"
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.3px] mb-10">
        Your Devotionals
      </h1>

      {loading ? (
        <p className="text-[var(--text-ghost)]">Loading...</p>
      ) : devotionals.length === 0 ? (
        <p className="text-[var(--text-tertiary)]">No devotionals yet. Start your first one today.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <p className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-3">
                {date}
              </p>
              <div className="flex flex-col gap-1">
                {items.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => router.push(`/devotional?id=${d.id}`)}
                    className="flex items-start justify-between py-3 px-4 -mx-4 rounded-xl
                      hover:bg-[var(--surface)] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex flex-col gap-1 min-w-0 mr-4">
                      <span className="text-[14px] text-[var(--text-secondary)]">
                        {d.scripture_ref}
                      </span>
                      {(d.topic || d.mood) && (
                        <span className="text-[12px] text-[var(--text-faint)] truncate">
                          {[d.topic, d.mood].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-[var(--text-faint)] shrink-0 mt-0.5">
                      &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
