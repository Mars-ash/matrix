# Trial Report Repeatable Finding Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Source spec: `docs/superpowers/specs/2026-08-28-trial-report-repeatable-finding-sections-design.md`
Base feature spec: `docs/superpowers/specs/2026-08-27-trial-reporting-design.md`
Workspace: `C:\laragon\www\matrix`
Frontend app: `frontend/`
Scope: Next.js frontend prototype only, in-memory state, no Laravel API, no PostgreSQL, no localStorage.

## 1. Context

The current Trial Report module stores one text field each for:

- `problem`
- `cause`
- `correctiveAction`
- `targetDate`
- `photos`

The approved change replaces those single fields with repeatable item arrays inside each `Temuan` while keeping the official print/table column order:

```text
No | Uraian Masalah | Penyebab | Langkah Perbaikan | Target | PIC | Status
```

Whole findings are displayed as letters: `A`, `B`, `C`.

Inside one finding:

- `Uraian Masalah` can have `1..n` items.
- `Penyebab` can have `1..n` items.
- `Langkah Perbaikan` can have `1..n` items.
- Every `Langkah Perbaikan` item owns its own target date.
- Every problem/cause/action item owns its own photos.
- `PIC` and `Status` remain at finding level.
- There is no relationship selector between problem, cause, and corrective action items.

## 2. Current Project Constraints

- Root `C:\laragon\www\matrix` is not a Git repository.
- The frontend Git repository is `frontend/`.
- Preserve the current dirty worktree; do not revert unrelated prototype files.
- Read `AGENTS/AGENTS.md`, `AGENTS/AGENT_WORKFLOW.md`, and `frontend/AGENTS.md` before implementation.
- Before editing route files, read relevant Next.js 16 docs under `frontend/node_modules/next/dist/docs/`.
- Use `npm.cmd` in PowerShell if `npm.ps1` is blocked.

Preflight command:

```powershell
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend status --short
```

## 3. File Structure

### Modify Existing Files

- `frontend/lib/types.ts`
  - Add `TrialFindingTextItem` and `TrialFindingActionItem`.
  - Change `TrialFinding` from single problem/cause/action fields to repeatable arrays.

- `frontend/lib/trial-report.ts`
  - Add helpers for finding letter labels, item sorting, item creation, item resequencing, and cloning without nested photos.
  - Update existing clone logic for the new nested shape.

- `frontend/lib/trial-report.test.ts`
  - Update helper test builders.
  - Add tests for letter labels, item sorting, item cloning without photos, and action target handling.

- `frontend/lib/store.tsx`
  - Replace whole-finding photo actions with item-level photo actions.
  - Add reducer actions for add/update/delete/reorder problem/cause/action items.
  - Keep existing session and finding actions.

- `frontend/lib/store.test.ts`
  - Update builders for new `TrialFinding` shape.
  - Add reducer tests for nested items and item-level photos.
  - Keep progress regression tests.

- `frontend/lib/mock-data.ts`
  - Convert mock trial findings to nested item arrays.
  - Attach existing mock photos to specific items.
  - Add mock examples with multiple problems, causes, actions, targets, and item-level photos.

- `frontend/components/trial-finding-card.tsx`
  - Replace single textareas with repeatable sections.
  - Display finding label as `Temuan A`, `Temuan B`, etc.
  - Keep move/delete controls for whole findings.

- `frontend/components/trial-photo-uploader.tsx`
  - Generalize props so uploader can target one nested item.
  - Dispatch item-level add/remove photo actions.

- `frontend/components/trial-report-editor.tsx`
  - Create new findings with one blank problem item, one blank cause item, and one blank corrective action item.
  - Keep status and PIC at finding level.

- `frontend/components/trial-report-print-view.tsx`
  - Render the same official columns.
  - Render numbered lists inside problem/cause/action/target cells.
  - Render photos directly under the item they belong to.

- `frontend/app/globals.css`
  - Add scoped styles for nested item rows, item photo grids, and print cell lists.
  - Keep print output clean at A4 scale.

### Add New Files

- `frontend/components/trial-finding-section-editor.tsx`
  - Shared editor for `Uraian Masalah`, `Penyebab`, and `Langkah Perbaikan`.
  - Handles item add/edit/delete/reorder through callbacks/actions.

Add this file only if it meaningfully reduces repeated component code. If the repeated JSX stays small and clearer inline, keep it inside `trial-finding-card.tsx`.

## 4. Data Model

Update `TrialFinding` to:

```ts
export interface TrialFindingTextItem {
  id: string;
  order: number;
  text: string;
  photos: TrialFindingPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface TrialFindingActionItem {
  id: string;
  order: number;
  text: string;
  targetDate: string;
  photos: TrialFindingPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface TrialFinding {
  id: string;
  order: number;
  problemItems: TrialFindingTextItem[];
  causeItems: TrialFindingTextItem[];
  correctiveActionItems: TrialFindingActionItem[];
  pic: string;
  status: TrialFindingStatus;
  createdAt: string;
  updatedAt: string;
}
```

