# Persona Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4-screen conversational onboarding flow after registration that builds a user persona to subtly shape AI-generated devotional tone and content.

**Architecture:** New `/onboarding` page with client-side step state (matching devotional page pattern). Persona stored as JSONB in `user_settings`. A new `lib/persona.ts` builds natural-language sentences from persona data, injected into the AI system prompt. Home page redirects to onboarding if persona is null.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS 4, PostgreSQL JSONB, existing OpenAI-compatible AI pipeline.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/persona.ts` | Create | Persona type, question definitions, sentence builder |
| `components/onboarding-step.tsx` | Create | Reusable question screen (prompt, options, text input, skip/next) |
| `app/onboarding/page.tsx` | Create | Onboarding page with 4-step conversational flow |
| `lib/types.ts` | Modify | Add `Persona` interface |
| `init.sql` | Modify | Add `persona JSONB` column to `user_settings` |
| `lib/queries.ts` | Modify | Add `updatePersona` helper, add `persona` to allowed fields |
| `app/api/settings/route.ts` | Modify | No changes needed — already passes body through to `updateUserSettings` |
| `lib/ai.ts` | Modify | Import persona builder, inject into system prompt |
| `app/api/devotional/generate/route.ts` | Modify | Pass persona from settings to AI functions |
| `app/register/page.tsx` | Modify | Redirect to `/onboarding` instead of `/` |
| `app/page.tsx` | Modify | Check persona, redirect to `/onboarding` if null |
| `app/settings/page.tsx` | Modify | Add "Your Profile" section |

---

### Task 1: Database Schema — Add persona column

**Files:**
- Modify: `init.sql:14-29`

- [ ] **Step 1: Add persona column to init.sql**

In `init.sql`, add the `persona` column to the `user_settings` table definition:

```sql
  spotify_playlist_instrumental TEXT,
  persona JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

- [ ] **Step 2: Run migration on live database**

Run:
```bash
cd /root/daily-devotional && docker exec -i daily-devotional-db psql -U postgres -d devotional -c "ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS persona JSONB DEFAULT NULL;"
```

Expected: `ALTER TABLE`

- [ ] **Step 3: Verify column exists**

Run:
```bash
cd /root/daily-devotional && docker exec -i daily-devotional-db psql -U postgres -d devotional -c "\d user_settings" | grep persona
```

Expected: line showing `persona | jsonb |`

- [ ] **Step 4: Commit**

```bash
cd /root/daily-devotional && git add init.sql && git commit -m "feat(db): add persona JSONB column to user_settings"
```

---

### Task 2: Persona Type and Sentence Builder

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/persona.ts`

- [ ] **Step 1: Add Persona interface to types.ts**

Add after the `UserSettings` interface (after line 79):

```typescript
export interface Persona {
  faith_stage?: "new" | "mature" | "returning" | "complicated";
  faith_detail?: string;
  season?: "growing" | "hard" | "stuck" | "transition";
  season_detail?: string;
  tone?: "warm" | "direct" | "theological" | "simple";
  tone_detail?: string;
  tradition?: "evangelical" | "catholic" | "mainline" | "pentecostal" | "unspecified";
  tradition_detail?: string;
}
```

Also add `persona` to the `UserSettings` interface (after `spotify_playlist_instrumental`):

```typescript
  persona: Persona | null;
```

- [ ] **Step 2: Create lib/persona.ts**

```typescript
import type { Persona } from "./types";

const FAITH_SENTENCES: Record<string, string> = {
  new: "The reader is just beginning their faith journey.",
  mature: "The reader has been walking with God for a while.",
  returning: "The reader is returning to faith after time away.",
  complicated: "The reader has a complicated relationship with faith.",
};

const SEASON_SENTENCES: Record<string, string> = {
  growing: "They're in a season of growth and gratitude.",
  hard: "They're walking through a difficult season.",
  stuck: "They're feeling distant or stuck in their faith.",
  transition: "They're in a season of transition and change.",
};

const TONE_SENTENCES: Record<string, string> = {
  warm: "They prefer warm, encouraging language.",
  direct: "They prefer honest, direct language.",
  theological: "They prefer deep, theological language.",
  simple: "They prefer simple, clear language.",
};

