# Simple PO / PO Mtl Item Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Source spec: `docs/superpowers/specs/2026-09-01-simple-po-mtl-item-tracking-design.md`
Workspace: `C:\laragon\www\matrix`
Frontend app: `frontend/`
Scope: Next.js frontend prototype only, in-memory state, no Laravel API, no PostgreSQL, no localStorage.

User instruction: do not commit unless the user explicitly asks for a commit later.

## 1. Current Context

MATRIX is a frontend-only Project Controlling prototype using Next.js 16, React 19, TypeScript, Tailwind CSS v4, and Vitest.

Before implementation, read:

- `AGENTS/AGENTS.md`
- `AGENTS/AGENT_WORKFLOW.md`
- `frontend/AGENTS.md`
- The approved spec above
- Current dirty-worktree status

Current relevant code shape:

- Part categories use process `"Material"` and the table header displays it as `PO Mtl`.
- Component categories use process `"PO"`.
- `Arrival` is already a separate process control.
- `frontend/components/process-control-cell.tsx` renders status, PO/Material start date, Arrival target date, and non-PO process photos.
- `frontend/components/control-table.tsx` renders one `ProcessControlCell` per process cell.
- `frontend/lib/store.tsx` owns process status updates through `UPDATE_STATUS`.
- `UPDATE_STATUS` already rejects `Problem` when notes are empty.
- `frontend/lib/types.ts` already has optional `targetDate`, `notes`, `inProgressAt`, and `photos` on `Control`.
- `frontend/components/app-shell.tsx` already reads deadline data from `Material`, `PO`, and `Arrival` controls.

Worktree warning:

- Preserve existing uncommitted frontend changes, especially Trial Report files.
- Do not rewrite or clean unrelated dirty files.
- Root workspace has Git, and `frontend/` also has Git metadata considerations from prior work. Use the repo's current status before editing.
- Do not commit in this task unless the user explicitly changes the instruction.

## 2. File Structure

### Modify Existing Files

| File | Responsibility |
|---|---|
| `frontend/lib/types.ts` | Add a compact `PoTrackingDetail` type and optional `poTracking` field on `Control`. |
| `frontend/lib/store.tsx` | Add an `UPDATE_PO_TRACKING` reducer action for per-control PO detail updates. |
| `frontend/lib/store.test.ts` | Add reducer tests for per-item PO/PO Mtl tracking and progress regression. |
| `frontend/lib/mock-data.ts` | Add small mock PO/PO Mtl tracking examples to existing JO data. |
| `frontend/components/process-control-cell.tsx` | Render compact PO/PO Mtl summary and open the detail dialog for `PO`/`Material` cells. |
| `frontend/components/app-shell.tsx` | Include PO/PO Mtl tracking target dates in existing deadline notification logic if needed. |
| `frontend/app/globals.css` | Add scoped styles for compact PO summary and dialog layout. |

### Add New Files

| File | Responsibility |
|---|---|
| `frontend/lib/po-tracking.ts` | Pure helpers for PO process detection, summary text, and overdue/deadline calculation. |
| `frontend/lib/po-tracking.test.ts` | Focused tests for PO tracking helper behavior. |
| `frontend/components/po-tracking-dialog.tsx` | Compact dialog for editing status, PO No, Supplier, Target Arrival, and Notes. |

Do not add:

- New route files
- New tracker page
- New table columns
- Backend files
- Persistence files
- Photo upload support for PO/PO Mtl

## 3. Data Model

Add this type in `frontend/lib/types.ts`:

```ts
export interface PoTrackingDetail {
  poNo: string;
  supplier: string;
  targetArrival: string;
  notes: string;
}
```

Extend `Control`:

```ts
export interface Control {
  process: ProcessName;
  status: ControlStatus;
  notes: string;
  photos?: ProcessPhoto[];
  inProgressAt?: string;
  targetDate?: string;
  poTracking?: PoTrackingDetail;
}
```

Rules:

- `Control.status` remains the status source of truth.
- `Control.notes` remains the existing `Problem` notes field.
- `Control.poTracking.notes` is the general PO tracking note and is not limited to `Problem`.
- `Control.poTracking.targetArrival` is the PO/PO Mtl target-arrival date.
- `Arrival` remains a separate `Control` and is not automatically changed by PO tracking updates.

## 4. Reducer Action Design

Add an `AppAction` variant:

```ts
| {
    type: "UPDATE_PO_TRACKING";
    projectId: string;
    joId: string;
    categoryId: string;
    itemId: string;
    process: "PO" | "Material";
    status: ControlStatus;
    problemNotes: string;
    tracking: PoTrackingDetail;
  }
```

