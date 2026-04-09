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