const TRADITION_SENTENCES: Record<string, string> = {
  evangelical: "They come from an Evangelical background.",
  catholic: "They come from a Catholic background.",
  mainline: "They come from a Mainline Protestant background.",
  pentecostal: "They come from a Pentecostal/Charismatic background.",
};

export function buildPersonaPrompt(persona: Persona | null | undefined): string {
  if (!persona) return "";

  const parts: string[] = [];

  if (persona.faith_stage && FAITH_SENTENCES[persona.faith_stage]) {
    let s = FAITH_SENTENCES[persona.faith_stage];
    if (persona.faith_detail) s += ` (${persona.faith_detail})`;
    parts.push(s);
  }

  if (persona.season && SEASON_SENTENCES[persona.season]) {
    let s = SEASON_SENTENCES[persona.season];
    if (persona.season_detail) s += ` (${persona.season_detail})`;
    parts.push(s);
  }

  if (persona.tone && TONE_SENTENCES[persona.tone]) {
    let s = TONE_SENTENCES[persona.tone];
    if (persona.tone_detail) s += ` (${persona.tone_detail})`;
    parts.push(s);
  }

  if (persona.tradition && persona.tradition !== "unspecified" && TRADITION_SENTENCES[persona.tradition]) {
    let s = TRADITION_SENTENCES[persona.tradition];
    if (persona.tradition_detail) s += ` (${persona.tradition_detail})`;
    parts.push(s);
  }

  return parts.join(" ");
}

export const ONBOARDING_QUESTIONS = [
  {
    key: "faith_stage" as const,
    detailKey: "faith_detail" as const,
    prompt: "Where are you in your walk with God?",
    options: [
      { label: "Just getting started", value: "new" },
      { label: "Been at this a while", value: "mature" },
      { label: "Coming back after some time away", value: "returning" },
      { label: "It's complicated", value: "complicated" },
    ],
    detailPlaceholder: "Anything else you'd like to share?",
  },
  {
    key: "season" as const,
    detailKey: "season_detail" as const,
    prompt: "What season of life are you in right now?",
    options: [
      { label: "Growing and grateful", value: "growing" },
      { label: "Walking through something hard", value: "hard" },
      { label: "Feeling distant or stuck", value: "stuck" },
      { label: "In transition — lots of change", value: "transition" },
    ],
    detailPlaceholder: "Want to share more?",
  },
  {
    key: "tone" as const,
    detailKey: "tone_detail" as const,
    prompt: "How do you like to be spoken to?",
    options: [
      { label: "Warm and encouraging", value: "warm" },
      { label: "Honest and direct", value: "direct" },
      { label: "Deep and theological", value: "theological" },
      { label: "Simple and clear", value: "simple" },
    ],
    detailPlaceholder: "Anything else about how you like to learn?",
  },
  {
    key: "tradition" as const,
    detailKey: "tradition_detail" as const,
    prompt: "Do you come from a particular church tradition?",
    options: [
      { label: "Non-denominational / Evangelical", value: "evangelical" },
      { label: "Catholic", value: "catholic" },
      { label: "Mainline Protestant", value: "mainline" },
      { label: "Pentecostal / Charismatic", value: "pentecostal" },
      { label: "I'd rather not say", value: "unspecified" },
    ],
    detailPlaceholder: "Anything else about your background?",
  },
] as const;
```

- [ ] **Step 3: Verify types compile**

Run:
```bash
cd /root/daily-devotional && npx tsc --noEmit lib/persona.ts lib/types.ts 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd /root/daily-devotional && git add lib/types.ts lib/persona.ts && git commit -m "feat: add Persona type and sentence builder for AI prompt injection"
```

---

### Task 3: Database Query Helpers

**Files:**
- Modify: `lib/queries.ts:11-37`

- [ ] **Step 1: Add persona to the allowed fields in updateUserSettings**

In `lib/queries.ts`, add `"persona"` to the `allowed` array on line 16:

```typescript
  const allowed = ["llm_base_url", "llm_api_key", "llm_model", "bible_translation", "default_vibe", "theme", "spotify_access_token", "spotify_refresh_token", "spotify_connected", "spotify_playlist_praise", "spotify_playlist_worship", "spotify_playlist_instrumental", "persona"];
