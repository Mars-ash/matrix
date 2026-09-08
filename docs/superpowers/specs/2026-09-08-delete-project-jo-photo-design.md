# Design Spec: Delete Project, Delete JO, and Custom Photo Delete Confirmation

- **Date**: 2026-09-08
- **Topic**: Delete Project & JO with confirmation modal + Custom Photo delete confirmation
- **Target Aesthetic**: MATRIX clean industrial design system (no AI slop, concise text, high contrast, purposeful typography)

---

## 1. Overview & Requirements

1. **Delete Project**:
   - Authorized for `role.controller` only.
   - Deletes project from database via backend API and store in frontend.
   - Cascades all related Job Orders, categories, items, controls, photos, and trial sessions.
   - Triggers via a clean confirmation window with simple, concise text.

2. **Delete Job Order (JO)**:
   - Authorized for `role.controller` only.
   - Accessible from **two locations** (Option A):
     - On Dashboard (`JoCard`): a subtle action button that stops propagation so the card link is not triggered.
     - On JO Detail Page (`/projects/[projectId]/jos/[joId]`): a danger action button in the top action bar. If deleted from here, the user is redirected to `/`.
   - Cascades all related categories, items, controls, photos, activities, and trial sessions.
   - Triggers via a clean confirmation window with simple, concise text.

3. **Custom Photo Delete Confirmation**:
   - Replaces browser-native `window.confirm("Hapus foto ini?")` in `TrialPhotoUploader`.
   - Adds custom confirmation to `ProcessPhotoDialog` (which previously deleted photos without confirmation).
   - Shows image thumbnail preview, filename, and a simple confirmation prompt: *"Hapus foto ini?"*.

4. **Tone & Copywriting**:
   - Short, simple, and direct Indonesian text without bloated or bureaucratic warnings:
     - Project: Title: **Hapus Project**, Body: *"Hapus project **{name}** dan seluruh isinya?"*, Buttons: **Batal** / **Hapus**.
     - JO: Title: **Hapus Job Order**, Body: *"Hapus JO **{joNumber}** ({product})?"*, Buttons: **Batal** / **Hapus**.
     - Photo: Title: **Hapus Foto**, Body: *"Hapus foto ini?"*, Buttons: **Batal** / **Hapus**.

5. **Design Language**:
   - Adheres strictly to MATRIX tokens (`--color-surface`, `--color-border`, `--color-status-problem`, `--color-status-problem-bg`, `--radius-md`).
   - Clean iconography, proper focus state, backdrop blur/tint, keyboard navigation (`Escape` to close, `Enter` to confirm).
   - No generic AI-generated neon gradients or oversized padding.

---

## 2. Technical Architecture & File Changes

### Backend (Laravel 11 / PHP 8.2+)
- **Routes** (`backend/routes/api.php`):
  - `DELETE /api/projects/{project}` in `role.controller` group -> `ProjectController@destroy`.
  - `DELETE /api/jos/{jo}` in `role.controller` group -> `JOController@destroy`.
- **Controllers**:
  - `ProjectController.php`: Add `destroy(Project $project): JsonResponse`. Returns `{"message": "Project deleted successfully."}`.
  - `JOController.php`: Add `destroy(JO $jo): JsonResponse`. Returns `{"message": "Job Order deleted successfully."}`.
- **Database & Foreign Keys**:
  - All children tables already have `cascadeOnDelete()` at the database level (`jos.project_id`, `categories.jo_id`, `activities.jo_id`, `trial_sessions.jo_id`, `items.category_id`, `controls.item_id`, etc.).

### Frontend (Next.js 15 / React 19 / TypeScript)
- **Component: `ConfirmDialog`** (`frontend/components/confirm-dialog.tsx`):
  - Props: `open`, `onClose`, `onConfirm`, `title`, `message` (or `children`), `confirmText` (default: "Hapus"), `cancelText` (default: "Batal"), `loading`, `destructive` (default: true).
  - Renders accessible modal dialog with backdrop, subtle danger badge/icon, clear content, and dual action buttons.
- **Store & API**:
  - `frontend/lib/api-client.ts`: Add `deleteProject(projectId)` and `deleteJO(joId)`.
  - `frontend/lib/store.tsx`:
    - Add `DELETE_PROJECT` action type & reducer case (filters out project from `projects`).
    - Add `DELETE_JO` action type & reducer case (filters out JO from `project.jos`).
    - Wire async API calls in `dispatch` wrapper.
- **Dashboard UI** (`frontend/app/page.tsx`):
  - Add delete button next to project header for controllers.
  - Integrate `ConfirmDialog` for project deletion.
- **JO Card UI** (`frontend/components/jo-card.tsx`):
  - Add delete button for controllers with `e.stopPropagation()` and `e.preventDefault()`.
  - Callback or inline `ConfirmDialog` to trigger JO deletion.
- **JO Detail UI** (`frontend/app/projects/[projectId]/jos/[joId]/page.tsx`):
  - Add "Hapus JO" button in top action row for controllers.
  - Integrate `ConfirmDialog` which dispatches `DELETE_JO` and routes back to `/`.
- **Photo Deletion UI**:
  - `frontend/components/trial-photo-uploader.tsx`: Replace `window.confirm` with `ConfirmDialog` containing thumbnail preview.
  - `frontend/components/process-photo-dialog.tsx`: Add `ConfirmDialog` with thumbnail preview before deleting process photo.

---

## 3. Testing & Verification

1. **Backend Tests**:
   - `backend/tests/Feature/ProjectTest.php`: Test deleting project succeeds for controller, 403 for viewer, and cascades properly.
   - `backend/tests/Feature/JOTest.php`: Test deleting JO succeeds for controller, 403 for viewer, and cascades properly.
2. **Frontend Tests**:
   - `frontend/lib/store.test.ts`: Test `DELETE_PROJECT` and `DELETE_JO` reducer behavior.
3. **Visual & User Flow Verification**:
   - Verify modal appearance and keyboard interaction.
   - Verify photo deletion modal with image thumbnail.
   - Verify redirection when deleting JO from detail page.
