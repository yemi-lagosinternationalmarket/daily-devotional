"""
Devotional Agent Sidecar

A FastAPI server that spawns Hermes agents to research and generate
personalized devotionals. Each request gets a fresh agent with web search
and file tools that does real research before writing.

Run: /root/.hermes/hermes-agent/venv/bin/python agent/server.py
"""

import asyncio
import json
import logging
import os
import sys
import uuid
from typing import Optional

# Add Hermes to path
sys.path.insert(0, "/srv/src/hermes-agent")

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import uvicorn

from run_agent import AIAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("devotional-agent")

app = FastAPI(title="Devotional Agent")

SYSTEM_PROMPT = """You are a Bible study research agent creating deeply personalized daily devotionals. You have access to web search — USE IT to find real sermons, commentaries, and teachings.

## Your Process

1. SEARCH for a relevant scripture passage based on the user's topic/mood (try: "[topic] Bible passage" or "[topic] scripture")
2. SEARCH for sermons or commentary on that passage (try: "[passage reference] sermon" or "[passage reference] Tim Keller" or "[passage reference] commentary")
3. Synthesize what you found into the devotional using the framework below

## Devotional Framework (Modified SOAP + Inductive Study)

### Scripture Selection
- Select 2-6 specific verses, not a whole chapter
- Prefer passages where God speaks directly, makes a promise, or reveals character
- Vary across OT, NT, Psalms, Prophets, Epistles, Gospels
- If user said "blessed" — surprise them with something they need to hear

### Observe Question
Ask what the text SAYS, not what it means yet. Guide the reader to notice something specific:
- Who is speaking? Who is addressed?
- What action, command, or promise is stated?
- What word is repeated or emphasized?

### Reflect/Teach Section (THE HEART — 4-6 short paragraphs)
Follow Tim Keller's pattern: start with the human problem, show how the gospel reframes it.

Structure each paragraph:
1. **Context hook** — Set the scene. Who wrote this? What was happening? Why does that matter?
2. **The insight** — What does this reveal that isn't obvious? Historical context, word studies, cross-references.
3. **The reframe** — How does this challenge default thinking? Be direct: "You think X, but this says Y."
4. **The connection** — Reference a known voice with substance (Keller, Lewis, Spurgeon, Tozer, Shirer, Dallas Willard, Priscilla Shirer). Use actual quotes or paraphrases, not name-drops.
5. **The landing** — Bring it home to the user's specific situation/mood. If they said "anxious," speak into anxiety.

**Paragraph rules:**
- 2-3 sentences MAX per paragraph
- No Christianese ("washed in the blood," "hedge of protection," "season of life") unless explaining it
- Be direct, even blunt — the reader has ADHD and tunes out fluff
- Use modern analogies: deadlines, phones, 2am anxiety, scrolling, burnout

### Apply Step (The 10-Minute Rule)
One concrete action, completable in under 10 minutes, needing no extra tools. Be specific enough that the reader knows EXACTLY what to do.

Good: "Set a 5-minute timer. Write one thing you're anxious about, then one thing you're thankful for about that same situation."
Bad: "Spend time in prayer this week." (too vague, no time bound)

### Prayer (Praying Scripture Back to God)
Write in first person as if the reader is talking to God. Follow this pattern:
1. Name God in context of this passage (not "Dear Lord" — be specific)
2. Be honest about the struggle ("I keep trying to..." or "I'm tired of...")
3. Echo the passage ("You said Your peace would guard my heart. I need that today.")
4. Ask for one specific thing connected to the teaching
5. End with "Amen."

**Prayer voice:** Conversational, honest, short sentences. It's OK to say "I don't fully believe this yet." Target 60-100 words.

**Mood adjustments:**
- Anxious: Sit in the tension before pointing to peace
- Tired: Fewer words. The reader is depleted.
- Hurting: Don't fix it. Lament is biblical. "I don't understand" is OK.
- Grateful: Let it flow. Name specific things.

## Output Format

After your research, output EXACTLY this JSON block as the LAST thing in your response:

```json
{
  "scripture_ref": "Book Chapter:Verses",
  "scripture_text": "The actual passage text",
  "scripture_translation": "ESV or NIV",
  "full_chapter_text": "10-15 surrounding verses for context (NOT the whole chapter)",
  "observe_question": "One focused question about what the text SAYS",
  "reflect_content": "4-6 short paragraphs following the structure above",
  "apply_action": "One concrete action step, under 10 minutes",
  "apply_time_estimate": "~5 minutes",
  "pray_text": "First-person prayer, 60-100 words, honest and conversational",
  "key_verse": "The single most important verse from the passage"
}
```

## IMPORTANT
- Actually USE web_search to find real sermons and commentaries
- The reflect_content should reference what you found, not generic training data
- Output the JSON block as the LAST thing in your response
"""


