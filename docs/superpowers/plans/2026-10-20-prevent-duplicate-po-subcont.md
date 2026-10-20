# Prevent Duplicate PO & Subcont Dispatches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

This implementation plan details the steps to enforce validation rules preventing duplicate PO (Purchase Order) and duplicate Subcont (SC) dispatches across MATRIX backend (Laravel 13) and frontend (Next.js 16).

---

## Proposed Changes & File Architecture

```text
backend/
├── app/Http/Controllers/Api/BulkActionController.php      # [MODIFY] Add 422 validations for duplicate PO and SC
└── tests/Feature/BulkActionDuplicateTest.php              # [NEW] Feature tests for 422 rejection on duplicate dispatches

frontend/
├── lib/po-tracking.ts                                     # [MODIFY] Add `isItemPoSent` pure helper
├── lib/po-tracking.test.ts                                # [MODIFY] Add unit tests for `isItemPoSent`
├── lib/subcont-tracking.ts                                # [MODIFY] Add `isItemSubcontSent` pure helper
├── lib/subcont-tracking.test.ts                           # [MODIFY] Add unit tests for `isItemSubcontSent`
├── lib/store.tsx                                          # [MODIFY] Guard BULK_SEND_PO and BULK_SEND_SUBCONT reducers
├── lib/store.test.ts                                      # [MODIFY] Add reducer tests for duplicate dispatch filtering
├── app/projects/[projectId]/jos/[joId]/page.tsx           # [MODIFY] Modal warnings, filtering, and disabled submit states
└── components/control-table.tsx                           # [MODIFY] Guard single-click row status triggers
```

---

## Tasks

### Task 1: Backend Validation for Duplicate PO Dispatches

**Goal**: In `BulkActionController::bulkSendPo`, reject request with HTTP 422 if any target item already has PO sent (`status === 'Done'` on Material/PO or has existing `poTracking`).

1. **Step 1: Write failing feature test**
   - File: `backend/tests/Feature/BulkActionDuplicateTest.php`
   - Create tests:
     - `test_controller_cannot_send_po_if_any_item_already_has_po()`: Create a project, JO, category, items. For one item, create a PO control with status `Done` and `PoTracking` record. Call `POST /api/jos/{jo}/bulk-send-po` with that item. Assert response status is 422 and JSON contains `already_sent_items`.
     - `test_controller_can_send_po_for_new_items()`: Call `bulk-send-po` with new items. Assert response status is 200.
2. **Step 2: Run test to confirm it fails**
   - Command: `docker exec matrix-backend php artisan test --filter=BulkActionDuplicateTest`
3. **Step 3: Implement validation in `BulkActionController::bulkSendPo`**
   - Inspect items in `$validated['itemIds']` with `controls.poTracking`.
   - Identify items where primary purchase control (`Material` for Part, `PO` for Component) has status `Done` or `poTracking !== null`.
   - If count > 0, return `response()->json([...], 422)`.
4. **Step 4: Run test to confirm it passes**
   - Command: `docker exec matrix-backend php artisan test --filter=BulkActionDuplicateTest`
5. **Step 5: Git commit**
   - Commit: `feat(backend): prevent duplicate bulk po dispatch with 422 validation`

---

### Task 2: Backend Validation for Duplicate Subcont Dispatches

**Goal**: In `BulkActionController::bulkSendSubcont`, reject request with HTTP 422 if any target item has `is_subcont == true` or has an active `In Progress SC` control.

1. **Step 1: Add failing feature test in `backend/tests/Feature/BulkActionDuplicateTest.php`**
   - Create tests:
     - `test_controller_cannot_send_subcont_if_item_already_in_subcont()`: Create item with `is_subcont = true` or `In Progress SC`. Call `POST /api/jos/{jo}/bulk-send-subcont` with that item. Assert status is 422 and response includes `already_sent_items`.
     - `test_controller_can_send_subcont_for_new_items()`: Call `bulk-send-subcont` with eligible items. Assert status is 200.
2. **Step 2: Run test to confirm it fails**
   - Command: `docker exec matrix-backend php artisan test --filter=BulkActionDuplicateTest`
3. **Step 3: Implement validation in `BulkActionController::bulkSendSubcont`**
   - Check if any item in `$validated['itemIds']` has `is_subcont == true` or control with status `In Progress SC`.
   - If count > 0, return `response()->json([...], 422)`.
4. **Step 4: Run test to confirm it passes**
   - Command: `docker exec matrix-backend php artisan test --filter=BulkActionDuplicateTest`
5. **Step 5: Git commit**
   - Commit: `feat(backend): prevent duplicate bulk subcont dispatch with 422 validation`

---

### Task 3: Pure Helper Functions for PO & Subcont Status Detection

**Goal**: Implement and test pure helper functions `isItemPoSent` and `isItemSubcontSent` in frontend utilities.

1. **Step 1: Write unit tests**
   - In `frontend/lib/po-tracking.test.ts`: Test `isItemPoSent(item, categoryKind)`:
     - returns `true` when Part's `Material` control is `Done` or has `poTracking`
     - returns `true` when Component's `PO` control is `Done` or has `poTracking`
     - returns `false` when control is Not Started / In Progress without poTracking
   - In `frontend/lib/subcont-tracking.test.ts`: Test `isItemSubcontSent(item, process)`:
     - returns `true` when `item.isSubcont === true`
     - returns `true` when process control is `In Progress SC`
     - returns `false` when item is not subcont
