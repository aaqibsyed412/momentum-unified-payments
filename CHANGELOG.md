# Changelog

## 2026-09-21 — Initial Momentum demo

### Added

- Responsive Momentum dashboard shell with preview mode and Manus OAuth entry point.
- Simulated UPI-style handles, profile state, mock bank link, simulated KYC badge, PIN/biometric security model, and account-readiness checklist.
- P2P flow with recipient full-name confirmation, amount/note capture, hard $2,500 daily limit, review step, PIN/biometric choice, simulated settlement, and notification/audit fan-out.
- Merchant QR/NFC flow with verified-merchant display, standard $0 fee, optional $0.01 cross-platform demo fee, settlement record, and notification/audit fan-out.
- Bill hub for utility, phone, and auto-insurance demo bills with cost/usage-fit comparisons, 48-hour escalations, AI Controls, and a scheduled monthly-scan endpoint.
- Bill Advisor guardrail engine that defaults to always ask and can only auto-switch inside explicit user thresholds.
- Commute Agent reference set for Chicago, New York, San Francisco, and Washington, DC with guidance-only copy and simulated geolocation labeling.
- Explainability log showing agent, decision, reasoning, and timestamp; notification center showing push, email, inbox, and simulated SMS records.
- Yuna flow with explicit microphone capture, platform storage upload, real built-in Whisper transcription, strict-schema LLM intent parsing, readback, and mandatory payment confirmation.
- Unit tests for hard transfer limits, bill autonomy thresholds, and biometric-to-PIN-equivalent server events.

### Intentional simplifications / cuts

- No real banking, card, merchant, provider, KYC, identity, settlement, investment, insurance, metals, ETF, loan, or transit-ticket integrations.
- No local offline wake-word keyword model was bundled. The experience preserves the privacy boundary by presenting a local-only readiness state and only invoking network-backed audio after an explicit microphone action.
- SMS is persisted as a simulated/logged notification; no SMS provider is wired.
- The scheduled callback is ready for platform scheduler activation after production deployment; this build does not create a recurring external job automatically.
- Services surfaces besides commute guidance are navigation cards with honest “demo surface” messaging rather than provider APIs.
