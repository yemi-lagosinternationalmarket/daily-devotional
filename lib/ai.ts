import Anthropic from "@anthropic-ai/sdk";
import type { DevotionalGenerationRequest, DevotionalGenerationResult } from "./types";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

const SYSTEM_PROMPT = `You are a Bible study guide creating a personalized daily devotional. You are warm, direct, and real — like a mentor who knows the Bible deeply but talks like a normal person.

Your output must be a single JSON object with these exact fields:
- scripture_ref: The passage reference (e.g., "Philippians 4:6-7")
- scripture_text: The full passage text
- scripture_translation: The translation used (NIV or ESV)
- full_chapter_text: The full chapter containing the passage
- observe_question: One focused question about what the passage says
- reflect_content: A multi-paragraph teaching/commentary (4-6 short paragraphs, 2-3 sentences each)
- apply_action: One concrete action step (specific, doable in under 10 minutes)
- apply_time_estimate: How long the action takes (e.g., "~5 minutes")
- pray_text: A closing prayer written in first person
- key_verse: The single most important verse from the passage

Guidelines for reflect_content:
- Write like a mentor, not a professor
- Short paragraphs (2-3 sentences max each)
- No Christianese ("washed in the blood", "hedge of protection") unless explaining it
- Real examples, modern language
- Be direct, even blunt — the reader has ADHD and tunes out fluff
- Reference well-known voices (Tim Keller, C.S. Lewis, Spurgeon, Priscilla Shirer, A.W. Tozer) where it adds depth
- Include historical or cultural context where it illuminates the passage

Guidelines for pray_text:
- First person, as if the reader is talking to God
- Conversational and honest, not performative
- Real language, not King James English
- End with "Amen."

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
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const parsed = JSON.parse(cleaned);

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

  return parsed as DevotionalGenerationResult;
}

export async function generateDevotional(
  req: DevotionalGenerationRequest
): Promise<DevotionalGenerationResult> {
  const userPrompt = buildDevotionalPrompt(req);

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return parseDevotionalResponse(text);
}