2. **Step 2: Run tests to confirm failure**
   - Command: `npx vitest run frontend/lib/po-tracking.test.ts frontend/lib/subcont-tracking.test.ts`
3. **Step 3: Implement helpers**
   - File: `frontend/lib/po-tracking.ts`: Export `isItemPoSent(item: Item, categoryKind?: string): boolean`
   - File: `frontend/lib/subcont-tracking.ts`: Export `isItemSubcontSent(item: Item, process?: string): boolean`
4. **Step 4: Run tests to confirm pass**
   - Command: `npx vitest run frontend/lib/po-tracking.test.ts frontend/lib/subcont-tracking.test.ts`
5. **Step 5: Git commit**
   - Commit: `feat(frontend): add isItemPoSent and isItemSubcontSent helper functions`

---

### Task 4: Store Reducer Guarding for PO & Subcont

**Goal**: In `frontend/lib/store.tsx`, ensure `BULK_SEND_PO` and `BULK_SEND_SUBCONT` only modify items that are eligible, preventing duplicate state updates locally.

1. **Step 1: Write failing unit test in `frontend/lib/store.test.ts`**
   - Test that dispatching `BULK_SEND_PO` skips items that already had PO sent.
   - Test that dispatching `BULK_SEND_SUBCONT` skips items that already have `isSubcont === true`.
2. **Step 2: Run test to confirm it fails**
   - Command: `npx vitest run frontend/lib/store.test.ts`
3. **Step 3: Update `frontend/lib/store.tsx`**
   - In `case "BULK_SEND_PO"`: Skip items where `isItemPoSent(item, cat.kind)` is `true`.
   - In `case "BULK_SEND_SUBCONT"`: Skip items where `isItemSubcontSent(item, action.process)` is `true`.
4. **Step 4: Run test to confirm it passes**
   - Command: `npx vitest run frontend/lib/store.test.ts`
5. **Step 5: Git commit**
   - Commit: `feat(frontend): guard store reducers against duplicate po and subcont dispatch`

---

### Task 5: UI Guard & Visual Feedback in JO Detail Page

**Goal**: In `frontend/app/projects/[projectId]/jos/[joId]/page.tsx`, update the Kirim PO and Kirim Subcont modal dialogs to display alert notices for already-sent items, dynamically compute eligible items, and prevent duplicate submission.

1. **Step 1: Implement PO Dialog Guarding**
   - Compute `eligiblePoItems` and `alreadyPoItems` based on `selectedItemIds` and `isItemPoSent`.
   - In Kirim PO modal:
     - If `alreadyPoItems.length > 0`, display a clean warning/notice banner:
       `"{count} part diabaikan karena sudah pernah dikirim PO ({daftar no part})."`
     - Button label updates to reflect actual eligible count: `"Kirim PO ({eligiblePoItems.length} Part)"`.
     - Disable submit button if `eligiblePoItems.length === 0`.
     - Dispatch only `eligiblePoItems.map(i => i.id)`.
2. **Step 2: Implement Subcont Dialog Guarding**
   - Compute `eligibleSubcontItems` and `alreadySubcontItems` based on `selectedItemIds` and `isItemSubcontSent`.
   - In Kirim Subcont modal:
     - If `alreadySubcontItems.length > 0`, display alert banner:
       `"{count} part diabaikan karena sudah aktif di Subcont ({daftar no part})."`
     - Button label reflects actual eligible count: `"Kirim ke Subcont ({eligibleSubcontItems.length} Part)"`.
     - Disable submit button if `eligibleSubcontItems.length === 0`.
     - Dispatch only `eligibleSubcontItems.map(i => i.id)`.
3. **Step 3: Guard single-row triggers in `ControlTable`**
   - In `frontend/components/control-table.tsx`:
     - If `isItemPoSent(item, category.kind)` is true, prevent clicking to trigger `onRequestSendPo`.
     - If `isItemSubcontSent(item, processName)` is true, prevent clicking to trigger `onRequestSendSubcont`.
4. **Step 4: Run frontend tests & lint**
   - Command: `npm --prefix frontend run typecheck`
   - Command: `npx vitest run frontend/lib/po-tracking.test.ts frontend/lib/subcont-tracking.test.ts frontend/lib/store.test.ts`
5. **Step 5: Git commit**
   - Commit: `feat(frontend): add visual alerts and button guards in po and subcont dialogs`

---

### Task 6: End-to-End & Integration Verification

**Goal**: Verify all end-to-end scenarios across backend and frontend containers.

1. **Step 1: Run complete backend test suite**
   - Command: `docker exec matrix-backend php artisan test`
2. **Step 2: Run frontend typecheck and tests**
   - Command: `npm --prefix frontend run typecheck`
   - Command: `npm --prefix frontend test`
3. **Step 3: Verification of live flow**
   - Ensure no regressions across JO detail page, PO Tracker, and Subcont Tracker.
4. **Step 4: Final commit & wrap-up**
   - Commit: `chore: complete duplicate po and subcont dispatch protection`