```

- [ ] **Step 2: Verify the query module loads**

Run:
```bash
cd /root/daily-devotional && npx tsc --noEmit lib/queries.ts 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /root/daily-devotional && git add lib/queries.ts && git commit -m "feat(db): allow persona field in updateUserSettings"
```

---

### Task 4: AI Prompt Integration

**Files:**
- Modify: `lib/ai.ts:1-3, 144-198`

- [ ] **Step 1: Import persona builder**

At the top of `lib/ai.ts`, add after the existing imports (line 3):

```typescript
import { buildPersonaPrompt } from "./persona";
```

- [ ] **Step 2: Add persona parameter to generateDevotional**

Modify `generateDevotional` (line 144) to accept persona data via settings. The `settings` parameter already contains `persona`. Update the messages array to inject persona context.

Replace the `messages` array in `generateDevotional` (lines 155-158):

```typescript
    const personaContext = buildPersonaPrompt(settings?.persona);
    const systemContent = personaContext
      ? `${SYSTEM_PROMPT}\n\nAbout the reader: ${personaContext}`
      : SYSTEM_PROMPT;

    const response = await client.chat.completions.create({
      model,
      max_tokens: 16384,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userPrompt },
      ],
    });
```

- [ ] **Step 3: Do the same for generateDevotionalStreaming**

Replace the `messages` array in `generateDevotionalStreaming` (lines 193-196):

```typescript
    const personaContext = buildPersonaPrompt(settings?.persona);
    const systemContent = personaContext
      ? `${SYSTEM_PROMPT}\n\nAbout the reader: ${personaContext}`
      : SYSTEM_PROMPT;

    const stream = await client.chat.completions.create({
      model,
      max_tokens: 16384,
      stream: true,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userPrompt },
      ],
    });
```

- [ ] **Step 4: Verify types compile**

Run:
```bash
cd /root/daily-devotional && npx tsc --noEmit lib/ai.ts 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd /root/daily-devotional && git add lib/ai.ts && git commit -m "feat(ai): inject persona context into devotional system prompt"
```

---

### Task 5: Onboarding Step Component

**Files:**
- Create: `components/onboarding-step.tsx`

- [ ] **Step 1: Create the reusable onboarding step component**

This component renders one question screen: prompt text, option buttons, optional text area, skip and next buttons. It matches the app's existing dark theme and button styles (from `register/page.tsx` and `settings/page.tsx`).

```typescript
"use client";

import { useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface OnboardingStepProps {
  prompt: string;
  options: readonly Option[];
  detailPlaceholder: string;
  selected: string | null;
  detail: string;
  onSelect: (value: string) => void;
  onDetailChange: (detail: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingStep({
  prompt,
  options,
  detailPlaceholder,
  selected,
  detail,
  onSelect,
  onDetailChange,
  onNext,
  onSkip,
}: OnboardingStepProps) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-8 tracking-[-0.3px] text-center leading-[1.4]">
        {prompt}
      </h2>

      <div className="w-full flex flex-col gap-2.5 mb-6">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`w-full text-left px-5 py-3.5 rounded-xl text-[14px] leading-[1.4]
              transition-all duration-150 cursor-pointer
              ${selected === opt.value
                ? "bg-[var(--surface-selected)] border border-[var(--surface-selected-border)] text-[var(--text-primary)]"
                : "bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:border-[var(--surface-hover-border)]"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {selected && (
        <textarea
          value={detail}
          onChange={(e) => onDetailChange(e.target.value)}
          placeholder={detailPlaceholder}
          rows={2}
          className="w-full p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--surface-border)]
            text-sm text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]
            outline-none focus:border-[var(--surface-hover-border)] resize-none mb-6"
        />
      )}

      <div className="w-full flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-[var(--text-ghost)] hover:text-[var(--text-tertiary)] transition-colors cursor-pointer"
        >
          Skip
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="py-2.5 px-8 rounded-xl bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
            hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
            transition-all duration-150 cursor-pointer text-sm font-medium text-[var(--text-primary)]
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run:
```bash
cd /root/daily-devotional && npx tsc --noEmit components/onboarding-step.tsx 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /root/daily-devotional && git add components/onboarding-step.tsx && git commit -m "feat: add OnboardingStep component for persona questions"
```

---

### Task 6: Onboarding Page

**Files:**
- Create: `app/onboarding/page.tsx`

- [ ] **Step 1: Create the onboarding page**

This page manages the 4-step flow using client-side state (same pattern as `devotional/page.tsx`). It saves persona data to the API on completion or skip-all.

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStep } from "@/components/onboarding-step";
import { ONBOARDING_QUESTIONS } from "@/lib/persona";
import type { Persona } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState<Persona>({});
  const [saving, setSaving] = useState(false);

  const totalSteps = ONBOARDING_QUESTIONS.length;
  const isComplete = step >= totalSteps;

  async function savePersona(data: Persona) {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ persona: data }),
    });
    setSaving(false);
  }

  async function handleNext() {
    const nextStep = step + 1;
    if (nextStep >= totalSteps) {
      await savePersona(persona);
      setStep(nextStep);
    } else {
      setStep(nextStep);
    }
  }

  async function handleSkip() {
    // Clear this question's answers and advance
    const q = ONBOARDING_QUESTIONS[step];
    const updated = { ...persona };
    delete updated[q.key];
    delete updated[q.detailKey];
    setPersona(updated);

    const nextStep = step + 1;
    if (nextStep >= totalSteps) {
      await savePersona(updated);
      setStep(nextStep);
    } else {
      setStep(nextStep);
    }
  }

  function handleSelect(value: string) {
    const q = ONBOARDING_QUESTIONS[step];
    setPersona((prev) => ({ ...prev, [q.key]: value }));
  }

  function handleDetailChange(detail: string) {
    const q = ONBOARDING_QUESTIONS[step];
    setPersona((prev) => ({
      ...prev,
      [q.detailKey]: detail || undefined,
    }));
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3 tracking-[-0.3px]">
          We're glad you're here.
        </h2>
        <p className="text-sm text-[var(--text-tertiary)] mb-8">
          Let's get started.
        </p>
        <button
          onClick={() => router.push("/")}
          disabled={saving}
          className="py-3 px-10 rounded-xl bg-[var(--interactive-bg)] border border-[var(--interactive-border)]
            hover:bg-[var(--interactive-hover-bg)] hover:border-[var(--interactive-hover-border)]
            transition-all duration-150 cursor-pointer text-[15px] font-medium text-[var(--text-primary)]
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Begin"}
        </button>
      </div>
    );
  }

  const q = ONBOARDING_QUESTIONS[step];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <OnboardingStep
        key={step}
        prompt={q.prompt}
        options={q.options}
        detailPlaceholder={q.detailPlaceholder}
        selected={(persona[q.key] as string) || null}
        detail={(persona[q.detailKey] as string) || ""}
        onSelect={handleSelect}
        onDetailChange={handleDetailChange}
        onNext={handleNext}
        onSkip={handleSkip}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run:
```bash
cd /root/daily-devotional && npx tsc --noEmit app/onboarding/page.tsx 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /root/daily-devotional && git add app/onboarding/page.tsx && git commit -m "feat: add /onboarding page with 4-step persona conversation flow"
```

---

### Task 7: Registration Redirect

**Files:**
- Modify: `app/register/page.tsx:44`

- [ ] **Step 1: Change post-registration redirect from `/` to `/onboarding`**

In `app/register/page.tsx`, change line 44:

```typescript
      router.push("/onboarding");
```

(was `router.push("/")`)

- [ ] **Step 2: Commit**

```bash
cd /root/daily-devotional && git add app/register/page.tsx && git commit -m "feat: redirect new users to /onboarding after registration"
```

---

### Task 8: Home Page Persona Check

**Files:**
- Modify: `app/page.tsx:1-30`

- [ ] **Step 1: Add persona redirect to home page**

Add a `useEffect` that checks settings and redirects to `/onboarding` if persona is null. Add after the existing state declarations (after line 24, before `suggestions`):

```typescript
  // Redirect to onboarding if persona not set
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s && s.persona === null) {
          router.push("/onboarding");
        }
      })
      .catch(() => {});
  }, [router]);