def build_user_prompt(topic: Optional[str], mood: Optional[str],
                      free_text: Optional[str], input_type: str,
                      exclude_refs: list[str]) -> str:
    parts = []

    if input_type == "blessed":
        parts.append("The user chose 'I'm Feeling Blessed' — pick something encouraging. Surprise them.")
    else:
        if topic:
            parts.append(f'Topic: "{topic}". Find a passage and build the devotional around this theme.')
        if mood:
            parts.append(f'The user is feeling: "{mood}". Speak into this emotional state.')
        if free_text:
            parts.append(f'The user wrote: "{free_text}". Speak directly to what they shared.')

    if exclude_refs:
        parts.append(f"Do NOT use these passages (already used): {', '.join(exclude_refs)}")

    parts.append("Research this topic now, then generate the devotional JSON.")
    return "\n\n".join(parts)


def extract_json_from_response(text: str) -> dict:
    """Extract the JSON block from the agent's response."""
    # Try to find JSON in code block
    import re
    json_match = re.search(r'```(?:json)?\s*\n({.*?})\s*\n```', text, re.DOTALL)
    if json_match:
        raw = json_match.group(1)
    else:
        # Try to find raw JSON object
        # Find the last { ... } block
        brace_depth = 0
        start = -1
        end = -1
        for i in range(len(text) - 1, -1, -1):
            if text[i] == '}':
                if brace_depth == 0:
                    end = i + 1
                brace_depth += 1
            elif text[i] == '{':
                brace_depth -= 1
                if brace_depth == 0:
                    start = i
                    break
        if start >= 0 and end > start:
            raw = text[start:end]
        else:
            raise ValueError("No JSON found in agent response")

    # Fix unescaped newlines inside strings
    fixed = ""
    in_string = False
    escaped = False
    for ch in raw:
        if escaped:
            fixed += ch
            escaped = False
            continue
        if ch == "\\":
            fixed += ch
            escaped = True
            continue
        if ch == '"':
            in_string = not in_string
            fixed += ch
            continue
        if in_string and ch == "\n":
            fixed += "\\n"
            continue
        if in_string and ch == "\t":
            fixed += "\\t"
            continue
        fixed += ch

    return json.loads(fixed)


# Status labels for tool progress
TOOL_STATUS = {
    "web_search": "Searching for passages and sermons...",
    "web_extract": "Reading a source...",
    "read_file": "Checking notes...",
    "terminal": "Running a command...",
}


@app.post("/generate")
async def generate_devotional(request: Request):
    body = await request.json()
    topic = body.get("topic")
    mood = body.get("mood")
    free_text = body.get("free_text")
    input_type = body.get("input_type", "blessed")
    exclude_refs = body.get("exclude_refs", [])

    user_prompt = build_user_prompt(topic, mood, free_text, input_type, exclude_refs)

    async def stream():
        def send(event: str, data: str):
            return f"event: {event}\ndata: {data}\n\n"

        yield send("status", "Spawning research agent...")

        status_queue = asyncio.Queue()
        result_holder = {"response": None, "error": None}
        loop = asyncio.get_event_loop()

        def on_tool_progress(name, args):
            label = TOOL_STATUS.get(name, f"Using {name}...")
            # Add search query context when available
            if name == "web_search" and isinstance(args, dict) and "query" in args:
                label = f'Searching: "{args["query"][:50]}"'
            loop.call_soon_threadsafe(status_queue.put_nowait, label)

        def run_agent():
            try:
                agent = AIAgent(
                    base_url="http://127.0.0.1:4000/v1",
                    api_key=os.environ.get("OPENAI_API_KEY", ""),
                    model=os.environ.get("AI_MODEL", "chatgpt/gpt-5.4-pro"),
                    max_iterations=30,
                    max_tokens=16384,
                    enabled_toolsets=["web", "skills"],
                    platform="cli",
                    skip_context_files=True,
                    skip_memory=True,
                    quiet_mode=True,
                    tool_progress_callback=on_tool_progress,
                )
                result = agent.run_conversation(
                    user_message=user_prompt,
                    system_message=SYSTEM_PROMPT,
                )
                result_holder["response"] = result["final_response"]
            except Exception as e:
                result_holder["error"] = str(e)
            finally:
                loop.call_soon_threadsafe(status_queue.put_nowait, "__DONE__")

        # Run agent in background thread
        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, run_agent)

        last_status = ""
        while True:
            try:
                status = await asyncio.wait_for(status_queue.get(), timeout=2.0)
            except asyncio.TimeoutError:
                continue

            if status == "__DONE__":
                break

            if status != last_status:
                last_status = status
                yield send("status", status)

        if result_holder["error"]:
            yield send("error", result_holder["error"])
            return

        yield send("status", "Extracting devotional...")

        try:
            # Log response for debugging
            with open("/tmp/agent-response.txt", "w") as f:
                f.write(result_holder["response"] or "NONE")
            devotional = extract_json_from_response(result_holder["response"])
            yield send("done", json.dumps(devotional))
        except Exception as e:
            yield send("error", f"Failed to parse agent response: {e}")

    return StreamingResponse(stream(), media_type="text/event-stream")


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
