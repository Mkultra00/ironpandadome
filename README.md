# Seraph 🛡️

**Your Guardian AI — Protecting You From Scams, One Conversation at a Time**

Seraph is a mobile-first web application designed to help people — especially seniors and vulnerable populations — identify and avoid online scams. Powered by an AI assistant named **Pando**, the app provides real-time, conversational guidance through voice and text.

## What It Does

### 🎙️ Talk to Pando (Voice & Text Chat)
Have a hands-free conversation with Pando, your Guardian AI. Ask about suspicious messages, phone calls, or online offers. Pando listens, understands, and responds with clear safety advice — using voice so you don't even need to read the screen.

- **Hands-free voice loop**: Tap the mic, speak, and Pando auto-detects when you're done (2-second silence detection), responds with voice, then listens again — no tapping required.
- **Streaming AI responses**: Answers appear in real-time as they're generated.
- **Streaming TTS**: Pando starts speaking before the full response is even generated, for ultra-low latency replies.
- **Multiple voice options**: Choose the voice that feels most comfortable to you.

### 📧 Email Scanner
Paste a suspicious email and Pando will analyze it for phishing indicators, social engineering tactics, and other red flags. Get a clear safety verdict with an explanation of what to watch out for.

### 📚 Scam Education Library
Browse a curated knowledge base of common scam types, warning signs, and tips for staying safe online. Learn at your own pace with easy-to-understand explanations.

## Tech Stack

### Frontend
- **React 18** — Component-based UI with hooks for state management
- **TypeScript** — Type-safe codebase throughout
- **Tailwind CSS** — Utility-first styling with a custom design system (HSL semantic tokens, custom animations)
- **Vite** — Fast dev server and optimized production builds
- **React Router** — Client-side routing for SPA navigation
- **TanStack React Query** — Server state management and caching
- **Radix UI** — Accessible, unstyled UI primitives (dialogs, tooltips, etc.)

### Backend
- **Supabase Edge Functions (Deno)** — Serverless backend functions deployed via Lovable Cloud
  - `pando-chat` — Streams AI chat completions with Pando's personality prompt
  - `elevenlabs-tts` — Proxies text-to-speech requests to ElevenLabs streaming API
  - `elevenlabs-stt` — Proxies speech-to-text transcription requests to ElevenLabs Scribe
  - `scan-email` — Analyzes emails for scam indicators using AI with structured tool-calling output

### AI & Models
- **Lovable AI Gateway** — Unified API proxy to Google Gemini and OpenAI models
  - **Google Gemini 2.5 Flash** — Primary model for chat and email analysis (fast, low-latency)
  - Vision capabilities for image-based scam analysis
  - Tool-calling for structured JSON verdicts (safety ratings, red flags)

### Voice
- **ElevenLabs Text-to-Speech** — Streaming TTS using `eleven_turbo_v2_5` model for ultra-low latency voice responses via the `/stream` endpoint
- **ElevenLabs Speech-to-Text (Scribe)** — Audio transcription using the `scribe_v2` model
- **Web Audio API (AnalyserNode)** — Client-side silence detection (2-second threshold) for hands-free auto-send
- **MediaSource API** — Browser-side streaming audio playback — Pando starts speaking before the full audio is generated
- Multiple selectable voice profiles

### Hosting & Infrastructure
- **Lovable Cloud** — Managed hosting with automatic edge function deployment
- **Supabase** — Backend-as-a-service (database, auth, edge functions, storage)

## Team

**Iron Pando Dome** is built by the **Iron Panda** team:

- **Forrest Pan**
- **Frank Yu**
- **Ji Thakur**

---

Built with ❤️ to make the internet a safer place.