Reducer rules:

- If project, JO, category, item, or control is missing, return the original state object.
- If `process` is not `PO` or `Material`, return the original state object.
- If `status` is `Problem` and `problemNotes` is empty after trimming, return the original state object.
- Update only the targeted item and targeted control.
- Set `control.status` from `status`.
- Set `control.notes` to trimmed `problemNotes` only when status is `Problem`; otherwise set it to `""`.
- Set `control.poTracking` from the tracking payload with trimmed text values.
- If status is `In Progress` and `control.inProgressAt` is empty, set it to the current ISO timestamp.
- Do not update the sibling `Arrival` control.
- Add one concise activity entry describing the PO/PO Mtl detail update.

## 5. Helper Design

Create `frontend/lib/po-tracking.ts`.

Suggested helpers:

```ts
export function isPoTrackingProcess(process: string): process is "PO" | "Material";
export function poTrackingLabel(process: "PO" | "Material"): "PO" | "PO Mtl";
export function poTrackingSummary(control: Control): string | null;
export function getPoTrackingDeadline(
  targetArrival: string | undefined,
  arrivalStatus: ControlStatus | undefined,
  today?: Date
): { state: "overdue" | "today" | "soon"; text: string } | null;
```

Rules:

- `poTrackingSummary` should prefer `PO No`, then supplier, then target date.
- Deadline warning appears only when `targetArrival` exists and the item `Arrival` status is not `Done`.
- Pass `today` in tests so date assertions are stable.

## 6. Task Plan

### Task 0: Preflight

1. Read `AGENTS/AGENTS.md`.
2. Read `AGENTS/AGENT_WORKFLOW.md`.
3. Read `frontend/AGENTS.md`.
4. Read the approved PO/PO Mtl spec.
5. Run root Git status.
6. Run frontend Git status if needed.
7. Note dirty files and preserve unrelated changes.
8. Inspect `types.ts`, `store.tsx`, `store.test.ts`, `process-control-cell.tsx`, `control-table.tsx`, `app-shell.tsx`, and `mock-data.ts`.

Verification:

```powershell
git status --short
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend status --short
```

### Task 1: Add PO Tracking Helpers With Tests

1. Create `frontend/lib/po-tracking.test.ts`.
2. Add a test for `isPoTrackingProcess("PO")`.
3. Add a test for `isPoTrackingProcess("Material")`.
4. Add a test proving non-PO processes are rejected.
5. Add a test for labels: `PO` and `PO Mtl`.
6. Add a test for summary with PO No.
7. Add a test for summary fallback to supplier or target date.
8. Add a test for overdue deadline when target date is before `today` and Arrival is not `Done`.
9. Add a test proving no deadline warning appears when Arrival is `Done`.
10. Run the targeted test and confirm it fails because helpers do not exist yet.
11. Create `frontend/lib/po-tracking.ts`.
12. Implement the helpers.
13. Run the targeted helper test.
14. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run test -- --run lib/po-tracking.test.ts
npm.cmd run typecheck
```

### Task 2: Add Types And Reducer Behavior

1. Update `frontend/lib/types.ts` with `PoTrackingDetail`.
2. Add optional `poTracking?: PoTrackingDetail` to `Control`.
3. Update imports in `frontend/lib/store.tsx`.
4. Add the `UPDATE_PO_TRACKING` action type.
5. Add reducer tests in `frontend/lib/store.test.ts` for updating one Part `Material` control as PO Mtl.
6. Add reducer test for updating one Component `PO` control.
7. Add reducer test proving two item rows do not share tracking data.
8. Add reducer test proving `Problem` without notes is rejected.
9. Add reducer test proving `Problem` with notes is accepted.
10. Add reducer test proving `Arrival` is not auto-updated.
11. Add progress regression test proving PO tracking details do not change JO/category progress beyond the existing status weight.
12. Run targeted store tests and confirm expected failures.
13. Implement the reducer action.
14. Run targeted store tests.
15. Run helper tests.
16. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run test -- --run lib/store.test.ts lib/progress.test.ts lib/po-tracking.test.ts
npm.cmd run typecheck
```

### Task 3: Add Mock PO/PO Mtl Detail

