# PO Tracker Page Design

Date: 2026-09-01
Project: MATRIX Project Controlling
Scope: Frontend prototype only, in-memory state

## 1. Purpose

Add a dedicated `PO Tracker` page for monitoring item-level `PO` and `PO Mtl` work, with behavior similar to the existing `SC Tracker`.

The page solves the problem of checking PO/PO Mtl progress item by item from inside each JO table. It gives users one consolidated tracker view while keeping initial PO input and bulk start actions inside the JO page.

## 2. Approved Direction

Create a dedicated PO Tracker page.

The PO Tracker page uses the same general table structure and workflow style as `SC Tracker`, with these column changes:

- Replace `Proses` with `No. PO`.
- Replace `Delivery` with `Tanggal PO`.

The PO Tracker table columns are:

```text
JO | Item | Qty | Supplier | No. PO | Tanggal PO | Target Arrival | Status | Notes
```

## 3. Source Of Rows

PO Tracker rows come from existing item process controls:

- Part item `Material` process is displayed as `PO Mtl`.
- Component item `PO` process is displayed as `PO`.

Default state:

- New/default `PO Mtl` and `PO` controls start as `Not Started`.
- `Not Started` rows are not shown in PO Tracker.

Tracker visibility:

- When the user starts PO/PO Mtl from the JO page, the status changes to `In Progress`.
- Once status is `In Progress`, `Problem`, or recently `Done`, the item appears in PO Tracker.
- `Done` rows may follow the same temporary visibility pattern as SC Tracker, then archive from the active view.

## 4. Input Ownership

Initial PO/PO Mtl input stays on the JO page.

The intended start flow is:

1. User selects one or more item rows in the JO page.
2. User runs a bulk operation such as `Start PO`.
3. User chooses whether the target process is `PO Mtl` or `PO`, depending on item kind.
4. User fills shared fields once:
   - `No. PO`
   - `Supplier`
   - `Tanggal PO`
   - `Target Arrival`
   - `Notes`
5. System sets each matching selected item process to `In Progress`.
6. Those items automatically appear in PO Tracker.

Users may still edit individual PO details later from the JO page or PO Tracker.

## 5. PO Tracker Page Behavior

The PO Tracker page should support:

- Search by JO, item number, item description, supplier, and PO number.
- Grouping by:
  - All
  - Per JO
  - Per Supplier
- Sorting by:
  - Tanggal PO
  - Target Arrival
  - JO
  - Supplier
  - Qty
- Inline editing for:
  - Qty
  - Supplier
  - No. PO
  - Tanggal PO
  - Target Arrival
  - Status
  - Notes

The page should link each row back to the related JO.

## 6. Status Rules

PO/PO Mtl uses the existing process status values:

- `Not Started`
- `In Progress`
- `Done`
- `Problem`
- `-`

`In Progress SC` is not part of PO Tracker workflow.

`Problem` requires notes, consistent with existing process status behavior.

`Done` means the PO/PO Mtl step is completed. It does not automatically mark `Arrival` as `Done`.

## 7. Arrival Relationship

`PO` / `PO Mtl` and `Arrival` remain separate process controls.

- `PO` / `PO Mtl` tracks the order/purchasing step.
- `Arrival` tracks the physical arrival of material or component.

Changing PO/PO Mtl status does not automatically change Arrival status.

If `Target Arrival` is overdue and the sibling `Arrival` process is not `Done`, the PO Tracker row should show a warning.

## 8. KPI Cards

Use SC Tracker-style KPI cards, adjusted for PO:

- `PO Aktif`
- `Mendekati Arrival`
- `Overdue`
- `Recently Done`

`Recently Done` may use the same short post-completion visibility behavior as SC Tracker.

## 9. Navigation

Add PO Tracker navigation near the existing SC Tracker entry point.

The existing JO page remains the main place to select items and run start/bulk actions.

## 10. Explicit Non-Goals

Do not add:

- Backend persistence
- PostgreSQL changes
- Laravel API endpoints
- localStorage persistence
- PO photo uploads
- Excel import/export
- Supplier master data management
- Quantity split tracking
- Partial arrival tracking
- Approval workflow
- Purchase request workflow

Do not change:

- JO progress formula
- Category progress formula
- SC Tracker behavior
- Trial Report behavior
- Existing process photo behavior

## 11. Prototype Constraints

All data remains frontend-only and in-memory.

Refresh may reset PO Tracker data to mock baseline.

The implementation should reuse existing SC Tracker patterns where practical.

## 12. Acceptance Criteria

- New/default Part `PO Mtl` and Component `PO` controls start as `Not Started`.
- PO Tracker does not show untouched `Not Started` PO/PO Mtl rows.
- JO page provides a bulk operation to start PO/PO Mtl for selected items.
- Bulk start sets matching selected PO/PO Mtl controls to `In Progress`.
- Bulk start records `No. PO`, `Supplier`, `Tanggal PO`, `Target Arrival`, and `Notes`.
- Started PO/PO Mtl items automatically appear in PO Tracker.
- PO Tracker columns are `JO`, `Item`, `Qty`, `Supplier`, `No. PO`, `Tanggal PO`, `Target Arrival`, `Status`, and `Notes`.
- PO Tracker supports search, grouping, sorting, and inline editing similar to SC Tracker.
- PO Tracker row links back to the related JO.
- Overdue `Target Arrival` is visibly warned when sibling `Arrival` is not `Done`.
- `Arrival` remains a separate process control and is not auto-marked by PO changes.
- `Problem` status requires notes.
- No backend, database, localStorage, or PO photos are added.

