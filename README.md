# Momentum — Unified Payments Platform Demo

Momentum is a portfolio-grade full-stack demo of a unified U.S. payments control room. It combines simulated person-to-person payments, simulated merchant QR/contactless flows, bill-plan intelligence, commute guidance, an explainability log, and a voice assistant named Yuna.

> **Demo boundary:** Momentum is not a licensed financial product. It does not move real money, connect to real banks, perform real KYC/identity verification, switch real providers, buy tickets, or provide investing, insurance marketplace, precious-metals, or lending functionality. Simulated systems are labeled in the UI and in server comments.

## Live demo

The current WebDev deployment is available at:

**https://3000-il5kydoenweugyeuk1w0e-fb9562fe.us1.manus.computer**

The URL is a live demo environment for this project. Use **Preview the demo** to explore the experience without signing in. Sign in with Manus to exercise the authenticated database-backed procedures. The app automatically seeds a clearly simulated profile, contacts, bills, market plans, transactions, and audit entries for a newly seen user.

## Architecture

Momentum uses the WebDev `web-db-user` scaffold: React 19, Vite, Tailwind CSS, Express, tRPC, Drizzle ORM, MySQL/TiDB, S3-compatible storage, and Manus OAuth. The client uses a responsive dashboard shell with a persistent sidebar on desktop and a compact header on mobile. Server operations are typed tRPC procedures under `server/routers.ts` and database helpers under `server/db.ts`.

The shared data layer includes users, profiles, contacts, transactions, bills, bill plans, AI controls, escalations, notifications, and audit logs. All timestamps are stored server-side and displayed in the viewer’s local timezone. The P2P daily limit is a hard $2,500 demo rule. PIN confirmation is required by the payment procedures, while biometric confirmation records a server-side PIN-equivalent event.

The monthly bill scan is implemented as an HTTP callback at `/api/scheduled/monthly-scan`. It is intentionally not an in-process timer; the production platform can call the endpoint through its scheduled-job system after deployment. The endpoint authenticates the scheduled caller and runs the deterministic guardrail engine for each seeded profile.

## Three-agent design

### Yuna — voice assistant

Yuna supports microphone-tap capture in the UI. Audio is uploaded to platform storage, transcribed through the built-in Whisper-compatible speech-to-text helper, then parsed through the built-in LLM helper into a strict JSON intent. A full contact name must be present; the UI performs a spoken/visual-style readback and requires an explicit confirmation before calling the same P2P transfer procedure used by manual payments. No voice shortcut bypasses PIN or biometric authentication.

The UI includes a privacy-first trigger state. The explicit microphone capture path is real and network-backed only after user action. A production-grade offline wake-word model was not bundled because the scaffold does not include a local keyword model; see the changelog for this honest limitation.

### Bill Advisor

Bill Advisor compares seeded bill records with seeded market-plan records using monthly cost, usage-pattern fit, and the user’s AI Controls. Default/first-run behavior is always ask. If auto-switching is enabled and a recommendation is inside both thresholds, the demo updates the simulated plan and writes an explainability record. Otherwise it creates a 48-hour escalation and writes a reasoned audit event. Every decision fans out to push, email, in-app inbox, and a clearly simulated/logged SMS channel.

### Commute Agent

Commute Agent uses a simulated city selector in place of real geolocation. It recognizes Chicago/CTA, New York/OMNY, San Francisco/Clipper, and Washington, DC/SmarTrip from a small reference set. It provides guidance only: the user is told to tap the same existing contactless Momentum card. It does not create a transit ticket purchase flow or a separate payment rail.

## What is real vs. simulated

| Capability | Status | Notes |
| --- | --- | --- |
| Manus OAuth session | Real | Uses the scaffold’s OAuth/session flow. |
| Database persistence | Real | MySQL/TiDB via Drizzle. New users receive seeded demo rows. |
| Voice speech-to-text | Real API-backed | Uses the built-in transcription helper after explicit microphone capture. |
| Yuna intent parsing | Real API-backed | Uses the built-in LLM helper with strict JSON schema output. |
| P2P settlement | Simulated | Writes a demo ledger row; does not move money. |
| Merchant QR/NFC payment | Simulated | QR/NFC surfaces and receipts are UI/demo records only. |
| Bank account linking | Simulated | “Demo Community Bank” is mock data. |
| KYC / ID / SSN | Simulated | Profile status is explicitly labeled simulated. |
| PIN and biometric | Demo security model | PIN/biometric steps are represented; server records the required auth event. |
| Bill market data | Simulated | Seeded plans and usage fit values, no providers contacted. |
| Agentic switching | Simulated | Database-only plan update inside explicit guardrails. |
| Push/email/SMS fan-out | Simulated/logged | Notifications are persisted; SMS is labeled simulated. |
| City/geolocation | Simulated | City is user-selected from a reference set. |
| Transit payment | Guidance only | Reuses the conceptual contactless payment capability; no transit ticketing. |
| Investing, insurance marketplace, gold/silver/ETFs, loans | Stubbed | Navigation is intentionally not built as working financial functionality. |

## Local setup

1. Install Node.js 22 and pnpm.
2. Install dependencies with `pnpm install`.
3. Set the platform environment variables used by the WebDev scaffold, including `DATABASE_URL`, `JWT_SECRET`, OAuth variables, and the built-in Forge variables. Do not commit `.env` files.
4. Generate/apply schema changes with `pnpm drizzle-kit generate` and the project’s database migration flow.
5. Run the app with `pnpm dev`.
6. Run `pnpm test`, `pnpm check`, and `pnpm build` before publishing.

Useful commands:

```bash
pnpm dev
pnpm test
pnpm check
pnpm build
```

## Repository map

- `client/src/pages/Home.tsx` — overview, payments, bills, services, activity, controls, and Yuna UI.
- `client/src/components/DashboardLayout.tsx` — responsive dashboard shell and preview entry point.
- `server/routers.ts` — typed tRPC API contracts.
- `server/db.ts` — seed, ledger, bill-agent, notification, audit, and commute helpers.
- `server/_core/index.ts` — Express bootstrap and scheduled callback.
- `drizzle/schema.ts` — database schema.
- `shared/demoRules.ts` — tested hard-limit, guardrail, and auth-event rules.
- `server/platform.rules.test.ts` — critical rule tests.

## Known limitations and scope cuts

This is a portfolio demo, not a production financial system. Real banking, settlement, identity verification, KYC, card tokenization, NFC hardware integration, merchant acquiring, biller/provider APIs, transit ticketing, investments, insurance marketplace, precious metals, ETFs, loans, and real notification providers are intentionally out of scope. The wake-word design is represented with a local privacy state and explicit microphone capture; a full offline keyword model was not shipped. The scheduled callback is implemented and ready for a production deployment’s scheduler, but activating a recurring platform job requires the deployed project URL and platform scheduler lifecycle.

There is no native mobile application, no real external account linking, and no real payment-card provisioning. Those boundaries are deliberate and keep the app honest with the project brief.
