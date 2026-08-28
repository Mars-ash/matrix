# Prototype User Suggestion Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

## Goal

Implement the approved prototype upgrade from `docs/superpowers/specs/2026-08-24-prototype-user-suggestion-upgrade-design.md`.

This is a frontend-only prototype change. Do not add Laravel API endpoints, migrations, database persistence, authentication, or backend uploads. All new data remains in the existing in-memory React store and is lost on refresh.

## Required Project Context

- Root workspace: `C:\laragon\www\matrix`
- Frontend app: `frontend/`
- Backend app: `backend/`, currently out of scope
- Root workspace is not currently a git repository.
- `frontend/` has its own `.git`, but git commands may need:

```powershell
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend <command>
```

Before editing frontend code, read `frontend/AGENTS.md` and the relevant Next.js 16 docs under `frontend/node_modules/next/dist/docs/` for any App Router/page behavior being changed.

## Verification Commands

Run from `frontend/`:

```powershell
npm run test
npm run typecheck
npm run build
```

If a dev server is needed for browser verification:

```powershell
npm run dev
```

Record only commands that actually pass.

## File Structure and Responsibilities

### Modify

| File | Responsibility |
|---|---|
| `frontend/lib/types.ts` | Add process photo and subcont tracker types; extend `Control` and `Item`. |
| `frontend/lib/category.ts` | Add helper for default `PO`, `Arrival`, and `Subcont` tracker rows. |
| `frontend/lib/store.tsx` | Add reducer actions for subcont metadata, subcont tracker updates, and process photos. |
| `frontend/lib/store.test.ts` | Add reducer tests for new prototype state behavior. |
| `frontend/app/page.tsx` | Replace separate dashboard create buttons with `New Item` menu and wire `New Data`. |
| `frontend/app/projects/[projectId]/jos/[joId]/page.tsx` | Add JO item search, row highlighting, bottom `Add New Category`, and new table callbacks. |
| `frontend/components/add-data-dialog.tsx` | Reuse shared manual item form and support subcont fields for category-level manual entry. |
| `frontend/components/control-table.tsx` | Add Subcont toggle, subcont tracker row/panel, process photo indicators, row anchors, and highlight styling. |
| `frontend/components/status-select.tsx` | Reuse existing Problem notes behavior for process controls and subcont trackers if needed. |
| `frontend/app/globals.css` | Add small utility styles for menu, search result, row highlight, subcont panel, and photo indicator. |

### Create

| File | Responsibility |
|---|---|
| `frontend/components/manual-item-form.tsx` | Shared manual item form used by both `AddDataDialog` and dashboard `New Data`. |
| `frontend/components/new-item-menu.tsx` | Small dashboard menu with `New Project`, `New JO`, and `New Data`. |
| `frontend/components/new-data-dialog.tsx` | Dashboard shortcut flow: select Project, JO, Category, then add manual item. |
| `frontend/components/category-create-dialog.tsx` | Add custom category to an existing JO from JO detail bottom action. |
| `frontend/components/jo-item-search.tsx` | Search current JO items and emit selected result for scroll/highlight. |
| `frontend/components/process-photo-dialog.tsx` | Add/view/remove local image previews attached to one process cell. |
| `frontend/components/process-control-cell.tsx` | Wrap status select plus photo evidence indicator/action for a process cell. |
| `frontend/components/subcont-tracker-panel.tsx` | Render `PO`, `Arrival`, and `Subcont` tracker controls for subcont items only. |

Keep files focused. Do not split unrelated existing layout into new abstractions unless required by the upgrade.

## Implementation Tasks

### Task 1 - Baseline and Next.js Context

1. Read `frontend/AGENTS.md`.
2. Read the relevant local Next.js docs for App Router client pages/components.
3. Run `npm run test` from `frontend/` and record the baseline.
4. Run `npm run typecheck` from `frontend/` and record the baseline.
5. Run `npm run build` from `frontend/` and record the baseline.
6. If a baseline command fails before edits, stop and diagnose whether it is pre-existing or caused by environment.

