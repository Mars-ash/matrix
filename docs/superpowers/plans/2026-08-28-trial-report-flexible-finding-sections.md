# Trial Report Flexible Finding Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Workspace: `C:\laragon\www\matrix`
Frontend app: `frontend/`
Scope: Next.js frontend prototype only, in-memory state, no Laravel API, no PostgreSQL, no localStorage.

## 1. Current Context

MATRIX is currently a frontend-only Project Controlling prototype using Next.js 16, React 19, TypeScript, Tailwind CSS v4, and Vitest.

Before implementation, read:

- `AGENTS/AGENTS.md`
- `AGENTS/AGENT_WORKFLOW.md`
- `frontend/AGENTS.md`
- The relevant Next.js 16 docs under `frontend/node_modules/next/dist/docs/` before changing route files
- Existing Trial Reporting design and plan:
  - `docs/superpowers/specs/2026-08-27-trial-reporting-design.md`
  - `docs/superpowers/plans/2026-08-27-trial-reporting.md`

Existing trial report files:

- `frontend/lib/types.ts`
- `frontend/lib/trial-report.ts`
- `frontend/lib/store.tsx`
- `frontend/lib/mock-data.ts`
- `frontend/lib/trial-report.test.ts`
- `frontend/lib/store.test.ts`
- `frontend/app/projects/[projectId]/jos/[joId]/trial-reports/page.tsx`
- `frontend/app/projects/[projectId]/jos/[joId]/trial-reports/print/page.tsx`
- `frontend/components/trial-report-session-list.tsx`
- `frontend/components/trial-session-form-dialog.tsx`
- `frontend/components/trial-report-editor.tsx`
- `frontend/components/trial-finding-card.tsx`
- `frontend/components/trial-photo-uploader.tsx`
- `frontend/components/trial-report-print-view.tsx`
- `frontend/app/globals.css`

Current limitation:

- One finding currently has one `problem`, one `cause`, one `correctiveAction`, one `targetDate`, one `pic`, one `status`, and photos attached at the whole-finding level.

Required change:

- One finding must support any number of problem rows, cause rows, and corrective action rows.
- Each row can have its own photos.
- `Target` and `Status` belong to each corrective action row, not to the whole finding.

## 2. Product Behavior

One trial session has many findings.

Each finding is a flexible container:

```text
Finding A
  Uraian Masalah
    1. problem text + photos
    2. problem text + photos

  Penyebab
    1. cause text + photos

  Langkah Perbaikan
    1. action text + target + status + photos
    2. action text + target + status + photos
    3. action text + target + status + photos
```

Users must be free to create combinations such as:

- 2 problems, 1 cause, 3 corrective actions
- 1 problem, 3 causes, 5 corrective actions
- 3 problems, 2 causes, 1 corrective action

Finding numbering:

- Findings use letters: `A`, `B`, `C`, and so on.
- Entries inside each section use numbers: `1`, `2`, `3`, and so on.

Photo behavior:

- Photos attach to a specific problem, cause, or corrective action entry.
- Photos must print under the exact entry they belong to.
- Duplicating a trial session copies text, target dates, statuses, and order values, but clears all photos.

Corrective action behavior:

- Each corrective action has its own `targetDate`.
- Each corrective action has its own `status`.
- Session status is derived from corrective action statuses:
  - `On Process` if there are no corrective actions.
  - `On Process` if any corrective action is `On Process`.
  - `Close` only when all corrective actions in all findings are `Close`.

PIC behavior:

- Move `pic` from the whole finding to each corrective action entry.
- Reason: `Target`, `Status`, and action ownership all belong to the specific `Langkah Perbaikan`.
- This decision is confirmed: PIC follows each `Langkah Perbaikan` entry together with target and status.

## 3. Explicit Non-Goals

Do not add:

- Laravel/backend persistence
- PostgreSQL changes
- localStorage persistence
- Excel import/export
- Server-generated PDF
- Signature image upload
- Photo captions
- Finding-level print filtering
- Linking trial entries to JO process cells
- Manual page management
- Revision/history restore

Do not change:

- JO progress calculation
- Category progress calculation
- Existing process-control status behavior
- Existing process photo behavior outside Trial Reports
- Subcont tracker behavior

## 4. Proposed Data Model

Update trial report types in `frontend/lib/types.ts`.

