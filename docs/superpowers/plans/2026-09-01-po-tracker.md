# PO Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Workspace: `C:\laragon\www\matrix`
Frontend app: `frontend/`
Spec: `docs/superpowers/specs/2026-09-01-po-tracker-design.md`
Scope: Next.js frontend prototype only, in-memory state, no Laravel API, no PostgreSQL, no localStorage.

## 1. Current Context

Before implementation, read:

- `AGENTS/AGENTS.md`
- `AGENTS/AGENT_WORKFLOW.md`
- `frontend/AGENTS.md`
- `docs/superpowers/specs/2026-09-01-po-tracker-design.md`
- Existing SC Tracker implementation: `frontend/app/subcont/page.tsx`
- Relevant store/domain files listed below

The user approved a new PO Tracker module. Treat any previously deleted `frontend/app/po-tracker/page.tsx` as discarded work.

Current worktree has unrelated dirty/deleted files. Do not revert unrelated work. Do not commit unless the user explicitly asks or the scope is clean and approved.

## 2. Approved Behavior

Create a dedicated route:

```text
/po-tracker
```

The tracker includes both procurement rows:

- `Material` controls from Part categories, displayed as `PO Mtl`
- `PO` controls from Component categories, displayed as `PO`

The page is similar to SC Tracker, but:

- SC `Proses` becomes editable `No. PO`
- SC `Delivery` becomes editable `PO Date`
- PO Tracker has no photo UI

Table columns:

```text
JO | Item | Qty | Supplier | No. PO | PO Date | Target Arrival | Status | Notes
```

## 3. File Structure

Create or modify:

| File | Responsibility |
|---|---|
| `frontend/lib/types.ts` | Define `PoTracking` on `Control` if not already present. |
| `frontend/lib/po-tracking.ts` | Pure helpers for collecting, filtering, sorting, labeling, and deadline calculation. |
| `frontend/lib/po-tracking.test.ts` | Unit tests for PO Tracker pure helpers. |
| `frontend/lib/store.tsx` | Add or normalize `UPDATE_PO_TRACKING` reducer action. |
| `frontend/lib/store.test.ts` | Reducer tests for inline PO field/status/qty/notes updates and guard cases. |
| `frontend/lib/mock-data.ts` | Add enough mock PO Mtl/PO values to make `/po-tracker` useful immediately. |
| `frontend/app/po-tracker/page.tsx` | New PO Tracker route UI. |
| `frontend/components/app-shell.tsx` | Add `PO Tracker` navigation link beside `SC Tracker`. |
| `frontend/app/projects/[projectId]/jos/[joId]/page.tsx` | Keep item jump/highlight behavior working for links from PO Tracker; only change if current route cannot highlight by item query/hash. |
| `frontend/app/globals.css` | Add small reusable styles only if existing table/card styles are insufficient. |

Do not create:

- backend routes/controllers
- database migrations
- localStorage persistence
- photo components for PO Tracker
- generic PO/Arrival/Subcont tracker model

## 4. Task 0: Preflight

1. Read all required instruction/spec files.
2. Run frontend git status:

```powershell
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend status --short
```

3. Confirm `frontend/app/po-tracker/page.tsx` is absent or intentionally recreated.
4. Note existing dirty files and preserve unrelated user changes.
5. Read `frontend/app/subcont/page.tsx` for the SC Tracker pattern.
6. Read `frontend/lib/types.ts`, `frontend/lib/store.tsx`, `frontend/lib/mock-data.ts`, `frontend/components/app-shell.tsx`, and existing PO helper/test files if present.

Deliverable: implementation scope is known, and no unrelated changes are reverted.

## 5. Task 1: Lock Pure PO Tracking Rules With Tests