Deliverable: known clean or documented baseline before code changes.

### Task 2 - Extend Prototype Domain Types and Helpers

1. Add `ProcessPhoto`, `SubcontTrackerKey`, and `SubcontTracker` to `frontend/lib/types.ts`.
2. Extend `Control` with optional `photos`.
3. Extend `Item` with optional `isSubcont`, `subcontNotes`, and `subcontTrackers`.
4. Add `SUBCONT_TRACKERS` constant if useful for typed rendering.
5. Add `defaultSubcontTrackers()` to `frontend/lib/category.ts`.
6. Run `npm run typecheck`.

Deliverable: type model supports subcont and process photos without changing behavior.

### Task 3 - Add Store Behavior with Tests

1. Write failing tests in `frontend/lib/store.test.ts` for adding an item with subcont metadata.
2. Write failing tests for toggling an existing item as subcont.
3. Write failing tests for updating a subcont tracker status and requiring notes for `Problem`.
4. Write failing tests for adding and removing a process photo on a specific process control.
5. Implement new actions in `frontend/lib/store.tsx`:
   - `UPDATE_ITEM_SUBCONT`
   - `UPDATE_SUBCONT_TRACKER`
   - `ADD_PROCESS_PHOTO`
   - `REMOVE_PROCESS_PHOTO`
6. Update `ADD_ITEM` and `ADD_ITEMS_BATCH` to preserve optional subcont metadata.
7. Ensure subcont tracker statuses do not affect progress calculation.
8. Run `npm run test`.
9. Run `npm run typecheck`.

Deliverable: reducer supports all new data behavior with focused tests.

### Task 4 - Extract Shared Manual Item Form

1. Create `frontend/components/manual-item-form.tsx`.
2. Move the existing manual item fields from `AddDataDialog` into the shared form.
3. Add `Subcont` checkbox.
4. Add `Keterangan Subcont` textarea/input shown only when `Subcont` is checked.
5. Keep `Description` required.
6. Keep Enter-to-submit behavior where it does not conflict with textarea input.
7. Update `AddDataDialog` manual mode to use the shared form.
8. Confirm image conversion mode remains unchanged.
9. Run `npm run test`.
10. Run `npm run typecheck`.

Deliverable: existing category-level manual add still works and now supports subcont fields.

### Task 5 - Dashboard New Item and New Data Shortcut

1. Create `frontend/components/new-item-menu.tsx`.
2. Replace dashboard `New Project` and `New JO` buttons with one `New Item` button.
3. Wire menu choices to the existing project and JO dialogs.
4. Create `frontend/components/new-data-dialog.tsx`.
5. Add Project selector.
6. Add JO selector filtered by selected Project.
7. Add Category selector filtered by selected JO.
8. Reuse `ManualItemForm` for the final form.
9. Dispatch `ADD_ITEM` to the selected category with the category kind.
10. Handle empty states: no projects, no JOs, or no categories.
11. Run `npm run test`.
12. Run `npm run typecheck`.

Deliverable: dashboard `New Item -> New Data` can add a manual item into any existing category.

### Task 6 - Add New Category from JO Detail

1. Create `frontend/components/category-create-dialog.tsx`.
2. Implement required category name validation.
3. Add kind selector with `Part` and `Component`.
4. Wire dialog to the existing `ADD_CATEGORY` reducer action.
5. Add bottom action on JO detail after the category list.
6. Ensure the new category renders immediately with the empty state.
7. Run `npm run test`.
8. Run `npm run typecheck`.

Deliverable: existing JO can receive a new custom category after creation.

### Task 7 - JO Item Search Navigation

