# Delete Project, Delete JO, and Custom Photo Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Implement deletion functionality for Projects and Job Orders (JO) with a polished confirmation dialog, and replace native `window.confirm` on photo deletion with a custom thumbnail-enabled confirmation dialog.

---

### Proposed Changes

#### Backend (Laravel)

##### [MODIFY] [routes/api.php](file:///c:/laragon/www/matrix/backend/routes/api.php)
- Add `Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);` within `role.controller` group.
- Add `Route::delete('/jos/{jo}', [JOController::class, 'destroy']);` within `role.controller` group.

##### [MODIFY] [app/Http/Controllers/Api/ProjectController.php](file:///c:/laragon/www/matrix/backend/app/Http/Controllers/Api/ProjectController.php)
- Add `destroy(Project $project): JsonResponse` method.

##### [MODIFY] [app/Http/Controllers/Api/JOController.php](file:///c:/laragon/www/matrix/backend/app/Http/Controllers/Api/JOController.php)
- Add `destroy(JO $jo): JsonResponse` method.

##### [MODIFY] [tests/Feature/ProjectTest.php](file:///c:/laragon/www/matrix/backend/tests/Feature/ProjectTest.php)
- Add tests for `DELETE /api/projects/{project}` (unauthenticated, viewer forbidden 403, controller success 200/204).

##### [MODIFY] [tests/Feature/JOTest.php](file:///c:/laragon/www/matrix/backend/tests/Feature/JOTest.php)
- Add tests for `DELETE /api/jos/{jo}` (unauthenticated, viewer forbidden 403, controller success 200/204).

---

#### Frontend (Next.js & React)

##### [NEW] [components/confirm-dialog.tsx](file:///c:/laragon/www/matrix/frontend/components/confirm-dialog.tsx)
- Reusable, accessible confirmation dialog.
- Supports title, simple body text or custom React node (e.g. photo preview thumbnail), cancel and confirm buttons, loading state, and keyboard shortcuts (`Escape`, `Enter`).
- Styled with MATRIX design system (subtle warning icon, clean borders, high-contrast text, no AI slop).

##### [MODIFY] [lib/api-client.ts](file:///c:/laragon/www/matrix/frontend/lib/api-client.ts)
- Add `deleteProject(projectId: string): Promise<{ message: string }>`
- Add `deleteJO(joId: string): Promise<{ message: string }>`

##### [MODIFY] [lib/store.tsx](file:///c:/laragon/www/matrix/frontend/lib/store.tsx)
- Add `DELETE_PROJECT` and `DELETE_JO` action types to `AppAction`.
- Implement reducer logic for `DELETE_PROJECT` (filters out project).
- Implement reducer logic for `DELETE_JO` (filters out JO from project).
- Connect API calls in async dispatch wrapper.

##### [MODIFY] [lib/store.test.ts](file:///c:/laragon/www/matrix/frontend/lib/store.test.ts)
- Add unit tests verifying `DELETE_PROJECT` and `DELETE_JO` state updates.

##### [MODIFY] [components/jo-card.tsx](file:///c:/laragon/www/matrix/frontend/components/jo-card.tsx)
- Add optional/controller delete button with `e.stopPropagation()` and `e.preventDefault()`.
- Add delete callback or modal trigger.

##### [MODIFY] [app/page.tsx](file:///c:/laragon/www/matrix/frontend/app/page.tsx)
- Add Project delete button in project header row for controllers.
- Add JO delete handling and wire `ConfirmDialog` for both Project and JO deletion.

##### [MODIFY] [app/projects/[projectId]/jos/[joId]/page.tsx](file:///c:/laragon/www/matrix/frontend/app/projects/[projectId]/jos/[joId]/page.tsx)
- Add "Hapus JO" button in `jo-detail-actions` row for controllers.
- Wire `ConfirmDialog` and redirect to `/` upon deletion.

##### [MODIFY] [components/trial-photo-uploader.tsx](file:///c:/laragon/www/matrix/frontend/components/trial-photo-uploader.tsx)
- Replace `window.confirm("Hapus foto ini?")` with `ConfirmDialog` displaying the thumbnail preview and simple prompt: *"Hapus foto ini?"*.

##### [MODIFY] [components/process-photo-dialog.tsx](file:///c:/laragon/www/matrix/frontend/components/process-photo-dialog.tsx)
- Add `ConfirmDialog` with thumbnail preview when clicking remove photo.

---

## Verification Plan

### Automated Tests
1. **Backend Feature Tests**:
   - Run `php artisan test --filter=ProjectTest`
   - Run `php artisan test --filter=JOTest`
2. **Frontend Unit Tests**:
   - Run `npm test -- store.test.ts`

### Manual & Visual Verification
1. **Delete Project on Dashboard**:
   - Open Dashboard as controller.
   - Click delete icon on project header -> verify clean dialog opens with text: *"Hapus project **{name}** dan seluruh isinya?"*.
   - Confirm -> project disappears from list and backend deletes it.
2. **Delete JO on Dashboard**:
   - Click delete on a JO card -> verify link navigation does NOT happen and confirmation dialog opens with text: *"Hapus JO **{joNumber}** ({product})?"*.
   - Confirm -> JO card disappears.
3. **Delete JO on Detail Page**:
   - Open JO detail page -> click "Hapus JO" button in header.
   - Confirm -> deletes JO and redirects cleanly to Dashboard (`/`).
4. **Delete Photo**:
   - Open trial finding or process control photos.
   - Click delete on a photo -> verify NO native browser alert appears; custom modal opens showing thumbnail preview and *"Hapus foto ini?"*.
   - Confirm -> photo is removed.
