# Project Controlling — Interactive Prototype Task List

> **Purpose:** Self-contained checklist for building the prototype across chat sessions.
> **Last updated:** 2026-08-13
> **Status:** ✅ Complete — all tasks done, prototype running at `npm run dev` on port 3000.

---

## Quick Context

| Item | Detail |
|---|---|
| Goal | High-fidelity clickable prototype for management demo — no backend, no database. |
| Stack | Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · Vitest |
| Location | `frontend/` |
| Mode | Staff Engineering only · English UI · In-memory mock data |
| Main demo JO | `126.110` (derived from workbook `126.115` — never show `126.115` as a JO number) |
| Design spec | [`2026-08-13-project-controlling-prototype-design.md`](./specs/2026-08-13-project-controlling-prototype-design.md) |
| Implementation plan | [`2026-08-13-project-controlling-interactive-prototype.md`](./plans/2026-08-13-project-controlling-interactive-prototype.md) |
| MVP backend plan | [`2026-08-13-project-controlling-mvp-implementation.md`](./plans/2026-08-13-project-controlling-mvp-implementation.md) |
| Brainstorm / conversation log | [`conv.md`](./conv.md) |

---

## Key Domain Rules

### Structure

```text
Project → many JO → 1 JO = 1 product + 1 die
  JO → many categories (Part / Component / Custom)
    Category → many items
      Item → process controls (status per process)
```

### JO Types (single-select)

`PROGRESSIVE` · `TANDEM` · `JIG` · `WIRECUT SERVICE` · `MACHINING SERVICE`

### Categories (multi-select, may be empty on save)

**Part:** `PART` · `PART JIG` · `PART DIES` · `PART DIES OP 10–50` (kelipatan 10)
**Component:** `COMPONENT` · `COMPONENT JIG` · `COMPONENT DIES` · `COMPONENT DIES OP 10–50`
**Custom:** requires name + kind (`Part` or `Component`)

### Processes

- Part categories: `Material` · `Arrival` · `Machining` · `Hardening` · `Grinding` · `Wirecut` · `Assembly` (7)
- Component categories: `PO` · `Arrival` (2)

### Statuses & Progress Weights

| Status | Weight | Color |
|---|---:|---|
| `Done` | 1.0 | Green |
| `In Progress` | 0.5 | Amber |
| `Not Started` | 0.0 | Blue |
| `Problem` | 0.0 | Red — **notes required** |
| `-` | excluded | Gray |

```
JO progress = sum(applicable weights) / count(status ≠ '-') × 100%
All '-' → display '-'
```

### Problem Flow

- Selecting `Problem` opens a notes dialog.
- Empty notes → inline error, cannot confirm.
- Cancel → revert to previous status.
- Confirmed → commit status + notes, recalculate progress, add activity history.

### Add Data

```text
Add Data
├── Manual Entry      → form for one item, default '-' controls
└── Image Conversion  → simulated (labelled as future feature)
       Select image (simulated) → Extracted table preview → Edit → Confirm
```

---

## Task Checklist

### Task 1 — Frontend Scaffold ✅

- [x] Create `frontend/` with Next.js App Router + TypeScript + Tailwind CSS v4
- [x] Install dependencies: `next`, `react`, `react-dom`, `tailwindcss`, `vitest`, `@testing-library/react`, `jsdom`
- [x] Add `vitest.config.ts` with jsdom environment and path aliases
- [x] Add `"test"` and `"typecheck"` scripts to `package.json`
- [x] Implement root page placeholder (replace Next.js starter content)
- [x] Run: `npm run test` · `npm run typecheck` · `npm run build` — all pass

### Task 2 — Typed Domain & Pure Calculations ✅

- [x] Create `frontend/lib/types.ts` — status, JO type, category, process, and domain interfaces
- [x] Write unit tests for progress calculation (all 5 statuses + all-`-` edge case)
- [x] Implement `frontend/lib/progress.ts` — pure progress, Problem-count, status-summary functions
- [x] Add mixed Part/Component and `Problem` test cases
- [x] Create `frontend/lib/category.ts` — category→process mapping and custom-category helpers
- [x] Create `frontend/lib/format.ts` — date, percentage, and label formatting
- [x] Build `frontend/lib/mock-data.ts` — Project `Mercedes Tooling Program`, JOs `126.110`–`126.114`
- [x] Verify `126.115` does not appear as a JO number anywhere
- [x] Run: `npm run test` · `npm run typecheck` — all pass (25 tests)

### Task 3 — In-Memory Store & Actions ✅

- [x] Write reducer/store tests: create JO, add category, add item, update status, Problem notes, activity history
- [x] Implement `frontend/lib/store.tsx` — React context + reducer, browser-session-only state
- [x] Actions: create JO (with empty categories), reject Problem without notes, manual item add, simulated batch add
- [x] Activity records: immutable, reverse-chronological
- [x] Run: `npm run test` · `npm run typecheck` — all pass