```ts
export interface TrialEntryPhoto {
  id: string;
  name: string;
  previewUrl: string;
  addedAt: string;
}

export interface TrialTextEntry {
  id: string;
  order: number;
  text: string;
  photos: TrialEntryPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface TrialCorrectiveActionEntry {
  id: string;
  order: number;
  text: string;
  targetDate: string;
  pic: string;
  status: TrialFindingStatus;
  photos: TrialEntryPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface TrialFinding {
  id: string;
  order: number;
  problems: TrialTextEntry[];
  causes: TrialTextEntry[];
  correctiveActions: TrialCorrectiveActionEntry[];
  createdAt: string;
  updatedAt: string;
}
```

Compatibility note:

- This is a prototype with mock data, so no migration layer is required unless the current UI must preserve existing in-browser state across hot reload.
- Convert all mock data to the new shape.

## 5. File Structure

Modify existing files:

- `frontend/lib/types.ts`
  - Replace current single-field finding shape with repeatable entry arrays.
  - Replace or alias `TrialFindingPhoto` as `TrialEntryPhoto`.

- `frontend/lib/trial-report.ts`
  - Add `formatFindingLetter(indexOrOrder)`.
  - Add generic entry sorting helper.
  - Update session status derivation to use corrective action entries.
  - Update clone helper to clear nested photos.

- `frontend/lib/store.tsx`
  - Replace whole-finding field update actions with section-entry actions.
  - Keep finding create/delete/reorder actions.
  - Add problem/cause/action entry add/update/delete/reorder.
  - Add photo add/remove for a specific nested entry.

- `frontend/lib/mock-data.ts`
  - Convert mock sessions and findings to nested entry arrays.
  - Add examples with uneven counts across problem/cause/action sections.
  - Attach placeholder photos to specific nested entries.

- `frontend/components/trial-report-editor.tsx`
  - Keep session header editing.
  - Create new findings with default empty arrays or one starter entry per section.
  - Pass finding letter/index to finding card.

- `frontend/components/trial-finding-card.tsx`
  - Render `Temuan A`, `Temuan B`, etc.
  - Render three repeatable sections.
  - Add per-section add buttons.
  - Render entry-level move/delete controls.
  - Render target, PIC, and status only on corrective action entries.

- `frontend/components/trial-photo-uploader.tsx`
  - Make the uploader reusable via `onAddPhoto` and `onRemovePhoto` callbacks.
  - Keep object URL creation and file input reset behavior.
  - Keep blob URL revoke behavior on remove.

- `frontend/components/trial-report-print-view.tsx`
  - Print findings as lettered blocks.
  - Print numbered entries under `Uraian Masalah`, `Penyebab`, and `Langkah Perbaikan`.
  - Print photos directly under the owning entry.
  - Print target, PIC, and status per corrective action.

- `frontend/app/globals.css`
  - Add styles for nested finding sections, entry rows, and entry photos.
  - Update print styles for lettered finding blocks and nested numbered entries.

- `frontend/lib/trial-report.test.ts`
  - Update helper tests for nested model.

- `frontend/lib/store.test.ts`
  - Update reducer tests for nested entries and entry-level photos.
  - Preserve progress regression test.

Do not create new route files unless implementation reveals a strong need. The current editor and print routes can stay.

## 6. Reducer Action Design

Keep these existing high-level actions:

- `CREATE_TRIAL_SESSION`
- `DUPLICATE_TRIAL_SESSION`
- `UPDATE_TRIAL_SESSION`
- `DELETE_TRIAL_SESSION`
- `ADD_TRIAL_FINDING`
- `DELETE_TRIAL_FINDING`
- `REORDER_TRIAL_FINDING`

Replace finding-level field/photo actions with nested entry actions:

```ts
type TrialEntrySection = "problems" | "causes" | "correctiveActions";
```

Suggested actions:

```ts
ADD_TRIAL_ENTRY
UPDATE_TRIAL_ENTRY
DELETE_TRIAL_ENTRY
REORDER_TRIAL_ENTRY
ADD_TRIAL_ENTRY_PHOTO
REMOVE_TRIAL_ENTRY_PHOTO
```

Action rules:

- `ADD_TRIAL_ENTRY` appends to one section and assigns next sequential order.
- `UPDATE_TRIAL_ENTRY` updates only the targeted entry.
- `DELETE_TRIAL_ENTRY` removes only the targeted entry and resequences that section.
- `REORDER_TRIAL_ENTRY` reorders only within the targeted section.
- `ADD_TRIAL_ENTRY_PHOTO` appends to only the targeted entry.
- `REMOVE_TRIAL_ENTRY_PHOTO` removes only from the targeted entry.
- Missing project, JO, session, finding, section, or entry must return the original state object.
- Any mutation to an entry updates entry `updatedAt`, finding `updatedAt`, and session `updatedAt`.

