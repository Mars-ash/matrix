# OCR Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

This plan executes the **MATRIX — OCR Consolidation Task List** covering Security (P0), Correctness (P1), Cleanup (P2), and Housekeeping (P3).

---

## Architecture Overview

Active production OCR in MATRIX uses **Google Gemini Vision AI** via Laravel (`OcrService.php`).
All OCR requests must pass through Laravel, require controller authentication, explicit user consent, magic-bytes MIME validation, and rate-limiting.
No fake or simulated data will be fabricated on failure; errors must fail cleanly and loudly.

```text
Next.js (AddDataDialog)
    │
    │ 1. User selects/pastes image
    │ 2. Frontend displays preview & asks explicit user consent
    │ 3. User clicks "Kirim & Ekstrak Gambar"
    ▼
POST /api/ocr/extract or /api/categories/{category}/ocr-upload
    │
    ├─► Middleware: auth.token (Bearer Sanctum token required, 401 if missing)
    ├─► Middleware: role.controller (Strictly restricted to Controller role, 403 if Viewer)
    ├─► Middleware: throttle:ocr (10 requests/minute per user/IP, 429 if exceeded)
    ▼
OcrController
    │
    ├─► Validates: consent = true (422 if missing)
    ├─► Validates: magic-bytes (finfo) in [image/jpeg, image/png, image/webp], max 15MB (422 if invalid)
    ▼
OcrService (Gemini Vision AI)
    │
    ├─► Uses GEMINI_API_KEY (with optional GEMINI_API_KEYS rotation)
    ├─► On error: fails cleanly with error message (NO fabricated offline mock BOM data)
    ▼
Response: { success: false, items: [], message: "..." } or { success: true, items: [...] }
```

---

## User Review Checkpoint: Fallback Behavior Decision

> [!IMPORTANT]
> **Behavior of `fallbackParse`:**
> In a precision manufacturing system, returning fictitious parts (e.g. "Upper Die Plate, S50C") when an API key is missing or network times out risks corrupting real Job Orders.
> **Decision:** `fallbackParse` is removed from the production path. When OCR fails (timeout, missing key, quota exceeded, invalid image), the API returns `success: false`, `items: []`, and an explanatory error message. The frontend displays the error notice and prompts the user to switch to "Manual Entry" (`mode: "manual"`).

---

## Proposed Changes

### P0 — Security & P1 — Correctness (Backend)

#### 1. Rate Limiting (`backend/app/Providers/AppServiceProvider.php`)
- Define `RateLimiter::for('ocr', ...)` allowing 10 requests per minute by user ID or IP.

#### 2. Routes (`backend/routes/api.php`)
- Move `POST /ocr/extract` inside `Route::middleware(['auth.token', 'role.controller', 'throttle:ocr'])`.
- Protect `POST /categories/{category}/ocr-upload` and alias `POST /ocr/{category}/upload` with `throttle:ocr`.

#### 3. Controller & Request Validation (`backend/app/Http/Controllers/Api/OcrController.php`)
- Add validation rule `'consent' => ['required', 'boolean', 'accepted']`.
- Add file size limit: max 15MB (`15360` KB).
- Validate magic bytes using PHP `finfo` against `['image/jpeg', 'image/png', 'image/webp']`.
- Throw HTTP 422 if mime or consent is invalid.

#### 4. Service Hardening (`backend/app/Services/OcrService.php`)
- Remove simulated fake data generation in `fallbackParse`.
- Fail cleanly on missing API keys, timeout, or errors (`success: false`, empty items, descriptive message).
- Collapse key handling: primary `GEMINI_API_KEY`, optional comma-separated `GEMINI_API_KEYS` for rotation.

#### 5. Config (`backend/config/ocr.php` & `backend/.env.example`)
- Clean up legacy `GEMINI_API_KEY_BACKUP_1` and `GEMINI_API_KEY_BACKUP_2`.
- Document `GEMINI_API_KEY` (primary) and optional `GEMINI_API_KEYS` (rotation).

---

### P0 — Security & P1 — Correctness (Frontend)

#### 6. API Client (`frontend/lib/api-client.ts`)
- Update `uploadOcrImage` to accept `consent: boolean = true` and append `'consent': '1'` to `FormData`.

#### 7. Dialog UI & Explicit Consent (`frontend/components/add-data-dialog.tsx`)
- When user pastes or drops an image:
  - Do NOT immediately upload.
  - Show a staged preview state: image thumbnail, file name, file size.
  - Show explicit consent checkbox / information banner: *"Gambar ini akan dikirim ke server untuk diekstrak oleh OCR Vision AI."*
  - Require user to click *"Kirim & Ekstrak Gambar"*.
- When extraction fails or items are empty:
  - Do NOT inject `FALLBACK_EXTRACTION` rows.
  - Display error notice and provide button to switch to Manual Entry.

---

### P2 — Cleanup (Documentation)

#### 8. Documentation Updates
- `ocr-lab/README.md`: Add prominent warning that `ocr-lab` is retained-but-inactive research archive.
- `AGENTS/AGENTS.md`: Update stack and architecture to state Gemini Vision AI is the sole production OCR engine, removing OCR Lab from active pipeline.
- `docs/TASK_LIST.md`: Update Fase 5 notes.
- `docs/IMPLEMENTATION_PLAN.md`: Keep Gemini as sole path and document security gates.

---

### Verification Plan

1. **Automated Backend Security Tests (`backend/tests/Feature/OcrSecurityTest.php`)**:
   - `POST /api/ocr/extract` without token -> 401 Unauthorized.
   - `POST /api/categories/{cat}/ocr-upload` without token -> 401 Unauthorized.
   - `POST /api/ocr/{cat}/upload` without token -> 401 Unauthorized.
   - Authenticated as Viewer -> 403 Forbidden.
   - Authenticated as Controller without consent -> 422 Unprocessable Entity (`consent` required).
   - Authenticated as Controller with non-image file (e.g. text/html with jpg extension) -> 422 Unprocessable Entity (magic bytes rejected).
   - Authenticated as Controller with valid image and consent -> 200 OK.
   - Triggering >10 requests -> 429 Too Many Requests.
2. **Frontend Unit & Component Tests**:
   - Run `npm test` and `npm run typecheck`.
3. **End-to-End Verification**:
   - Verify file upload staged consent UI in `AddDataDialog`.
