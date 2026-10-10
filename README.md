# Momentum — AI-Native Unified Payments Platform

> **Live Production Demo:** [https://momentum-wise-pay.lovable.app](https://momentum-wise-pay.lovable.app)  
> *A unified instant payment infrastructure for the United States (UPI-inspired), featuring the "Hey Yuna" voice assistant and automated financial guardrails.*

Momentum is a portfolio-grade full-stack demo of a unified U.S. payments control room. It combines simulated person-to-person handle payments, contactless QR/merchant checkouts, autonomous bill-plan optimization, commute transit guidance, an explainability audit log, and an in-browser voice assistant named **Yuna**.

> **Demo Boundary:** Momentum is not a licensed financial institution. It does not move real money, connect to real banks, perform real KYC, switch real utility providers, or purchase live transit tickets. All financial rails and mock balances are safely simulated and isolated.

---

## 🧠 Multi-Agent AI Orchestration & Architecture

This project was engineered through an advanced multi-agent workflow, coordinating specialized frontier models across design, autonomous code generation, and production edge engineering:

```text
[ Product Strategy & Reasoning ] ---> [ 0-to-1 Scaffolding ] ---> [ Production Edge Engineering ]
         Claude 3.5 Sonnet                     Manus AI                          Lovable
 (System Specs, Schemas, Prompts)       (Full-Stack Rapid Proto)         (DSP Voice, TanStack, Deploy)


1. Claude (Anthropic) — System Architecture & Reasoning Partner




Domain Modeling & Spec Engineering: Formulated the product vision and domain logic for a US-adapted unified payment protocol (inspired by NPCI's UPI), architecting handle-based peer-to-peer resolution, contactless QR merchant schemes, and bill optimization guardrails.


Deterministic Guardrail Specification: Designed the core security invariants for autonomous financial actions, mandating a strict Human-In-The-Loop (HITL) biometric/PIN gate before any ledger mutation.


Conversational AI Prompt & Schema Design: Authored the structured intent extraction schema (Zod/JSON Schema) and prompt guidelines to resolve colloquial payment phrasing (e.g., "twelve fifty" → 1250 cents, note isolation, entity resolution against local contact lists).




2. Manus AI — Autonomous Scaffolding & Rapid Prototyping Agent




Zero-to-One Full-Stack Scaffolding: Executed the initial autonomous implementation from Claude’s architectural blueprints, generating the baseline dashboard layout, navigation flow, and early schema definitions.


Rapid Component Assembly: Bootstrapped the initial frontend view hierarchy (DashboardLayout, Home, payment action panels, commute transit view) and configured early tRPC API schemas, drastically accelerating time-to-first-interactive-demo.




3. Lovable — Edge Production Engineering, DSP Voice Pipeline & Runtime Migration




Decoupling & Migration to Edge Architecture: De-coupled the prototype from proprietary Manus/Node runtimes and vendor-locked auth dependencies; re-architected the application onto TanStack Start v1 (React 19 SSR on Edge Workers) with a zero-auth, browser-persisted mock ledger shim.


In-Browser Audio DSP Pipeline: Engineered a client-side audio capture system using AudioContext and custom ScriptProcessorNode to record clean mono WAV audio with real-time decibel metering, automatic speech-boundary detection (auto-stop on silence), and client-side base64 encoding.


Two-Stage Multi-Modal AI Engine:



Streaming Speech-to-Text (STT): Implemented server-side streaming speech transcription via openai/gpt-transcribe through the Lovable AI Gateway, dynamically injecting the user's contact book as lexical context keywords to minimize phonetic hallucinations on proper names.


Constrained JSON-Schema Intent Extraction: Routed normalized transcripts into openai/gpt-6-astra under rigid json_schema response formats (send_money, pay_merchant, check_balance), ensuring deterministic payloads and eliminating unstructured LLM drift.






Readback Synthesis & Verification UI: Integrated native speech synthesis for vocal confirmation with an interactive confirmation card, fallback manual input modes, and vitest route regression suites.






🎯 Autonomous Agent Systems Inside the App


1. Hey Yuna — Voice Payment Agent



Yuna captures audio directly in the browser via a customized Web Audio DSP pipeline. The recording is converted into clean mono WAV audio, transcribed via streaming STT, and parsed with deterministic JSON schemas.





Conversational Normalization: Understands spoken currency (e.g. "ten dollars and thirty cents" or "ten thirty"), extracts payee names, and decouples payment memos.


Safety Invariant (HITL): Yuna never moves money autonomously. She formats a structured confirmation card requiring explicit 4-digit PIN or biometric verification before any balance mutation occurs.




2. Bill Advisor — Autonomous Plan Optimization



Compares seeded household utility and service bills against market rates using usage patterns and the user's AI Controls.





If Auto-Switching is enabled and savings exceed configured thresholds, the system applies the optimization and writes a deterministic explainability audit record.


If thresholds are exceeded or confirmation is required, it queues a 48-hour escalation with notifications fanned out across push, email, and in-app feeds.




3. Commute Agent — Contextual Transit Passes



Recognizes regional transit networks (Chicago CTA, New York OMNY, SF Clipper, DC SmarTrip) based on selected location. It provides route guidance and integrates tap-and-go contactless card passes into the unified payment stream.





⚖️ What Is Real vs. Simulated


Capability	Status	Implementation Details
Voice Speech-to-Text	Real API	In-browser Web Audio DSP recording streamed to openai/gpt-transcribe.
Yuna Intent Extraction	Real API	openai/gpt-6-astra with rigid JSON-Schema structured responses.
Speech Readback	Real API	Web Speech API text-to-speech synthesis with mute toggles.
Edge Server Logic	Real Edge	TanStack Start createServerFn executing on Cloudflare Edge runtimes.
P2P Ledger & Settlement	Simulated	Client-side reactive persistent store (localStorage); $2,500 daily limit enforced.
Merchant QR / NFC	Simulated	Real-time QR code generation, camera simulation, and instant receipt generation.
PIN & Biometric Auth	Simulated Security	Interactive 4-digit PIN and WebAuthn-style biometric verification gates.
Bill Market Data	Simulated	Heuristic rule-based comparison engine with audit log explainability.
Transit Passes	Simulated Guidance	Contextual pass recommendations; taps into virtual card rails.




🛠️ Tech Stack




Framework: TanStack Start v1 (Full-Stack React 19 SSR on Edge Workers)


Build Engine: Vite 7


Styling: Tailwind CSS v4, Radix UI Primitives, Lucide Icons


AI & Multi-Modal Engine: Lovable AI Gateway (openai/gpt-transcribe for STT, openai/gpt-6-astra for JSON-Schema Intent Extraction)


Audio Engineering: HTML5 Web Audio API (AudioContext, ScriptProcessorNode, PCM-to-WAV encoder)


State Management: Custom reactive local-storage ledger with tRPC-shaped query/mutation shims


Testing: Vitest






💻 Local Development


# Clone the repository
git clone https://github.com/aaqibsyed412/momentum-unified-payments.git
cd momentum-unified-payments

# Install dependencies
npm install

# Start development server
npm run dev




Open http://localhost:8080 to view the application.





📄 License & Attribution



Designed and engineered by Syed Rafiuddin Aaqib. Built as a demonstration of multi-agent software engineering using Claude 3.5 Sonnet, Manus AI, and Lovable.
