# ASSURANCE REGISTER: AKIRAQU / NexusTrade AI

## 1. Compliance
- [x] GDPR/CCPA Data Export API endpoint (`/api/v1/privacy/export`) verified.
- [x] GDPR/CCPA True Erasure API endpoint (`/api/v1/privacy/erase`) active.
- [x] EU AI Act Art. 50 Disclosure active (AI narrative engine disclosed in UI).

## 2. Security & Credentials Vault
- [x] Zero plain text secrets in client bundles; Gemini API strictly server-side.
- [x] Zero raw exchange secrets in localStorage: all API secrets sanitized/stripped on client.
- [x] Server-Side AES-256-GCM Encryption: Mandatory authenticated tunnel (`/api/v1/credentials/encrypt`) before saving real credentials.
- [x] Fail-fast production key policy: `getMasterKey()` strictly throws an error in production if `ENCRYPTION_MASTER_KEY` is missing.
- [x] Firestore Security Rules: `/users/{userId}/credentials/{credId}` enforces `doesNotContainRawSecrets()` and validates required encryption keys.
- [x] Firebase JWT authentication enforced on `/api/v1/credentials/*` endpoints (`requireCredentialAuth`).
- [x] Zod input validation schemas strictly enforced on all incoming API payloads.
- [x] Single-instance in-memory rate limiting (100 req/60s) with `X-RateLimit-*` observability headers; distributed Redis-backed store marked as [PLANNED].
- [x] Idempotency keys enforced to eliminate duplicate analysis requests.

## 3. Operational & Test Coverage
- [x] `/api/v1/health` endpoint returning 200 OK with latency & uptime telemetry.
- [x] Structured JSON audit logging active.
- [x] Graceful fallback to deterministic quantitative analysis if API keys are unset.
- [x] Unit Test Suite (Vitest): Verified coverage for `liquidationEngine`, `mmEngine`, `confluenceEngine`, `riskCalculator`, `usePortfolioStore`, and `useOrderBookStore` (27/27 tests passing).
