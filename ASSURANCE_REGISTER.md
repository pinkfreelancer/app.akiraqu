# ASSURANCE REGISTER: NexusTrade AI

## 1. Compliance
- [x] GDPR/CCPA Data Export API endpoint (`/api/v1/privacy/export`) verified.
- [x] GDPR/CCPA True Erasure API endpoint (`/api/v1/privacy/erase`) active.
- [x] EU AI Act Art. 50 Disclosure active (AI narrative engine disclosed in UI).

## 2. Security
- [x] Zero plain text secrets in client bundles; Gemini API strictly server-side.
- [x] Zod input validation schemas strictly enforced on all incoming API payloads.
- [x] In-memory rate limiting (100 req/60s) and IP anonymization (SHA-256 hash).
- [x] Idempotency keys enforced to eliminate duplicate analysis requests.

## 3. Operational
- [x] `/api/v1/health` endpoint returning 200 OK with latency & uptime telemetry.
- [x] Structured JSON audit logging active.
- [x] Graceful fallback to deterministic quantitative analysis if API keys are unset.
