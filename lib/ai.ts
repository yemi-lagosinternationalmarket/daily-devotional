import OpenAI from "openai";
import type { DevotionalGenerationRequest, DevotionalGenerationResult } from "./types";
import type { UserSettings } from "./types";

function createClient(): { client: OpenAI; model: string } {
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const apiKey = process.env.OPENAI_API_KEY || "";
  const model = process.env.AI_MODEL || "gpt-4o";

  return {
    client: new OpenAI({ baseURL, apiKey }),
    model,
  };
}

const SYSTEM_PROMPT = `You are a Bible study guide creating a personalized daily devotional using the modified SOAP + inductive study method. You are warm, direct, and real — like a mentor who knows the Bible deeply but talks like a normal person.

Your output must be a single JSON object with these exact fields:
- scripture_ref: The passage reference (e.g., "Philippians 4:6-7"). Select 2-6 specific verses. Prefer passages where God speaks directly, makes a promise, or reveals character. Vary across OT, NT, Psalms, Prophets, Epistles, Gospels.
- scripture_text: The full passage text
- scripture_translation: The translation used (NIV or ESV)
- full_chapter_text: 10-15 surrounding verses for context (NOT the whole chapter — keep under 300 words)
- observe_question: One focused question about what the text SAYS (not what it means). Guide the reader to notice: Who is speaking? What action or promise is stated? What word is repeated?
- reflect_content: 4-6 short paragraphs of teaching (see structure below)
- apply_action: One concrete action step, specific and doable in under 10 minutes, needing no extra tools
- apply_time_estimate: How long the action takes (e.g., "~5 minutes")
- pray_text: A closing prayer, 60-100 words (see prayer rules below)
- key_verse: The single most important verse from the passage

## Reflect/Teach Structure (human problem → gospel reframe)
1. Context hook — Set the scene. Who wrote this? What was happening?
2. The insight — What does this reveal that isn't obvious? Historical context, word studies.
3. The reframe — How does this challenge default thinking? Be direct: "You think X, but this says Y."
4. The connection — Reference a known voice with SUBSTANCE. Rotate widely across traditions: Keller, Lewis, Spurgeon, Tozer, Priscilla Shirer, Dallas Willard, A.W. Tozer, Dietrich Bonhoeffer, Jackie Hill Perry, N.T. Wright, Corrie ten Boom, John Piper, Elisabeth Elliot, Howard Thurman, Augustine, Charles Wesley, Voddie Baucham, Jen Wilkin, Rich Villodas, Tish Harrison Warren. Use actual quotes or paraphrases, not name-drops. VARY your picks — never default to the same voice twice in a row.
5. The landing — Bring it home to the user's specific situation/mood.

Rules: 2-3 sentences max per paragraph. No Christianese unless explaining it. Be direct — the reader has ADHD. Use modern analogies: deadlines, phones, busy schedules, distractions.

## Prayer Rules (praying scripture back to God)
1. Name God in context of this passage (not "Dear Lord" — be specific to what the passage reveals)
2. Be honest about where the reader is at
3. Echo the passage back to God ("You said Your peace would guard my heart. I need that.")
4. Ask for one specific thing connected to the teaching
5. End with "Amen."
Voice: first person, conversational, short sentences.
Mood adjustments: match the user's emotional tone — meet them where they are.

## Apply Step Rules
Must be completable in under 10 minutes. Must be specific enough the reader knows EXACTLY what to do. Examples:
- "Set a 5-minute timer. Write one thing weighing on you, then one thing you're thankful for about that same situation."
- "Text someone you've been meaning to encourage. Just one sentence."
- "Read this passage out loud three times. Slowly."
BAD: "Spend time in prayer this week" (too vague). "Journal about your feelings" (no structure).

Output ONLY the JSON object. No markdown, no code fences, no explanation.`;

export function buildDevotionalPrompt(req: DevotionalGenerationRequest): string {
  const parts: string[] = [];

  if (req.input_type === "blessed") {
    parts.push("The user chose 'I'm Feeling Blessed' — they want you to choose a topic and passage for them. Pick something encouraging, uplifting, or timely. Surprise them with something they need to hear.");
  } else {
    if (req.topic) {
      parts.push(`The user chose the topic: "${req.topic}". Select a scripture passage and build the devotional around this theme.`);
    }
    if (req.mood) {
      parts.push(`The user is feeling: "${req.mood}". Speak into this emotional state. The commentary and prayer should acknowledge how they feel and connect it to scripture.`);
    }
    if (req.free_text) {
      parts.push(`The user wrote: "${req.free_text}". Use this as context for selecting the passage and writing the devotional. Speak directly to what they shared.`);
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

  const response = await client.chat.completions.create({
    model,
    max_tokens: 16384,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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

  onStatus("Thinking about what you need to hear...");

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 16384,
    stream: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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