### Task 4 — Design System & Common UI Components ✅

- [x] Define visual tokens in `frontend/app/globals.css` (dark industrial theme, status colors, typography, focus, responsive)
- [x] Implement `frontend/components/app-shell.tsx` — sidebar/topbar, breadcrumbs, `Staff Engineering · Demo Mode` label
- [x] Implement `frontend/components/progress-bar.tsx` — accessible, supports `-` state
- [x] Implement `frontend/components/status-badge.tsx` — text + semantic color
- [x] Implement `frontend/components/dialog.tsx` — reusable accessible dialog (Escape + click-outside)
- [x] Implement `frontend/components/empty-state.tsx`
- [x] Run: `npm run test` · `npm run typecheck` · `npm run build` — all pass

### Task 5 — Dashboard & Project Navigation ✅

- [x] Implement Dashboard page (`frontend/app/page.tsx`) — Project card, JO overview KPIs, active-Problem exception panel
- [x] Implement `frontend/components/jo-card.tsx` — type badge, progress, Problem count, last activity
- [x] Add breadcrumbs and navigation links to JO Detail
- [x] Add `frontend/app/not-found.tsx`
- [x] Run: `npm run test` · `npm run typecheck` · `npm run build` — all pass

### Task 6 — Create JO & Category Selection ✅

- [x] Implement `frontend/components/jo-create-dialog.tsx` — JO number, product name, single-select type, multi-select categories
- [x] Implement `CUSTOM` category sub-form (name + Part/Component kind)
- [x] Client-side validation: required type, custom name not empty
- [x] Connect to store: new JO appears immediately
- [x] Browser-verified: Create JO 126.200 with TANDEM type, PART DIES OP 20, COMPONENT, and CUSTOM "SPECIAL INSERT" categories

### Task 7 — JO Detail, Category Sections & Interactive Status ✅

- [x] Implement JO Detail route (`frontend/app/projects/[projectId]/jos/[joId]/page.tsx`)
- [x] Implement `frontend/components/control-table.tsx` — Part (7 columns) / Component (2 columns)
- [x] Implement `frontend/components/status-select.tsx` — dropdown with 5 statuses
- [x] Problem notes dialog with required notes and cancel rollback
- [x] Implement `frontend/components/activity-panel.tsx` — reverse-chronological timeline
- [x] Category jump chips for multi-category JOs
- [x] Progress and Problem count update without page refresh
- [x] Browser-verified: JO 126.110 detail shows 22 parts + 13 components with interactive status dropdowns

### Task 8 — Add Data Modes ✅

- [x] Implement `frontend/components/add-data-dialog.tsx` — Manual Entry vs Image Conversion choice
- [x] Manual Entry form — Part fields (No, Description, Dimension, Material, Qty, HRc) + default `-` controls
- [x] Image Conversion simulator — simulated upload, editable preview table, confirm/cancel, explicit "future feature" label
- [x] Confirmed rows appear in correct category, update activity and progress

### Task 9 — Visual QA & Demo Verification ✅

- [x] Run production build: `npm run build` — passes (4 routes compiled)
- [x] Start dev server: `npm run dev` — running on port 3000
- [x] Verify JO detail page: header, progress, status dropdowns, activity history — via browser screenshots
- [x] **Demo path:** Dashboard → `126.110` → control tables with 22 parts, 13 components → status colors correct
- [x] **Create JO:** TANDEM type, PART DIES OP 20 + COMPONENT + Custom "SPECIAL INSERT" → verified in browser
- [x] **Empty categories:** all 3 sections show empty state with "Add Data" buttons → verified
- [x] Confirm: `Staff Engineering · Demo Mode` visible in sidebar
- [x] Confirm: Image Conversion labelled "SIMULATED — FUTURE FEATURE"
- [x] All 25 tests pass, typecheck clean, production build clean

---

## Verification Results

```
Test Files  2 passed (2)
     Tests  25 passed (25)

Build: ✓ Compiled successfully
Routes:
  ○ /                                      (Dashboard)
  ○ /not-found                             (404)
  ƒ /projects/[projectId]/jos/[joId]       (JO Detail)
```

---

## After Prototype Approval

Once management approves the prototype UI, transition to the backend MVP:

1. Implement Laravel migrations, models, and relationships per the [MVP plan](./plans/2026-08-13-project-controlling-mvp-implementation.md).
2. Build REST API endpoints matching the prototype interactions.
3. Add Sanctum auth with Engineering/Supervisor roles.
4. Replace in-memory store with API calls.
5. Add Supervisor read-only mode.
6. Real Image Conversion (OCR from GstarCAD) is a separate, later feature.