Remove these fields from new code:

```text
problem
cause
correctiveAction
targetDate
photos
```

## 5. Reducer Actions

Keep existing session and whole-finding actions:

- `CREATE_TRIAL_SESSION`
- `DUPLICATE_TRIAL_SESSION`
- `UPDATE_TRIAL_SESSION`
- `DELETE_TRIAL_SESSION`
- `ADD_TRIAL_FINDING`
- `UPDATE_TRIAL_FINDING`
- `DELETE_TRIAL_FINDING`
- `REORDER_TRIAL_FINDING`

Replace whole-finding photo actions:

- remove `ADD_TRIAL_FINDING_PHOTO`
- remove `REMOVE_TRIAL_FINDING_PHOTO`

Add item actions:

```ts
type TrialFindingSection = "problemItems" | "causeItems" | "correctiveActionItems";

| {
    type: "ADD_TRIAL_FINDING_ITEM";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    section: TrialFindingSection;
    item: TrialFindingTextItem | TrialFindingActionItem;
  }
| {
    type: "UPDATE_TRIAL_FINDING_ITEM";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    section: TrialFindingSection;
    itemId: string;
    updates: Partial<Omit<TrialFindingTextItem, "id" | "photos" | "createdAt">>
      | Partial<Omit<TrialFindingActionItem, "id" | "photos" | "createdAt">>;
  }
| {
    type: "DELETE_TRIAL_FINDING_ITEM";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    section: TrialFindingSection;
    itemId: string;
  }
| {
    type: "REORDER_TRIAL_FINDING_ITEM";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    section: TrialFindingSection;
    itemId: string;
    direction: "up" | "down";
  }
| {
    type: "ADD_TRIAL_FINDING_ITEM_PHOTO";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    section: TrialFindingSection;
    itemId: string;
    photo: { id: string; name: string; previewUrl: string };
  }
| {
    type: "REMOVE_TRIAL_FINDING_ITEM_PHOTO";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    section: TrialFindingSection;
    itemId: string;
    photoId: string;
  }
```

Reducer rules:

- If project, JO, session, finding, section, or item cannot be found, return original `state`.
- Stamp `updatedAt` on edited item, finding, and session.
- Adding an item appends after the current max `order`.
- Deleting an item resequences that section to `1..n`.
- Reordering an item only affects that section.
- Adding/removing photos only affects the targeted item.
- Do not change JO progress logic.

## 6. Task Plan

### Task 0: Preflight

1. Read `AGENTS/AGENTS.md`.
2. Read `AGENTS/AGENT_WORKFLOW.md`.
3. Read `frontend/AGENTS.md`.
4. Read relevant Next.js 16 docs before route edits.
5. Run frontend Git status.
6. Inspect current Trial Report files.
7. Confirm the new design spec is present.

Verification:

```powershell
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend status --short
```

### Task 1: Types And Pure Helpers

1. Update `frontend/lib/types.ts` with nested item types.
2. Update `TrialFinding` to use item arrays.
3. Write failing helper tests in `frontend/lib/trial-report.test.ts`.
4. Add `getTrialFindingLabel(index)` returning `A`, `B`, `C`.
5. Add or update sort helpers for nested trial items.
6. Update `cloneTrialSessionWithoutPhotos` to deeply clone items and clear every nested photo list.
7. Run targeted helper tests and confirm failures before implementation if practical.
8. Implement helper changes.
9. Run targeted helper tests.
10. Run typecheck.
11. Review type changes for old-field references.

Verification:

```powershell
cd frontend
npm.cmd run test -- --run lib/trial-report.test.ts
npm.cmd run typecheck
```

### Task 2: Reducer Item Actions

1. Update `AppAction` in `frontend/lib/store.tsx`.
2. Add focused lookup helpers only if they reduce repeated nested code.
3. Write reducer tests for adding problem items.
4. Write reducer tests for adding cause items.
5. Write reducer tests for adding corrective action items with target dates.
6. Write reducer tests for updating item text and action target dates.
7. Write reducer tests for deleting items and resequencing.
8. Write reducer tests for reordering items up/down and boundary no-ops.
9. Write reducer tests for item-level add/remove photos.
10. Write reducer tests proving missing IDs return the original state object.
11. Implement item action reducers.
12. Remove old whole-finding photo reducer behavior.
13. Keep existing whole-finding reorder/delete behavior.
14. Run targeted reducer tests.
15. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run test -- --run lib/store.test.ts lib/trial-report.test.ts
npm.cmd run typecheck
```

### Task 3: Mock Data Conversion

1. Convert all mock `problem`, `cause`, `correctiveAction`, `targetDate`, and `photos` fields to nested item arrays.
2. Map existing finding-level photos to the first `problemItems` entry.
3. Add at least one mock finding with multiple `Uraian Masalah`.
4. Add at least one mock finding with multiple `Penyebab`.
5. Add at least one mock finding with multiple `Langkah Perbaikan`.
6. Give every corrective action item its own `targetDate`.
7. Attach at least one mock photo to a cause item.
8. Attach at least one mock photo to a corrective action item.
9. Ensure all mock photo paths are local public assets.
10. Run helper/store/progress tests.
11. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run test -- --run lib/store.test.ts lib/progress.test.ts lib/trial-report.test.ts
npm.cmd run typecheck
```