1. Update `frontend/lib/po-tracking.test.ts`.
2. Add a test that `Material` is recognized as PO tracking and labeled `PO Mtl`.
3. Add a test that `PO` is recognized and labeled `PO`.
4. Add a test that `Arrival` and production processes are excluded.
5. Add a test that row collection includes both Part `Material` controls and Component `PO` controls.
6. Add a test that collected rows include project, JO, category, item, control, process, tracker label, and original index.
7. Add a test that row collection reads `supplier`, `poNo`, `poDate`, `targetArrival`, and `notes` from `control.poTracking`.
8. Add a test that `targetArrival` falls back to `control.targetDate` when `poTracking.targetArrival` is empty.
9. Add search tests for JO number, item no, item description, supplier, PO number, and tracker label.
10. Add sort tests for PO date newest, target arrival nearest, JO number, supplier, and qty.
11. Add deadline tests for `Overdue Xd`, `Hari H`, `H-X`, no target date, invalid date, and sibling `Arrival` done.
12. Run the targeted tests and confirm expected failures before implementation if helpers are missing or incomplete:

```powershell
cd frontend
npm.cmd run test -- --run lib/po-tracking.test.ts
```

13. Implement or normalize `frontend/lib/po-tracking.ts` to pass the tests.
14. Re-run the targeted tests.

Deliverable: pure PO Tracker behavior is tested independently from the UI.

## 6. Task 2: Add Store Support For Inline Editing

1. Update `frontend/lib/store.test.ts` with reducer tests for `UPDATE_PO_TRACKING`.
2. Test updating a `Material` control with supplier, PO number, PO date, target arrival, notes, and status.
3. Test updating a `PO` control with the same fields.
4. Test qty update when a positive qty is provided.
5. Test that invalid/missing project, JO, category, item, or process returns the original state.
6. Test that `Problem` status without notes is rejected.
7. Test that `Problem` status with notes stores problem notes on `control.notes`.
8. Test that non-Problem statuses clear `control.notes` but preserve procurement notes in `control.poTracking.notes`.
9. Test that `In Progress` sets `control.inProgressAt`.
10. Test that the action creates an activity entry that uses `PO Mtl` or `PO` label.
11. Run targeted tests and confirm expected failures before implementation if needed:

```powershell
cd frontend
npm.cmd run test -- --run lib/store.test.ts lib/po-tracking.test.ts
```

12. Add or normalize `PoTracking` in `frontend/lib/types.ts`.
13. Add or normalize `UPDATE_PO_TRACKING` in `frontend/lib/store.tsx`.
14. Re-run targeted tests.
15. Run typecheck:

```powershell
npm.cmd run typecheck
```

Deliverable: store can update procurement fields without backend persistence.

## 7. Task 3: Add Useful Mock PO Data

1. Inspect existing `INITIAL_PROJECTS` in `frontend/lib/mock-data.ts`.
2. Add representative `poTracking` data to several Part `Material` controls.
3. Add representative `poTracking` data to several Component `PO` controls.
4. Include a mix of:
   - missing supplier/PO fields
   - active rows
   - done rows
   - target arrival within H-3
   - target arrival overdue
5. Ensure no internet URLs or file uploads are introduced.
6. Ensure mock changes do not alter JO/category progress rules except through existing control statuses.
7. Run tests:

```powershell
cd frontend
npm.cmd run test -- --run lib/po-tracking.test.ts lib/store.test.ts lib/progress.test.ts
npm.cmd run typecheck
```

Deliverable: PO Tracker has realistic demo data immediately.

## 8. Task 4: Build The `/po-tracker` Page

1. Create `frontend/app/po-tracker/page.tsx`.
2. Follow the existing SC Tracker page structure and `AppShell` usage.
3. Use `useAppState()` to read projects.
4. Use `useAppDispatch()` to dispatch `UPDATE_PO_TRACKING`.
5. Use `collectPoTrackingRows(projects)` to build rows.
6. Add local UI state for:
   - search query
   - group mode: `none`, `jo`, `supplier`
   - sort mode: `newest`, `deadline`, `jo`, `supplier`, `qty`
   - highlighted item id from `?item=`
   - notes dialog row
7. Add KPI cards:
   - `Active PO`
   - `Mendekati Arrival`
   - `Overdue`
   - `Done`
8. Add the toolbar with group buttons, sort select, and search input.
9. Render table columns exactly as approved:

```text
JO | Item | Qty | Supplier | No. PO | PO Date | Target Arrival | Status | Notes
```

