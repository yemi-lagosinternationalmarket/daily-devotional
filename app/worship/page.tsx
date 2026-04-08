"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorshipScreen } from "@/components/worship-screen";

function WorshipContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [devotionalId, setDevotionalId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const body = {
      topic: searchParams.get("topic"),
      mood: searchParams.get("mood"),
      free_text: searchParams.get("free_text"),
      input_type: searchParams.get("input_type") || "blessed",
      is_want_more: searchParams.get("want_more") === "true",
      parent_devotional_id: searchParams.get("parent_id"),
    };

    const MAX_RETRIES = 5;

    async function attempt(): Promise<boolean> {
      try {
        const res = await fetch("/api/devotional/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) return false;

        const reader = res.body?.getReader();
        if (!reader) return false;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const messages = buffer.split("\n\n");
          buffer = messages.pop() || "";

          for (const msg of messages) {
            const lines = msg.split("\n");
            let eventType = "";
            let data = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) eventType = line.slice(7).trim();
              else if (line.startsWith("data: ")) data = line.slice(6);
            }

            if (!data) continue;

            if (eventType === "status") {
              setStatus(data);
            } else if (eventType === "done") {
              try {
                const devotional = JSON.parse(data);
                setDevotionalId(devotional.id);
                setIsReady(true);
                return true;
              } catch {
                return false;
              }
            } else if (eventType === "error") {
              return false;
            }
          }
        }
        return false;
      } catch {
        return false;
      }
    }

    async function generate() {
      for (let i = 1; i <= MAX_RETRIES; i++) {
        setStatus("Thinking about what you need to hear...");
        setError(false);

        const success = await attempt();
        if (success) return;
      }

      setStatus("Something went wrong. Try again.");
      setError(true);
    }

    generate();
  }, [searchParams]);

  function handleReady() {
    if (devotionalId) {
      router.push(`/devotional?id=${devotionalId}`);
    }
  }

  return (
    <WorshipScreen
      isReady={isReady}
      onReady={handleReady}
      onBack={() => router.push("/")}
      status={status}
      error={error}
      topic={searchParams.get("topic")}
      mood={searchParams.get("mood")}
    />
  );
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