## 7. Task Plan

### Task 0: Preflight

1. Read `AGENTS/AGENTS.md`.
2. Read `AGENTS/AGENT_WORKFLOW.md`.
3. Read `frontend/AGENTS.md`.
4. Read current Trial Reporting spec and plan.
5. Read current trial report source files.
6. Run frontend Git status.
7. Note existing dirty/deleted files and preserve unrelated changes.

Verification:

```powershell
git status --short
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend status --short
```

### Task 1: Update Types And Helper Tests First

1. Update `frontend/lib/trial-report.test.ts` with expected nested behavior.
2. Add tests for finding letter formatting.
3. Add tests for sorting nested entries without mutation.
4. Add tests for deriving session status from corrective actions.
5. Add tests for empty corrective actions returning `On Process`.
6. Add tests for clone clearing photos from problems, causes, and corrective actions.
7. Run the targeted tests and confirm they fail for the expected reasons.
8. Update `frontend/lib/types.ts` with the nested model.
9. Update `frontend/lib/trial-report.ts` to pass helper tests.
10. Run targeted helper tests.
11. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run test -- --run lib/trial-report.test.ts
npm.cmd run typecheck
```

### Task 2: Update Reducer Tests And Store Actions

1. Update `frontend/lib/store.test.ts` to create nested trial findings.
2. Add test for adding a problem entry.
3. Add test for adding a cause entry.
4. Add test for adding a corrective action entry with target, PIC, and status.
5. Add test for updating only one nested entry.
6. Add test for deleting one nested entry and resequencing only that section.
7. Add test for reordering entries within one section.
8. Add test proving reordering a problem does not reorder causes or corrective actions.
9. Add test for adding/removing a photo from a problem entry.
10. Add test for adding/removing a photo from a cause entry.
11. Add test for adding/removing a photo from a corrective action entry.
12. Add test proving photos attach only to the targeted entry.
13. Add test proving duplicate sessions clear all nested photos.
14. Keep or update missing-ID guard tests.
15. Keep progress regression test proving trial reports do not affect JO progress.
16. Run store tests and confirm expected failures before implementation.
17. Update `frontend/lib/store.tsx` action types.
18. Implement nested entry lookup helpers if they reduce repeated code.
19. Implement nested entry reducer cases.
20. Run store/helper/progress tests.
21. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run test -- --run lib/store.test.ts lib/progress.test.ts lib/trial-report.test.ts
npm.cmd run typecheck
```

### Task 3: Convert Mock Data

1. Update `frontend/lib/mock-data.ts` trial sessions to the nested model.
2. Convert existing `problem` strings into `problems[0].text`.
3. Convert existing `cause` strings into `causes[0].text`.
4. Convert existing `correctiveAction`, `targetDate`, `pic`, and `status` into `correctiveActions[0]`.
5. Move existing finding photos to the most relevant nested entry.
6. Add at least one mock finding with `2` problems, `1` cause, and `3` corrective actions.
7. Add at least one mock finding with `1` problem, `3` causes, and `2` corrective actions.
8. Keep all mock photo paths local under `frontend/public`.
9. Run tests.
10. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run test -- --run lib/store.test.ts lib/progress.test.ts lib/trial-report.test.ts
npm.cmd run typecheck
```

### Task 4: Refactor Photo Uploader For Entry-Level Ownership

1. Update `frontend/components/trial-photo-uploader.tsx` props to accept callbacks:
   - `photos`
   - `onAddPhoto(file)`
   - `onRemovePhoto(photoId, previewUrl)`
2. Keep support for multiple image selection.
3. Keep `accept="image/*"`.
4. Keep file input reset after upload.
5. Keep blob URL revocation on remove.
6. Update current call sites to compile.
7. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run typecheck
```

### Task 5: Update Finding Editor UI