1. Create `frontend/components/jo-item-search.tsx`.
2. Build a flat searchable list from all current JO categories and items.
3. Match query against item no, description, dimension, material, and category label.
4. Render compact results with category label and item description.
5. On result selection, call back with category id and item id.
6. Add stable DOM ids to category sections and item rows in `ControlTable`.
7. Scroll the selected row into view from JO detail.
8. Store `highlightedItemId` in JO detail state.
9. Clear highlight after a short timeout.
10. Run `npm run typecheck`.

Deliverable: JO search acts as navigation to a specific part/component row, not a table filter.

### Task 8 - Subcont Row UI and Tracker

1. Create `frontend/components/subcont-tracker-panel.tsx`.
2. Add a compact `Subcont` checkbox/toggle column or row control in `ControlTable`.
3. When toggled on, dispatch `UPDATE_ITEM_SUBCONT`.
4. Show a sub-row/panel only for subcont items.
5. Render `PO`, `Arrival`, and `Subcont` tracker controls in that panel.
6. Use the five existing statuses.
7. Require notes when a tracker status is set to `Problem`.
8. Allow editing `Keterangan Subcont`.
9. Add activity messages for subcont flag and tracker changes.
10. Run `npm run test`.
11. Run `npm run typecheck`.

Deliverable: subcont tracker appears only for items marked as subcont and remains separate from progress.

### Task 9 - Process Photo Evidence

1. Create `frontend/components/process-photo-dialog.tsx`.
2. Create `frontend/components/process-control-cell.tsx`.
3. Move each process cell rendering in `ControlTable` through `ProcessControlCell`.
4. Keep existing `StatusSelect` behavior intact.
5. Add photo indicator/count in the process cell.
6. Add local image file input with `accept="image/*"` and camera capture hint where appropriate.
7. Create object URLs in the component and dispatch `ADD_PROCESS_PHOTO`.
8. Render photo previews in the dialog.
9. Support remove preview via `REMOVE_PROCESS_PHOTO`.
10. Revoke object URLs when removing photos and on component cleanup where practical.
11. Make UI copy clear that photos are local prototype evidence and not uploaded.
12. Run `npm run test`.
13. Run `npm run typecheck`.

Deliverable: photo evidence attaches to a specific process control cell and is visibly prototype-local.

### Task 10 - Styling and Responsive Polish

1. Add row highlight styling in `frontend/app/globals.css`.
2. Add compact menu styling if not fully covered by existing button/card styles.
3. Add subcont panel styling.
4. Add photo indicator styling.
5. Check mobile table behavior remains horizontally scrollable.
6. Check text does not overflow buttons, menu choices, or table controls.
7. Run `npm run typecheck`.

Deliverable: the upgraded prototype remains readable and consistent with the existing industrial-control visual style.

### Task 11 - Final Verification and Review

1. Run `npm run test` from `frontend/`.
2. Run `npm run typecheck` from `frontend/`.
3. Run `npm run build` from `frontend/`.
4. Start `npm run dev` if browser verification is needed.
5. Verify dashboard shows `New Item` menu with three choices.
6. Verify `New Data` adds a subcont item to an existing category.
7. Verify JO detail search scrolls and highlights a matching row.
8. Verify `Add New Category` creates an empty custom category at the bottom.
9. Verify existing item can be marked subcont and shows `PO`, `Arrival`, `Subcont` tracker.
10. Verify `Problem` tracker status requires notes.
11. Verify adding a photo to a process cell shows a photo count/preview.
12. Verify refresh clears new data, matching prototype constraints.
13. Inspect the diff for unrelated changes.
14. If git is available for changed files, create a checkpoint commit; if not, record that commit was not possible.

Deliverable: verified prototype upgrade with explicit report of passed checks and any unverified browser paths.

## Completion Criteria

- The implementation matches the approved spec.
- No backend files are changed.
- Existing progress rules remain unchanged.
- Subcont tracker status does not affect JO/category progress.
- Process photos are attached to specific process cells.
- All new state is in-memory only.
- Relevant tests pass.
- Frontend typecheck passes.
- Frontend production build passes.
- Final response reports only verification that actually ran.

