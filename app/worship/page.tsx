"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorshipScreen } from "@/components/worship-screen";

function WorshipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [devotionalId, setDevotionalId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function generate() {
      const body = {
        topic: searchParams.get("topic"),
        mood: searchParams.get("mood"),
        free_text: searchParams.get("free_text"),
        input_type: searchParams.get("input_type") || "blessed",
        is_want_more: searchParams.get("want_more") === "true",
        parent_devotional_id: searchParams.get("parent_id"),
      };

      const res = await fetch("/api/devotional/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setDevotionalId(data.id);
      setIsReady(true);
    }

    generate();
  }, [searchParams]);

  function handleReady() {
    if (devotionalId) {
      router.push(`/devotional?id=${devotionalId}`);
    }
  }

  return <WorshipScreen isReady={isReady} onReady={handleReady} />;
}

export default function WorshipPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-ghost)]">Loading...</p>
      </div>
    }>
      <WorshipContent />
    </Suspense>
  );
}