1. Update `frontend/components/trial-report-editor.tsx` to create new findings with nested arrays.
2. Decide whether a new finding starts empty or with one blank row per section.
3. Recommended: start with one blank problem, one blank cause, and one blank corrective action to reduce clicks.
4. Update `frontend/components/trial-finding-card.tsx` to render `Temuan A`, `Temuan B`, etc.
5. Add a reusable internal section renderer for `Uraian Masalah`.
6. Add a reusable internal section renderer for `Penyebab`.
7. Add a corrective action section renderer with text, target date, PIC, status, and photos.
8. Add `+ Tambah` button inside each section.
9. Add move up/down controls per nested entry.
10. Add delete controls per nested entry with confirmation.
11. Disable move up/down at section boundaries.
12. Keep finding-level move up/down/delete behavior.
13. Ensure long text areas remain usable on mobile.
14. Run typecheck.
15. Run lint.

Verification:

```powershell
cd frontend
npm.cmd run typecheck
npm.cmd run lint
```

Manual check:

- Add one finding.
- Add multiple problem rows.
- Add multiple cause rows.
- Add multiple corrective action rows.
- Attach photos to specific rows.
- Delete and reorder rows independently.

### Task 6: Update Print Preview

1. Update `frontend/components/trial-report-print-view.tsx`.
2. Render each finding as a lettered block.
3. Render `Uraian Masalah` entries as numbered rows/list items.
4. Render `Penyebab` entries as numbered rows/list items.
5. Render `Langkah Perbaikan` entries as numbered rows/list items with target, PIC, and status.
6. Render photos under the exact owning entry.
7. Keep company logo and report header.
8. Keep session-level signature boxes.
9. Keep each selected session starting on a new printed page.
10. Update empty states for findings with no nested entries.
11. Run typecheck.
12. Run lint.

Verification:

```powershell
cd frontend
npm.cmd run typecheck
npm.cmd run lint
```

Manual check:

- Print one selected session.
- Print multiple selected sessions.
- Confirm photos appear under the correct problem/cause/action entry.
- Confirm target and status appear per corrective action.

### Task 7: Update Styling

1. Update `frontend/app/globals.css` trial editor styles.
2. Add styles for nested section headers.
3. Add styles for nested entry cards/rows.
4. Add compact controls for entry add/reorder/delete.
5. Add mobile layout rules for corrective action target/PIC/status fields.
6. Update print styles for nested sections.
7. Add page-break avoidance for finding blocks where practical.
8. Keep printed output white background and black text.
9. Scan UI for text overflow on narrow viewport.
10. Run lint.
11. Run typecheck.
12. Run build.

Verification:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

### Task 8: Full Verification

1. Run full Vitest suite.
2. Run lint.
3. Run typecheck.
4. Run production build.
5. Start dev server.
6. Open dashboard.
7. Open existing JO `126.110`.
8. Open Trial Reports.
9. Create a new trial session.
10. Add finding `A`.
11. Add `2` problem entries.
12. Add `1` cause entry.
13. Add `3` corrective action entries.
14. Attach photos to problem `1`, cause `1`, and corrective action `2`.
15. Reorder problem entries.
16. Reorder corrective action entries.
17. Delete one cause entry and confirm numbering stays sequential.
18. Change action statuses and confirm session status updates.
19. Duplicate the session and confirm all nested photos are cleared.
20. Select one session for print.
21. Open print preview.
22. Select multiple sessions for print.
23. Open print preview.
24. Use browser print preview and inspect page breaks.
25. Review Git diff.
26. Confirm no unrelated dirty files were reverted.
27. Confirm no secrets or external image URLs were introduced.
28. Confirm trial report state remains frontend-only/in-memory.

Verification:

```powershell
cd frontend
npm.cmd run test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

Report only checks that actually ran successfully. If browser or print verification is blocked, state that clearly.

## 8. Review Checklist

- Findings display as letters.
- Problem, cause, and corrective action entries display as numbers within each section.
- Users can create uneven section counts inside one finding.
- Photos attach to a specific problem, cause, or corrective action entry.
- Photos print under the correct owning entry.
- Target and status belong to each corrective action.
- PIC belongs to each corrective action entry together with target and status.
- Duplicate session clears all nested photos.
- Session status is derived from corrective action statuses.
- Trial reports do not affect JO progress.
- No backend, database, localStorage, Excel, or PDF generator was added.
- Print output stays Indonesian and readable.
- Existing process tracking, process photos, subcont, and JO detail behavior remain intact.

## 9. Confirmed Decision

PIC placement is confirmed:

- `PIC` belongs to each `Langkah Perbaikan` entry.
- `PIC`, `Target`, and `Status` are edited and printed per corrective action.
