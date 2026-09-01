# Simple PO / PO Mtl Item Tracking Design

Date: 2026-09-01
Project: MATRIX Project Controlling
Scope: Frontend prototype only, in-memory state

## 1. Purpose

Add simple per-item tracking for `PO` and `PO Mtl` without introducing a separate tracker page or widening the JO process table.

The current process table already has:

- `PO Mtl` / `Material` for Part rows
- `PO` for Component rows
- `Arrival` as a separate process column

This design keeps that structure and adds lightweight detail fields behind the existing `PO` / `PO Mtl` cell.

## 2. Approved Direction

Use the existing `PO` / `PO Mtl` process cell as the control point.

When a user clicks the cell, open a compact detail dialog or panel for that item and process. The detail is saved per item row, not shared across multiple items.

The cell remains visually compact in the table.

## 3. Data Ownership

Tracking is per item.

Each Part item may store PO Mtl tracking detail.

Each Component item may store PO tracking detail.

The tracking detail belongs to the item row and does not create a global PO object.

## 4. Fields

The simple tracking detail contains:

- `Status`
- `PO No`
- `Supplier`
- `Target Arrival`
- `Notes`

`Status` uses the existing process statuses:

- `Done`
- `In Progress`
- `Not Started`
- `Problem`
- `-`

`Problem` keeps the existing behavior where notes are required.

## 5. Table Behavior

The JO table should not gain permanent extra columns for `PO No`, `Supplier`, or `Target Arrival`.

The cell display should stay compact and show only useful summary information, for example:

```text
In Progress
PO-0012 - Target 2026-09-12
```

If `Target Arrival` is overdue and the item `Arrival` process is not `Done`, the cell should show a warning state.

## 6. Arrival Relationship

`PO` / `PO Mtl` and `Arrival` remain separate controls.

- `PO` / `PO Mtl` means the purchasing or material-order process is being tracked.
- `Arrival` means the material or component has physically arrived.

Changing `PO` / `PO Mtl` does not automatically mark `Arrival` as `Done`.

## 7. Explicit Non-Goals

Do not add:

- A new global PO tracker page
- A new large tracker table
- Shared PO records across multiple items
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
- Subcont tracker behavior
- Trial Report behavior
- Existing process photo behavior

## 8. Prototype Constraints

All data remains frontend-only and in-memory.

Refresh may reset PO / PO Mtl tracking data to mock baseline.

The implementation should reuse existing process-cell patterns, status handling, dialogs, and styling conventions.

## 9. Acceptance Criteria

- User can edit simple PO Mtl tracking detail for a Part item.
- User can edit simple PO tracking detail for a Component item.
- Tracking is stored per item row.
- The JO table remains compact and does not add permanent PO detail columns.
- The PO / PO Mtl cell shows status and optional summary detail.
- Overdue `Target Arrival` is visibly warned when `Arrival` is not `Done`.
- `Arrival` remains a separate process control.
- `Problem` status still requires notes.
- JO and category progress calculations continue to use existing process status rules.
- No backend, database, localStorage, or global tracker page is added.
