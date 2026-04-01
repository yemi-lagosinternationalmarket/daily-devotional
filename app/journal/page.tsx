"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Devotional } from "@/lib/types";
import { JournalList } from "@/components/journal-list";

export default function JournalPage() {
  const router = useRouter();
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);

  useEffect(() => {
    fetch("/api/journal")
      .then((r) => r.json())
      .then(setDevotionals);
  }, []);

  return (
    <div className="min-h-screen max-w-[640px] mx-auto px-8 py-12">
      <button
        onClick={() => router.push("/")}
        className="text-[13px] text-[var(--text-faint)] hover:text-[var(--text-ghost)] transition-colors cursor-pointer mb-8"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-8 tracking-[-0.3px]">
        Your journal
      </h1>

      <JournalList
        devotionals={devotionals}
        onSelect={(id) => router.push(`/journal/${id}`)}
      />
    </div>
  );
}