### Task 4: Editor Nested Item UI

1. Update new-finding creation in `trial-report-editor.tsx`.
2. Replace single text fields in `trial-finding-card.tsx` with repeatable sections.
3. Display whole finding labels as `Temuan A`, `Temuan B`, etc.
4. Add `Tambah Uraian Masalah`.
5. Add `Tambah Penyebab`.
6. Add `Tambah Langkah Perbaikan`.
7. Add delete confirmation for each nested item.
8. Add optional nested item reordering if the UI remains clear.
9. Keep whole-finding move/delete controls unchanged.
10. Keep `PIC` and `Status` at finding level.
11. Update `trial-photo-uploader.tsx` for item-level photo targets.
12. Run lint.
13. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run typecheck
```

Manual check:

- Add multiple `Uraian Masalah`.
- Add multiple `Penyebab`.
- Add multiple `Langkah Perbaikan`.
- Add different targets per corrective action.
- Attach photos to different item rows.
- Remove one item photo and confirm other photos remain.

### Task 5: Print View

1. Update `trial-report-print-view.tsx` to use finding letters in the `No` column.
2. Render numbered problem item lists inside the `Uraian Masalah` column.
3. Render numbered cause item lists inside the `Penyebab` column.
4. Render numbered corrective action item lists inside the `Langkah Perbaikan` column.
5. Render target dates in the `Target` column using corrective action numbering.
6. Render photos directly under each specific item.
7. Keep `PIC` and `Status` as one value per finding.
8. Preserve the existing official column order.
9. Run lint.
10. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run typecheck
```

Manual check:

- Print preview keeps the same columns.
- `Temuan A/B/C` labels appear.
- Problem/cause/action item numbering appears inside cells.
- Target numbering matches corrective action numbering.
- Photos appear under the exact item they belong to.

### Task 6: Styling And Responsiveness

1. Add scoped nested editor styles in `frontend/app/globals.css`.
2. Add item row spacing that works with long Indonesian text.
3. Add compact photo grid styling for nested item rows.
4. Add print-specific list/photo styles.
5. Check mobile editor layout for overflow.
6. Check print preview at desktop width.
7. Run lint.
8. Run typecheck.
9. Run production build.

Verification:

```powershell
cd frontend
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

### Task 7: Full Verification

1. Run full Vitest suite.
2. Run lint.
3. Run typecheck.
4. Run production build.
5. Start dev server.
6. Open an existing JO.
7. Open Trial Reports.
8. Create or select a trial session.
9. Add multiple problem items under one finding.
10. Add multiple cause items under one finding.
11. Add multiple corrective action items under one finding.
12. Set different target dates for corrective action items.
13. Upload photos to a problem item.
14. Upload photos to a cause item.
15. Upload photos to a corrective action item.
16. Remove one nested item photo.
17. Duplicate the session and confirm nested photos are not copied.
18. Select one session for print.
19. Open print preview.
20. Inspect print/table columns and nested numbering.
21. Select multiple sessions for print.
22. Open print preview.
23. Review the frontend diff.
24. Confirm no backend, PostgreSQL, localStorage, Excel import/export, or server PDF code was added.

Verification:

```powershell
cd frontend
npm.cmd run test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

Report only checks that actually pass. If browser or print-dialog verification is blocked, state that explicitly.

## 7. Review Checklist

- Trial reports remain frontend-only and in-memory.
- Existing official print/table columns stay in the same order.
- Whole finding labels use letters.
- `Uraian Masalah`, `Penyebab`, and `Langkah Perbaikan` are repeatable independently.
- Every corrective action has its own target date.
- Photos attach to nested items, not the whole finding.
- Duplicating a session clears all nested photos.
- Finding-level `PIC` and `Status` remain unchanged.
- Session status derivation still uses finding status.
- Trial reports still do not affect JO progress.
- Mock data uses only local image paths.
- No relationship selector was added between problem/cause/action items.
- No unrelated dirty worktree changes were reverted.
