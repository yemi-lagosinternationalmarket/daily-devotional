"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface Settings {
  llm_base_url: string;
  llm_api_key: string | null;
  llm_model: string;
  bible_translation: string;
  default_vibe: string;
  theme: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setSettings);
  }, []);

  async function save(partial: Partial<Settings>) {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    const updated = await res.json();
    setSettings(updated);
    setSaved("Saved");
    setTimeout(() => setSaved(""), 2000);
  }

  async function testConnection() {
    if (!settings) return;
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/settings/test-llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_url: settings.llm_base_url,
        api_key: settings.llm_api_key,
        model: settings.llm_model,
      }),
    });
    const data = await res.json();
    setTestResult({ ok: data.ok, message: data.ok ? "Connection works!" : data.error });
    setTesting(false);
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--text-ghost)]">Loading...</p>
      </div>
    );
  }

  const inputClass = "w-full p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] outline-none focus:border-[var(--surface-hover-border)]";
  const labelClass = "text-[11px] font-semibold text-[var(--text-ghost)] tracking-[2px] uppercase mb-3";
  const sectionClass = "mb-10";

  return (
    <div className="min-h-screen max-w-[640px] mx-auto px-8 py-12">
      <button
        onClick={() => router.push("/")}
        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer mb-8"
      >
        &larr; Back
      </button>

      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-[-0.3px]">
          Settings
        </h1>
        {saved && (
          <span className="text-sm text-[rgba(100,255,100,0.6)]">{saved}</span>
        )}
      </div>

      {/* LLM Provider */}
      <div className={sectionClass}>
        <p className={labelClass}>AI Provider</p>
        <p className="text-xs text-[var(--text-faint)] mb-4">
          Works with OpenAI, Anthropic, LiteLLM, Ollama, or any OpenAI-compatible endpoint.
        </p>
        <div className="flex flex-col gap-3">
          <input
            className={inputClass}
            placeholder="Base URL (e.g., https://api.openai.com/v1)"
            value={settings.llm_base_url}
            onChange={(e) => setSettings({ ...settings, llm_base_url: e.target.value })}
            onBlur={() => save({ llm_base_url: settings.llm_base_url })}
          />
          <input
            className={inputClass}
            type="password"
            placeholder="API Key"
            value={settings.llm_api_key || ""}
            onChange={(e) => setSettings({ ...settings, llm_api_key: e.target.value })}
            onBlur={() => save({ llm_api_key: settings.llm_api_key })}
          />
          <input
            className={inputClass}
            placeholder="Model (e.g., gpt-4o)"
            value={settings.llm_model}
            onChange={(e) => setSettings({ ...settings, llm_model: e.target.value })}
            onBlur={() => save({ llm_model: settings.llm_model })}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={testConnection}
              disabled={testing}
              className="py-2.5 px-6 rounded-xl bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
                hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
                transition-all duration-150 cursor-pointer text-sm font-medium text-[var(--text-secondary)]
                disabled:opacity-50"
            >
              {testing ? "Testing..." : "Test Connection"}
            </button>
            {testResult && (
              <span className={`text-sm ${testResult.ok ? "text-[rgba(100,255,100,0.6)]" : "text-[rgba(255,100,100,0.8)]"}`}>
                {testResult.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bible Translation */}
      <div className={sectionClass}>
        <p className={labelClass}>Bible Translation</p>
        <div className="flex gap-2">
          {["ESV", "NIV", "NLT", "KJV"].map((t) => (
            <button
              key={t}
              onClick={() => save({ bible_translation: t })}
              className={`py-2.5 px-5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
                ${settings.bible_translation === t
                  ? "bg-[var(--surface-selected)] border border-[var(--surface-selected-border)] text-[var(--text-primary)]"
                  : "bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Default Vibe */}
      <div className={sectionClass}>
        <p className={labelClass}>Default Worship Vibe</p>
        <div className="flex gap-2">
          {["praise", "worship", "instrumental"].map((v) => (
            <button
              key={v}
              onClick={() => save({ default_vibe: v })}
              className={`py-2.5 px-5 rounded-xl text-sm font-medium capitalize transition-all duration-150 cursor-pointer
                ${settings.default_vibe === v
                  ? "bg-[var(--surface-selected)] border border-[var(--surface-selected-border)] text-[var(--text-primary)]"
                  : "bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className={sectionClass}>
        <p className={labelClass}>Account</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="py-2.5 px-6 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]
            hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]
            transition-all duration-150 cursor-pointer text-sm text-[var(--text-secondary)]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