```

- [ ] **Step 2: Commit**

```bash
cd /root/daily-devotional && git add app/page.tsx && git commit -m "feat: redirect to /onboarding if persona is null on home page"
```

---

### Task 9: Settings — Your Profile Section

**Files:**
- Modify: `app/settings/page.tsx:8-20, 148-280`

- [ ] **Step 1: Add persona to the Settings interface**

In `app/settings/page.tsx`, add to the local `Settings` interface (after line 19):

```typescript
  persona: {
    faith_stage?: string;
    faith_detail?: string;
    season?: string;
    season_detail?: string;
    tone?: string;
    tone_detail?: string;
    tradition?: string;
    tradition_detail?: string;
  } | null;
```

- [ ] **Step 2: Import ONBOARDING_QUESTIONS**

Add import at the top of the file (after existing imports):

```typescript
import { ONBOARDING_QUESTIONS } from "@/lib/persona";
```

- [ ] **Step 3: Add Your Profile section**

In `SettingsContent`, add the "Your Profile" section after the `<h1>` block (after line 165, before the Bible Translation section). This shows each persona question with the current answer highlighted and lets users change their selection.

```typescript
      {/* Your Profile */}
      <div className={sectionClass}>
        <p className={labelClass}>Your Profile</p>
        <p className="text-xs text-[var(--text-faint)] mb-4">
          These help shape the tone of your devotionals.
        </p>
        {ONBOARDING_QUESTIONS.map((q) => {
          const currentValue = settings.persona?.[q.key as keyof typeof settings.persona] || null;
          return (
            <div key={q.key} className="mb-6">
              <p className="text-xs text-[var(--text-tertiary)] mb-2">{q.prompt}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => save({
                      persona: { ...(settings.persona || {}), [q.key]: opt.value },
                    } as unknown as Partial<Settings>)}
                    className={`py-2 px-4 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer
                      ${currentValue === opt.value
                        ? "bg-[var(--surface-selected)] border border-[var(--surface-selected-border)] text-[var(--text-primary)]"
                        : "bg-[var(--surface)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
                {currentValue && (
                  <button
                    onClick={() => {
                      const updated = { ...(settings.persona || {}) };
                      delete (updated as Record<string, unknown>)[q.key];
                      delete (updated as Record<string, unknown>)[q.detailKey];
                      save({ persona: updated } as unknown as Partial<Settings>);
                    }}
                    className="py-2 px-3 rounded-xl text-xs text-[var(--text-ghost)] hover:text-[var(--text-tertiary)] transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
```

- [ ] **Step 4: Verify types compile**

Run:
```bash
cd /root/daily-devotional && npx tsc --noEmit app/settings/page.tsx 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd /root/daily-devotional && git add app/settings/page.tsx && git commit -m "feat: add Your Profile section to settings for persona editing"
```

---

### Task 10: Manual Smoke Test

**Files:** none (verification only)

- [ ] **Step 1: Start dev server**

Run:
```bash
cd /root/daily-devotional && npm run dev
```

Expected: compiles without errors

- [ ] **Step 2: Test new user flow**

1. Register a new account
2. Verify redirect to `/onboarding`
3. Answer all 4 questions, verify closing screen appears
4. Verify redirect to home page
5. Verify home page loads normally (no redirect loop)

- [ ] **Step 3: Test skip flow**

1. Register another account
2. Skip all 4 questions
3. Verify closing screen still appears
4. Verify home page loads (persona is `{}`, not null)

- [ ] **Step 4: Test settings profile**

1. Go to Settings
2. Verify "Your Profile" section shows
3. Change a persona answer
4. Verify it persists after page reload

- [ ] **Step 5: Test AI integration**

1. Start a new devotional
2. Verify it generates without errors
3. (Persona context is injected silently — no user-visible change, just check generation works)

- [ ] **Step 6: Test existing user redirect**

1. Log in as an existing user (persona is null in DB)
2. Verify home page redirects to `/onboarding`
3. Complete onboarding
4. Verify home page loads normally after

- [ ] **Step 7: Final commit if any fixes were needed**

```bash
cd /root/daily-devotional && git add -A && git commit -m "fix: address smoke test issues in persona onboarding"
```
