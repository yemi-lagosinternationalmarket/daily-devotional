import OpenAI from "openai";
import type { DevotionalGenerationRequest, DevotionalGenerationResult } from "./types";
import type { UserSettings } from "./types";
import { buildPersonaPrompt } from "./persona";

function createClient(): { client: OpenAI; model: string } {
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = process.env.AI_MODEL || "gpt-4o";

  return {
    client: new OpenAI({ baseURL, apiKey }),
    model,
  };
}

const SYSTEM_PROMPT = `You are a warm, direct Bible study mentor. Output a single JSON object with these fields:

- scripture_ref: passage reference (2-6 verses). Vary across OT, NT, Psalms, Prophets, Epistles, Gospels.
- scripture_text: full passage text
- scripture_translation: translation used (NIV or ESV)
- full_chapter_text: 10-15 surrounding verses for context (under 300 words)
- observe_question: one question about what the text SAYS — who speaks, what's promised, what word repeats
- reflect_content: 4-6 short paragraphs. Structure: (1) context/scene, (2) non-obvious insight with word studies, (3) reframe default thinking, (4) quote from a theologian — rotate widely: Keller, Lewis, Spurgeon, Bonhoeffer, Jackie Hill Perry, N.T. Wright, Corrie ten Boom, Elisabeth Elliot, Howard Thurman, Jen Wilkin, Dallas Willard, etc. Use real quotes. (5) land it for the user's situation. Keep paragraphs to 2-3 sentences. Be direct. Use modern analogies.
- apply_action: one concrete step, doable in under 10 minutes, specific enough to act on immediately
- apply_time_estimate: e.g. "~5 minutes"
- pray_text: 60-100 word prayer. Name God specifically for this passage. Be honest. Echo scripture back. End with "Amen."
- key_verse: single most important verse

Output ONLY valid JSON. No markdown, no code fences, no explanation.`;

function sanitizeInput(text: string, maxLen: number = 500): string {
  return text.slice(0, maxLen).replace(/[<>＜＞«»‹›〈〉⟨⟩]/g, "").trim();
}

export function buildDevotionalPrompt(req: DevotionalGenerationRequest): string {
  const parts: string[] = [];

  if (req.input_type === "blessed") {
    parts.push("The user chose 'I'm Feeling Blessed' — they want you to choose a topic and passage for them. Pick something encouraging, uplifting, or timely. Surprise them with something they need to hear.");
  } else {
    if (req.topic) {
      parts.push(`The user chose the topic: "${sanitizeInput(req.topic, 200)}". Select a scripture passage and build the devotional around this theme.`);
    }
    if (req.mood) {
      parts.push(`The user is feeling: "${sanitizeInput(req.mood, 200)}". Speak into this emotional state. The commentary and prayer should acknowledge how they feel and connect it to scripture.`);
    }
    if (req.free_text) {
      parts.push(`The user wrote: "${sanitizeInput(req.free_text, 500)}". Use this as context for selecting the passage and writing the devotional. Speak directly to what they shared.`);
    }
  }

  if (req.exclude_refs.length > 0) {
    parts.push(`Do NOT use these passages (already used recently): ${req.exclude_refs.join(", ")}. Pick a completely different passage.`);
  }

  parts.push("Generate the devotional now as a JSON object.");

  return parts.join("\n\n");
}

export function parseDevotionalResponse(text: string): DevotionalGenerationResult {
  // Strip all LiteLLM model prefixes like [gpt-5.4] anywhere in text
  let cleaned = text
    .replace(/\[gpt-[^\]]*\]\n?/g, "")
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Find the JSON object — locate the first { and its matching }
  let braceDepth = 0;
  let start = -1;
  let end = -1;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{") {
      if (braceDepth === 0) start = i;
      braceDepth++;
    } else if (cleaned[i] === "}") {
      braceDepth--;
      if (braceDepth === 0 && start >= 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (start < 0 || end < 0) {
    throw new Error(`No JSON object found in response (length=${cleaned.length})`);
  }

  let jsonStr = cleaned.slice(start, end);

  // Fix unescaped newlines/tabs inside JSON string values
  let fixed = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i];
    if (escaped) {
      fixed += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      fixed += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      fixed += ch;
      continue;
    }
    if (inString && ch === "\n") {
      fixed += "\\n";
      continue;
    }
    if (inString && ch === "\t") {
      fixed += "\\t";
      continue;
    }
    fixed += ch;
  }

  const parsed = JSON.parse(fixed);

  const required = [
    "scripture_ref", "scripture_text", "scripture_translation",
    "full_chapter_text", "observe_question", "reflect_content",
    "apply_action", "apply_time_estimate", "pray_text", "key_verse",
  ];

  for (const field of required) {
    if (!parsed[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Normalize array fields to strings (LLM sometimes returns paragraphs as arrays)
  for (const field of ["reflect_content", "scripture_text", "full_chapter_text", "pray_text"]) {
    if (Array.isArray(parsed[field])) {
      parsed[field] = parsed[field].join("\n\n");
    }
  }

  return parsed as DevotionalGenerationResult;
}

export async function generateDevotional(
  req: DevotionalGenerationRequest,
  settings: UserSettings | null,
): Promise<DevotionalGenerationResult> {
  const userPrompt = buildDevotionalPrompt(req);
  const { client, model } = createClient();

  const personaContext = buildPersonaPrompt(settings?.persona);
  const systemContent = personaContext
    ? `${SYSTEM_PROMPT}\n\n${personaContext}`
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

  const text = response.choices[0]?.message?.content || "";
  return parseDevotionalResponse(text);
}

// Field keys in the order Claude typically writes them
const FIELD_LABELS: Record<string, string> = {
  scripture_ref: "Selecting a passage",
  scripture_text: "Reading the scripture",
  scripture_translation: "Reading the scripture",
  full_chapter_text: "Pulling the full chapter",
  observe_question: "Crafting a question for you",
  reflect_content: "Writing the teaching",
  apply_action: "Finding a step you can take today",
  apply_time_estimate: "Finding a step you can take today",
  pray_text: "Writing a prayer",
  key_verse: "Choosing your key verse",
};

export async function generateDevotionalStreaming(
  req: DevotionalGenerationRequest,
  settings: UserSettings | null,
  onStatus: (status: string) => void,
): Promise<DevotionalGenerationResult> {
  const userPrompt = buildDevotionalPrompt(req);
  const { client, model } = createClient();

  const personaContext = buildPersonaPrompt(settings?.persona);
  const systemContent = personaContext
    ? `${SYSTEM_PROMPT}\n\n${personaContext}`
    : SYSTEM_PROMPT;

  onStatus("Thinking about what you need to hear...");

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 16384,
    stream: true,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userPrompt },
    ],
  });

  let fullText = "";
  const seenKeys = new Set<string>();

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || "";
    fullText += delta;

    for (const key of Object.keys(FIELD_LABELS)) {
      if (!seenKeys.has(key) && fullText.includes(`"${key}"`)) {
        seenKeys.add(key);
        onStatus(FIELD_LABELS[key]);
      }
    }
  }

  onStatus("Saving your devotional...");
  return parseDevotionalResponse(fullText);
}
