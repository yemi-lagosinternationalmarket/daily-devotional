"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Devotional, JournalEntry } from "@/lib/types";

interface DevotionalWithEntries extends Devotional {
  journal_entries: JournalEntry[];
}

export default function JournalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState<DevotionalWithEntries | null>(null);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/devotional/${params.id}`)
      .then((r) => r.json())
      .then(setData);
  }, [params.id]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-ghost)]">Loading...</p>
      </div>
    );
  }

  const date = new Date(data.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const observeEntry = data.journal_entries.find((e) => e.step === "observe");
  const applyEntry = data.journal_entries.find((e) => e.step === "apply");

  return (
    <div className="min-h-screen max-w-[640px] mx-auto px-8 py-12">
      <button
        onClick={() => router.push("/journal")}
        className="text-[13px] text-[var(--text-faint)] hover:text-[var(--text-ghost)] transition-colors cursor-pointer mb-8"
      >
        ← Back to journal
      </button>

      <p className="text-[13px] text-[var(--text-ghost)] mb-2">{date}</p>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2 tracking-[-0.3px]">
        {data.scripture_ref}
      </h1>
      <p className="text-sm text-[var(--text-tertiary)] mb-8">
        {data.topic && `Topic: ${data.topic}`}
        {data.topic && data.mood && " · "}
        {data.mood && `Mood: ${data.mood}`}
        {!data.topic && !data.mood && "I'm Feeling Blessed"}
      </p>

      {/* Scripture */}
      <section className="mb-8">
        <h2 className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-3">
          Scripture
        </h2>
        <p className="text-base text-[var(--text-secondary)] leading-[1.8]">
          {data.scripture_text}
        </p>
      </section>

      {/* Observe response */}
      {observeEntry && (
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-3">
            Your observation
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-[1.7] p-4 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]">
            {observeEntry.response_text}
          </p>
        </section>
      )}

      {/* Reflection */}
      <section className="mb-8">
        <h2 className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-3">
          Reflection
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-[1.8] whitespace-pre-wrap">
          {data.reflect_content}
        </p>
      </section>

      {/* Apply response */}
      {applyEntry && (
        <section className="mb-8">
          <h2 className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-3">
            Your commitment
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-[1.7] p-4 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]">
            {applyEntry.response_text}
          </p>
        </section>
      )}

      {/* Prayer */}
      <section className="mb-8">
        <h2 className="text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-3">
          Prayer
        </h2>
        <p className="text-sm italic text-[var(--text-tertiary)] leading-[1.8]">
          {data.pray_text}
        </p>
      </section>

      {/* Key verse */}
      <div className="mt-12 p-5 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-center">
        <p className="text-sm italic text-[var(--text-tertiary)] leading-[1.7]">
          &ldquo;{data.key_verse}&rdquo;
        </p>
        <p className="text-[11px] text-[var(--text-faint)] mt-2">
          {data.scripture_ref}
        </p>
      </div>
    </div>
  );
}
