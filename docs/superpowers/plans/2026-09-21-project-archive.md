# Project & Job Order Archive Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Implement a dedicated Archive page (`/archive`) for completed projects and Job Orders (JOs), accessible via an archive SVG icon button on the main Dashboard, with automatic segregation and a controller-authorized Restore flow.

---

## Proposed Changes

### Backend (Laravel 13)

#### [MODIFY] [routes/api.php](file:///c:/laragon/www/matrix/backend/routes/api.php)
- Add `Route::patch('/jos/{jo}/restore', [JOController::class, 'restore']);` inside the `role.controller` middleware group.

#### [MODIFY] [app/Http/Controllers/Api/JOController.php](file:///c:/laragon/www/matrix/backend/app/Http/Controllers/Api/JOController.php)
- Add `restore(Request $request, JO $jo): JsonResponse`:
  - Validates controller authorization (`$request->user()?->isController()`).
  - Sets `finish_date = null` on the JO.
  - Logs activity: `"JO {$jo->jo_number} dikembalikan ke status aktif dari arsip."`.
  - Returns `JOResource` with 200 OK.

#### [MODIFY] [tests/Feature/JOTest.php](file:///c:/laragon/www/matrix/backend/tests/Feature/JOTest.php)
- Add test: `test_controller_can_restore_finished_jo()`.
- Add test: `test_viewer_cannot_restore_finished_jo()`.

---

### Frontend (Next.js 16 / React 19 / TypeScript)

#### [MODIFY] [lib/api-client.ts](file:///c:/laragon/www/matrix/frontend/lib/api-client.ts)
- Add `restoreJO(joId: string): Promise<{ data: JO; message: string }>` method sending `PATCH /jos/${joId}/restore`.

#### [MODIFY] [lib/store.tsx](file:///c:/laragon/www/matrix/frontend/lib/store.tsx)
- Add `RESTORE_JO` action to `AppAction` union type (`{ type: "RESTORE_JO"; projectId: string; joId: string }`).
- Implement reducer case `RESTORE_JO`:
  - Finds project and JO.
  - Resets `jo.finishDate = undefined`.
  - Appends activity log `"JO dikembalikan ke status aktif."`.
- Implement side-effect in `dispatch`:
  - Calls `api.restoreJO(action.joId)`.

#### [MODIFY] [lib/store.test.ts](file:///c:/laragon/www/matrix/frontend/lib/store.test.ts)
- Add unit tests verifying `RESTORE_JO` clears `finishDate` and updates activities.

#### [NEW] [components/archive-jo-card.tsx](file:///c:/laragon/www/matrix/frontend/components/archive-jo-card.tsx)
- Clean industrial card conforming strictly to MATRIX theme:
  - Header: JO number, JO Type badge, finished date with green SVG check icon (`stroke="currentColor"`).
  - Body: Product name, customer.
  - Action footer:
    - Link to detail page `/projects/${projectId}/jos/${jo.id}` ("Buka JO").
    - Restore button (controllers only) with SVG rotate/undo icon.
    - Zero emojis / emoticons.

#### [MODIFY] [app/page.tsx](file:///c:/laragon/www/matrix/frontend/app/page.tsx)
- Segregate active vs archived:
  - Dashboard shows only active JOs (`!jo.finishDate`).
  - Projects with only finished JOs are hidden from the active Dashboard.
  - Top header controls: Add **Archive button** linking to `/archive` with SVG archive box icon and badge counter showing total archived JOs.

#### [NEW] [app/archive/page.tsx](file:///c:/laragon/www/matrix/frontend/app/archive/page.tsx)
- Dedicated page for archived projects & finished JOs.
- Features:
  - AppShell with breadcrumb: `Dashboard › Archive`.
  - Back button with SVG arrow left icon (`Kembali ke Dashboard`).
  - KPI summary metrics (total finished JOs, total archived projects).
  - Search filter input for archived data.
  - Grouped project sections rendering `ArchiveJoCard` items.
  - Wire `ConfirmDialog` to confirm restore action.
  - Empty state when no archived JOs exist.

---

## Step-by-Step Implementation Tasks

### Task 1: Backend Restore API & Feature Tests
1. Add `PATCH /jos/{jo}/restore` in `backend/routes/api.php`.
2. Implement `restore()` in `backend/app/Http/Controllers/Api/JOController.php`.
3. Add automated tests in `backend/tests/Feature/JOTest.php`.
4. Run `php artisan test --filter=JOTest` to verify.

### Task 2: Frontend API Client & State Management
1. Add `restoreJO()` in `frontend/lib/api-client.ts`.
2. Add `RESTORE_JO` to `AppAction` and implement in reducer & side-effect dispatch in `frontend/lib/store.tsx`.
3. Add unit test in `frontend/lib/store.test.ts`.
4. Run `npm test` to verify.

### Task 3: Archive JO Card Component
1. Create `frontend/components/archive-jo-card.tsx` with clean SVG stroke icons.
2. Wire "Buka JO" link and controller "Restore" button with callback.

### Task 4: Main Dashboard Segregation & Archive Button
1. Update `frontend/app/page.tsx` to filter to active JOs and projects.
2. Add Archive navigation button in header with SVG archive box icon and count badge.

### Task 5: Dedicated Archive Page (`/archive`)
1. Create `frontend/app/archive/page.tsx` with breadcrumbs, KPI metrics, live search, grouped project sections, and `ConfirmDialog` for restore.

### Task 6: Full Verification
1. Run `php artisan test` (all 33+ backend tests pass).
2. Run `npm run typecheck` (`tsc --noEmit` clean).
3. Run `npm test` (all frontend tests pass).
4. Verify end-to-end user flows in browser.