10. In `Item`, show description, item number, and `PO Mtl`/`PO`.
11. Make `Qty`, `Supplier`, `No. PO`, `PO Date`, and `Target Arrival` inline editable.
12. Use existing `StatusSelect` with allowed statuses:

```ts
["-", "Not Started", "In Progress", "Done", "Problem"]
```

13. Do not offer `In Progress SC`.
14. Use the existing Problem notes flow from `StatusSelect`.
15. Add a notes dialog for procurement notes.
16. Show deadline badge under `Target Arrival` when helper returns a warning.
17. Link JO back to:

```text
/projects/{projectId}/jos/{joId}?item={itemId}#item-{itemId}
```

18. Add grouped rendering for all rows, per JO, and per supplier.
19. Add empty state copy:

```text
No PO rows
PO rows appear from existing PO Mtl and PO controls.
```

20. Keep layout compact and utilitarian, matching SC Tracker.
21. Run typecheck.

Deliverable: `/po-tracker` renders and supports inline procurement editing.

## 9. Task 5: Add Navigation And Item Jump Support

1. Update `frontend/components/app-shell.tsx`.
2. Add a `PO Tracker` link beside `SC Tracker`.
3. Keep notification behavior unchanged unless a small label/link adjustment is necessary.
4. Inspect JO detail route item-highlight behavior.
5. If needed, ensure it handles `?item={itemId}` and `#item-{itemId}` links from PO Tracker.
6. Avoid broader JO page refactors.
7. Run typecheck.

Deliverable: users can navigate to PO Tracker and jump back to related JO rows.

## 10. Task 6: UI And Accessibility Review

1. Check PO Tracker table at desktop width.
2. Check narrow/mobile width; horizontal table scroll is acceptable.
3. Ensure controls have useful labels, titles, or visible context.
4. Ensure editable inputs do not resize or shift rows unexpectedly.
5. Ensure no text overflow in KPI cards, toolbar, or table cells.
6. Ensure color-only deadline/status signals also include text.
7. Ensure no PO photo UI exists.
8. Compare visual density with SC Tracker.

Deliverable: UI is consistent with the existing operational prototype.

## 11. Task 7: Verification

Run:

```powershell
cd frontend
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Expected notes:

- If lint still fails on pre-existing `react-hooks/set-state-in-effect` issues outside the changed PO Tracker scope, report the exact failures.
- If build fails because `next/font` cannot fetch Google Fonts from `fonts.googleapis.com`, report it as an environmental/network blocker unless implementation introduced the font dependency.

Manual verification:

1. Start dev server:

```powershell
npm.cmd run dev
```

2. Open `/po-tracker`.
3. Confirm both `PO Mtl` and `PO` rows appear.
4. Edit Supplier, No. PO, PO Date, Target Arrival, Qty, Status, and Notes.
5. Select `Problem` and verify notes are required.
6. Group by JO.
7. Group by Supplier.
8. Sort by PO Date, Target Arrival, JO, Supplier, and Qty.
9. Search by JO, item, supplier, PO number, and `PO Mtl`.
10. Confirm deadline badges appear and disappear when sibling `Arrival` is `Done`.
11. Confirm no photo UI appears on the PO Tracker page.
12. Click a JO link and confirm the JO detail item is reachable/highlighted.

Deliverable: implementation is verified, with any blocked checks reported honestly.

## 12. Review Checklist

- `/po-tracker` exists.
- Page is wrapped in `AppShell`.
- Main nav includes `PO Tracker`.
- Part `Material` rows display as `PO Mtl`.
- Component `PO` rows display as `PO`.
- `No. PO` replaces SC Tracker `Proses`.
- `PO Date` replaces SC Tracker `Delivery`.
- `Target Arrival` remains present.
- Inline edits update original in-memory controls.
- `In Progress SC` is not offered.
- `Problem` requires notes.
- Deadline warning suppresses when sibling `Arrival` is `Done`.
- No PO photos or PO attachments are added.
- No backend/database/localStorage is added.
- JO progress and category progress behavior are unchanged except normal existing status effects.
- Trial Reports behavior is untouched.
- Dirty unrelated files are not reverted.
