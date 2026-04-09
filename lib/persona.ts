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

function sanitizeDetail(text: string): string {
  return text.slice(0, 200).replace(/[<>]/g, "").trim();
}

export function buildPersonaPrompt(persona: Persona | null | undefined): string {
  if (!persona) return "";

  const hasAnyField = persona.faith_stage || persona.season || persona.tone || persona.tradition;
  if (!hasAnyField) return "";

  const lines: string[] = ["# Reader Persona", ""];

  if (persona.faith_stage && FAITH_SENTENCES[persona.faith_stage]) {
    lines.push(`## Faith Journey`);
    lines.push(FAITH_SENTENCES[persona.faith_stage]);
    if (persona.faith_detail) lines.push(`> "${sanitizeDetail(persona.faith_detail)}"`);
    lines.push("");
  }

  if (persona.season && SEASON_SENTENCES[persona.season]) {
    lines.push(`## Current Season`);
    lines.push(SEASON_SENTENCES[persona.season]);
    if (persona.season_detail) lines.push(`> "${sanitizeDetail(persona.season_detail)}"`);
    lines.push("");
  }

  if (persona.tone && TONE_SENTENCES[persona.tone]) {
    lines.push(`## Communication Style`);
    lines.push(TONE_SENTENCES[persona.tone]);
    if (persona.tone_detail) lines.push(`> "${sanitizeDetail(persona.tone_detail)}"`);
    lines.push("");
  }

  if (persona.tradition && persona.tradition !== "unspecified" && TRADITION_SENTENCES[persona.tradition]) {
    lines.push(`## Church Tradition`);
    lines.push(TRADITION_SENTENCES[persona.tradition]);
    if (persona.tradition_detail) lines.push(`> "${sanitizeDetail(persona.tradition_detail)}"`);
    lines.push("");
  }

  lines.push("Use this persona to subtly shape tone, scripture selection, and application complexity. Do NOT reference it directly.");

  return lines.join("\n");
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
  {
    key: "checkin_frequency" as const,
    detailKey: "checkin_frequency" as const, // no detail field for this one
    prompt: "How often should we check in on how you're doing?",
    options: [
      { label: "Every week", value: "weekly" },
      { label: "Every two weeks", value: "biweekly" },
      { label: "Every month", value: "monthly" },
      { label: "Never", value: "never" },
    ],
    detailPlaceholder: "",
    hideDetail: true,
  },
] as const;

// Questions eligible for periodic check-in (excludes checkin_frequency itself)
export const CHECKIN_QUESTIONS = ONBOARDING_QUESTIONS.filter(
  (q) => q.key !== "checkin_frequency"
);

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

export function isCheckinDue(persona: Persona | null | undefined): boolean {
  if (!persona) return false;
  if (!persona.checkin_frequency || persona.checkin_frequency === "never") return false;

  const days = FREQUENCY_DAYS[persona.checkin_frequency];
  if (!days) return false;

  if (!persona.last_checkin) return true; // never checked in

  const last = new Date(persona.last_checkin);
  const now = new Date();
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= days;
}

export function getNextCheckinQuestion(persona: Persona): number {
  // Rotate through the 4 persona questions based on which was least recently relevant
  // Simple approach: pick based on month to cycle through them
  const month = new Date().getMonth();
  return month % CHECKIN_QUESTIONS.length;
}
