# New User Persona Onboarding

**Date:** 2026-04-09
**Status:** Approved

## Overview

A 4-screen conversational flow after registration that builds a lightweight user persona. Data shapes AI tone, scripture selection, and application depth without being explicitly referenced in devotionals. Every question is skippable. Multiple choice with optional free text on each.

## User Flow

Post-registration → persona conversation (4 screens) → warm closing → home page.

A subtle "Skip" link on every screen. Skipping the entire flow is fine — the app works without persona data, just less personalized.

No progress bar or step counter. Feels like a conversation, not a form.

### Screen 1 — Faith Journey

**Prompt:** "Where are you in your walk with God?"

Options:
- Just getting started
- Been at this a while
- Coming back after some time away
- It's complicated

Optional text field: "Anything else you'd like to share?"

### Screen 2 — Current Season

**Prompt:** "What season of life are you in right now?"

Options:
- Growing and grateful
- Walking through something hard
- Feeling distant or stuck
- In transition — lots of change

Optional text field.

### Screen 3 — Communication Style

**Prompt:** "How do you like to be spoken to?"

Options:
- Warm and encouraging
- Honest and direct
- Deep and theological
- Simple and clear

Optional text field.

### Screen 4 — Tradition

**Prompt:** "Do you come from a particular church tradition?"

Fully optional — can skip entirely.

Options:
- Non-denominational / Evangelical
- Catholic
- Mainline Protestant
- Pentecostal / Charismatic
- I'd rather not say

Optional text field.

### Closing Screen

Warm message: "We're glad you're here. Let's get started."

Button redirects to home page (`/`).

## Data Model

Add a `persona` JSONB column to the existing `user_settings` table:

```sql
ALTER TABLE user_settings ADD COLUMN persona JSONB DEFAULT NULL;
```

Schema:

```json
{
  "faith_stage": "returning",
  "faith_detail": "grew up in church, drifted in college",
  "season": "hard",
  "season_detail": null,
  "tone": "warm",
  "tone_detail": null,
  "tradition": "pentecostal",
  "tradition_detail": null
}
```

JSONB keeps it flexible — no migration needed to add/change questions later. Null fields are omitted from AI context.

### Value mappings

| Field | Option Text | Stored Value |
|-------|------------|-------------|
| faith_stage | Just getting started | `new` |
| faith_stage | Been at this a while | `mature` |
| faith_stage | Coming back after some time away | `returning` |
| faith_stage | It's complicated | `complicated` |
| season | Growing and grateful | `growing` |
| season | Walking through something hard | `hard` |
| season | Feeling distant or stuck | `stuck` |
| season | In transition — lots of change | `transition` |
| tone | Warm and encouraging | `warm` |
| tone | Honest and direct | `direct` |
| tone | Deep and theological | `theological` |
| tone | Simple and clear | `simple` |
| tradition | Non-denominational / Evangelical | `evangelical` |
| tradition | Catholic | `catholic` |
| tradition | Mainline Protestant | `mainline` |
| tradition | Pentecostal / Charismatic | `pentecostal` |
| tradition | I'd rather not say | `unspecified` |

## AI Integration

The persona is injected into the existing system prompt in `lib/ai.ts` as a brief natural-language context block. Built dynamically from non-null fields.

Example output for a user who answered all four:

```
The reader is returning to faith after time away. They're walking through
a difficult season. They prefer warm, encouraging language. They come from
a Pentecostal background.
```

Example for a user who only answered faith stage and tone:

```
The reader is just beginning their faith journey. They prefer simple,
clear language.
```

### Sentence templates

| Field | Value | Sentence |
|-------|-------|----------|
| faith_stage | `new` | "The reader is just beginning their faith journey." |
| faith_stage | `mature` | "The reader has been walking with God for a while." |
| faith_stage | `returning` | "The reader is returning to faith after time away." |
| faith_stage | `complicated` | "The reader has a complicated relationship with faith." |
| season | `growing` | "They're in a season of growth and gratitude." |
| season | `hard` | "They're walking through a difficult season." |
| season | `stuck` | "They're feeling distant or stuck in their faith." |
| season | `transition` | "They're in a season of transition and change." |
| tone | `warm` | "They prefer warm, encouraging language." |
| tone | `direct` | "They prefer honest, direct language." |
| tone | `theological` | "They prefer deep, theological language." |
| tone | `simple` | "They prefer simple, clear language." |
| tradition | `evangelical` | "They come from an Evangelical background." |
| tradition | `catholic` | "They come from a Catholic background." |
| tradition | `mainline` | "They come from a Mainline Protestant background." |
| tradition | `pentecostal` | "They come from a Pentecostal/Charismatic background." |
| tradition | `unspecified` | *(omitted from prompt)* |

If a `_detail` field is present, append it: "The reader is returning to faith after time away (grew up in church, drifted in college)."

## Routing

- **`/onboarding`** — New page, 4 conversational screens rendered as client-side steps (no page navigations between questions).
- **Registration redirect:** After successful registration in `/api/register`, redirect to `/onboarding` instead of `/`.
- **First-visit detection:** If `user_settings.persona` is NULL and user hits `/`, redirect to `/onboarding`. This catches users who registered but didn't complete onboarding.
- **Skip all:** Skipping sets `persona` to `{}` (empty object, not null) so the redirect doesn't trigger again.

## Settings Integration

Add a "Your Profile" section to the existing Settings page (`/settings`). Shows current persona answers with ability to re-answer any question or clear responses. Uses the same choice UI as the onboarding screens.

## Files to Create or Modify

### New files
- `app/onboarding/page.tsx` — Onboarding page with conversational step flow
- `components/onboarding-step.tsx` — Reusable question screen component (prompt, options, optional text, skip/next)
- `lib/persona.ts` — Persona sentence builder for AI prompt injection

### Modified files
- `init.sql` — Add `persona JSONB DEFAULT NULL` to `user_settings`
- `lib/ai.ts` — Inject persona context into system prompt
- `lib/types.ts` — Add `Persona` type
- `lib/queries.ts` — Add persona read/write helpers
- `app/api/settings/route.ts` — Support persona field in GET/PUT
- `app/api/register/route.ts` — Redirect to `/onboarding` after registration
- `middleware.ts` — Add `/onboarding` to public routes (accessible while authenticated but pre-persona)
- `app/settings/page.tsx` — Add "Your Profile" section
- `app/page.tsx` — Redirect to `/onboarding` if persona is null

## What This Doesn't Do

- No progress bar or step counter
- No "you must complete this" enforcement
- Persona data never quoted back to the user in devotionals
- No analytics or tracking on answers
- No changes to the devotional step UI or music system