1. Open `frontend/lib/mock-data.ts`.
2. Add one realistic PO Mtl tracking example on a Part row.
3. Add one realistic PO tracking example on a Component row.
4. Keep mock data small and readable.
5. Do not add external URLs.
6. Do not add PO photos.
7. Run helper/store/progress tests.
8. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run test -- --run lib/store.test.ts lib/progress.test.ts lib/po-tracking.test.ts
npm.cmd run typecheck
```

### Task 4: Build The PO Tracking Dialog

1. Create `frontend/components/po-tracking-dialog.tsx`.
2. Reuse the existing `Dialog` component.
3. Accept project, JO, category, item, control, and arrival-control context.
4. Render Indonesian labels where the current JO table uses Indonesian operational labels.
5. Render a status selector using existing status choices.
6. Keep `Problem` validation in the dialog before dispatch.
7. Render `PO No`.
8. Render `Supplier`.
9. Render `Target Arrival`.
10. Render general `Notes`.
11. On save, dispatch `UPDATE_PO_TRACKING`.
12. On cancel, close without dispatch.
13. Do not include photo upload controls.
14. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run typecheck
```

### Task 5: Wire The Dialog Into ProcessControlCell

1. Update `frontend/components/process-control-cell.tsx`.
2. Import PO tracking helpers and `PoTrackingDialog`.
3. Add local state for the PO tracking dialog.
4. For `PO` and `Material`, keep the cell compact.
5. For `PO` and `Material`, render existing status plus a small summary line from `poTrackingSummary`.
6. For `PO` and `Material`, render a small detail button or make the summary/button open the dialog.
7. Pass the sibling `Arrival` control status to deadline helper.
8. Show overdue/Hari H/H-n warning when target arrival is due and Arrival is not `Done`.
9. Keep Arrival date input behavior unchanged.
10. Keep process photo behavior disabled for `PO`, `Material`, and `Arrival`.
11. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run typecheck
```

### Task 6: Pass Arrival Context From ControlTable

1. Update `frontend/components/control-table.tsx`.
2. Find each row's `Arrival` control once per item.
3. Pass `arrivalStatus` or the arrival control to `ProcessControlCell`.
4. Keep table headers unchanged.
5. Keep sticky columns and bulk selection unchanged.
6. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run typecheck
```

### Task 7: Update Deadline Notifications If Needed

1. Inspect `frontend/components/app-shell.tsx`.
2. If current notification logic only reads `control.targetDate`, include `control.poTracking?.targetArrival` for `PO` and `Material`.
3. Keep existing Arrival notifications unchanged.
4. Do not introduce a global PO tracker page.
5. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run typecheck
```

### Task 8: Add Scoped Styling

1. Update `frontend/app/globals.css`.
2. Add compact PO summary styles.
3. Add PO warning badge styles.
4. Add dialog field grid styles if existing form styles are not enough.
5. Check button labels wrap cleanly on narrow widths.
6. Do not alter unrelated Trial Report styles.
7. Run typecheck.

Verification:

```powershell
cd frontend
npm.cmd run typecheck
```

### Task 9: Full Verification

1. Run full Vitest suite.
2. Run typecheck.
3. Run lint.
4. Run production build.
5. Start or reuse the dev server if browser verification is needed.
6. Open an existing JO.
7. Edit a Part row `PO Mtl` detail.
8. Confirm the cell shows a compact summary.
9. Edit a Component row `PO` detail.
10. Confirm the detail is stored only on that item.
11. Set `Target Arrival` to an overdue date while `Arrival` is not `Done`.
12. Confirm the PO/PO Mtl cell shows a warning.
13. Set `Arrival` to `Done`.
14. Confirm the warning disappears.
15. Set PO/PO Mtl status to `Problem` without notes and confirm it is blocked.
16. Set PO/PO Mtl status to `Problem` with notes and confirm it saves.
17. Confirm JO/category progress still follows existing status weights.
18. Confirm no new tracker page, backend file, localStorage, or PO photo behavior was added.
19. Review the final diff.
20. Confirm existing dirty Trial Report changes were not reverted.

Verification:

```powershell
cd frontend
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

Report only checks that actually ran successfully. If browser verification is blocked, state that clearly.

## 7. Review Checklist

- PO/PO Mtl tracking is per item row.
- No permanent table columns were added.
- Existing `PO` / `PO Mtl` process cells remain the entry point.
- `PO No`, `Supplier`, `Target Arrival`, and general notes are editable.
- `Problem` still requires problem notes.
- `Arrival` remains a separate control and is not auto-marked.
- Overdue target arrival warns only when Arrival is not `Done`.
- PO tracking details do not create a global PO record.
- No backend, database, localStorage, route, or tracker page was added.
- No PO photo upload behavior was added.
- Existing process photo behavior remains unchanged.
- Existing Subcont and Trial Report behavior remain unchanged.
- Existing dirty files are preserved unless intentionally edited for this task.

