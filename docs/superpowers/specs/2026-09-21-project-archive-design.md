# Design Spec: Project & Job Order Archive Module

- **Date**: 2026-09-21
- **Topic**: Dedicated Archive Page (`/archive`), Active vs. Archived Segregation, and Restore Functionality
- **Target Aesthetic**: MATRIX clean industrial design system (SVG stroke icons, zero emojis/emoticons, high contrast, clean typography, responsive layout)

---

## 1. Overview & Requirements

1. **Dashboard Segregation (Active vs. Archived)**:
   - **Active Dashboard (`/`)**:
     - Displays only active / ongoing Job Orders (`finishDate === null`).
     - Projects that have zero active JOs (all JOs are finished) are automatically hidden from the active dashboard.
     - If a project has both active and finished JOs, only its active JOs are rendered on the active dashboard.
   - **Dedicated Archive Page (`/archive`)**:
     - Accessible via a dedicated Archive button in the main Dashboard header.
     - Displays all completed / finished Job Orders (`finishDate !== null`), grouped cleanly under their parent Project.
     - If all JOs of a project are finished, the whole project appears in the Archive.
     - If a project has some finished and some active JOs, only its finished JOs appear in the Archive under that project's section.

2. **Archive Button on Main Dashboard**:
   - Located in the top dashboard control bar next to the Search input and New Item menu.
   - Uses a clean industrial **SVG stroke icon** (archive box):
     ```tsx
     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <polyline points="21 8 21 21 3 21 3 8" />
       <rect x="1" y="3" width="22" height="5" />
       <line x1="10" y1="12" x2="14" y2="12" />
     </svg>
     ```
   - Features a pill counter badge showing total archived JO count (e.g. `Archive (4)`).
   - Click navigates directly to `/archive`.

3. **Archive Page Features (`/archive`)**:
   - **Breadcrumbs**: `Dashboard › Archive`.
   - **Back Action**: Button with SVG arrow left icon (`← Kembali ke Dashboard`).
   - **Header Metrics**: Total archived projects, total finished JOs, and last completion date.
   - **Search Filter**: Real-time live filtering by JO number, product name, customer, project name, or JO type.
   - **Archived JO Cards**:
     - Distinct status badge with SVG check icon: `Selesai: YYYY-MM-DD` (emerald).
     - Progress bar locked at 100% or completion percentage.
     - Action buttons:
       - **Buka JO**: Navigates to `/projects/[projectId]/jos/[joId]` for historical audit, process photos, and logs.
       - **Kembalikan ke Aktif (Restore)**: Accessible only to `controller` role. Triggers a confirmation modal to unarchive / restore the JO back to active.

4. **Restore / Unarchive Flow**:
   - When a controller confirms restore:
     - Sends `PATCH /api/jos/{jo}/restore` to the Laravel backend.
     - Clears `finish_date` (`finish_date = null`).
     - Logs activity: `"JO {jo_number} dikembalikan ke status aktif dari arsip."`.
     - Frontend store optimistically updates: the JO disappears from `/archive` and immediately re-appears in `/`.

5. **Iconography & Design Rules**:
   - **Strict Rule**: Zero emoji or emoticon characters in UI (no 📦, ↺, 📁, ➕, etc.).
   - Only use inline SVG vector stroke icons conforming to existing MATRIX UI icons (`stroke="currentColor"`, `strokeWidth="2"`, `strokeLinecap="round"`, `strokeLinejoin="round"`).

---

## 2. Technical Architecture & File Changes

### Backend (Laravel 13 / PHP 8.3)
1. **Routes** (`backend/routes/api.php`):
   - Add `PATCH /jos/{jo}/restore` inside `role.controller` middleware group pointing to `JOController@restore`.
2. **Controller** (`backend/app/Http/Controllers/Api/JOController.php`):
   - Add method `restore(Request $request, JO $jo): JsonResponse`:
     - Checks controller authorization.
     - Updates `$jo->update(['finish_date' => null])`.
     - Creates Activity log: `Activity::create(['jo_id' => $jo->id, 'message' => "JO {$jo->jo_number} dikembalikan ke status aktif dari arsip."])`.
     - Returns updated `JOResource` with 200 OK.
3. **Automated Tests** (`backend/tests/Feature/JOTest.php`):
   - Test that controller can restore a finished JO (`finish_date` becomes null).
   - Test that viewer receives 403 Forbidden.

### Frontend (Next.js 16 / React 19 / TypeScript)
1. **API Client** (`frontend/lib/api-client.ts`):
   - Add `restoreJO(joId: string): Promise<{ data: JO; message: string }>`.
2. **Store** (`frontend/lib/store.tsx`):
   - Add `RESTORE_JO` action type (`{ type: "RESTORE_JO"; projectId: string; joId: string }`).
   - Reducer handler: sets `jo.finishDate = undefined`, logs activity.
   - Side effect handler: invokes `api.restoreJO(action.joId)`.
3. **Main Dashboard** (`frontend/app/page.tsx`):
   - Filter projects & JOs to only show active items (`!jo.finishDate`).
   - Hide projects where `activeJos.length === 0`.
   - Calculate total archived JO count: `allFinishedJos.length`.
   - Add Archive button with SVG box icon and count badge in the top controls bar.
4. **Archive Page** (`frontend/app/archive/page.tsx`):
   - New route rendering all finished projects and JOs.
   - Header with back button, breadcrumbs, search input.
   - Renders archived projects and cards.
   - Includes `ConfirmDialog` for restoring JOs with clear, concise copy (*"Kembalikan JO {joNumber} ke status aktif?"*).
5. **Archived JO Card** (`frontend/components/archive-jo-card.tsx`):
   - Clean industrial card matching `JoCard` with finished date badge and SVG restore button.
6. **Store Unit Tests** (`frontend/lib/store.test.ts`):
   - Add unit tests for `RESTORE_JO` action.

---

## 3. Testing & Verification

1. **Backend Verification**:
   - Run `php artisan test` to verify existing and new restore endpoints.
2. **Frontend Verification**:
   - Run `npm run typecheck` (`tsc --noEmit`).
   - Run `npm test` (`vitest`).
3. **Functional Verification**:
   - Finish a JO on `/projects/.../jos/...`.
   - Verify it leaves the active Dashboard (`/`).
   - Verify it appears in the Archive page (`/archive`).
   - Click "Kembalikan ke Aktif" in `/archive` and confirm.
   - Verify it leaves `/archive` and reappears in `/`.
