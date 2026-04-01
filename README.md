# Daily Devotional

A guided daily Bible study app built for ADHD minds. AI-generated devotionals with worship music, step-by-step scripture study, and zero-shame design.

## Quick Start

```bash
git clone https://github.com/your-name/daily-devotional.git
cd daily-devotional
cp .env.example .env
# Edit .env — set NEXTAUTH_SECRET to any random string
docker compose up -d
# Open http://localhost:3000, register, then go to Settings to add your API key
```

## Configuration

### AI Provider (Required)

After registering, go to **Settings** and configure your AI provider. The app works with any OpenAI-compatible API:

| Provider | Base URL | Model |
|----------|----------|-------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Anthropic (via proxy) | Your proxy URL | `claude-sonnet-4-6` |
| Ollama | `http://host.docker.internal:11434/v1` | `llama3` |
| LiteLLM | `http://host.docker.internal:4000/v1` | Your model |

Each user brings their own API key.

### System-Level Default (Optional)

To set a default AI provider for all users, add to your `.env`:

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o
```

## Development

```bash
docker compose up db -d
npm install
cp .env.example .env.local
npm run dev
```

## Tech Stack

- **Next.js** (App Router)
- **PostgreSQL** (Docker)
- **NextAuth.js** (email/password auth)
- **OpenAI SDK** (compatible with any provider)
- **Tailwind CSS**

## How It Works

1. **Welcome** — Pick a topic, mood, or let God choose
2. **Worship** — Listen to music while the AI prepares your devotional
3. **Read** — Scripture passage with optional full chapter
4. **Observe** — Guided question about the text
5. **Reflect** — AI-generated teaching
6. **Apply** — One concrete action step (under 10 minutes)
7. **Pray** — Personalized prayer
8. **Complete** — "Well done. You showed up today."

## Design Philosophy

- One thing on screen at a time
- Every text box is optional
- No streaks, no guilt
- Completion is sacred

## License

MIT
