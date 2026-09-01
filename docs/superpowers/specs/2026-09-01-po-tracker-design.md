# PO Tracker Design

Date: 2026-09-01
Project: MATRIX Project Controlling
Scope: Frontend prototype only, in-memory state

## 1. Purpose

Add a dedicated PO Tracker module for monitoring procurement progress across all Job Orders.

The module should feel and behave like the existing SC Tracker, but it tracks purchasing fields instead of outsourced processing fields. It is intended for Engineering/Procurement visibility over material and component purchase orders before physical arrival.

## 2. Approved Direction

Create a dedicated page:

```text
/po-tracker
```

The page includes both procurement sources:

- Part rows: `Material` process, displayed as `PO Mtl`
- Component rows: `PO` process, displayed as `PO`

This is a new module. Any deleted earlier `po-tracker/page.tsx` should be ignored as prior work and not treated as the source of truth.

## 3. Relationship To SC Tracker

The PO Tracker should reuse the same operational pattern as SC Tracker:

- Portfolio-wide list across all Projects and JOs
- KPI cards
- Search
- Group by all rows, JO, or supplier
- Sort by meaningful procurement dates and identifiers
- Inline editing
- Link back to the related JO/item

Column mapping from SC Tracker:

| SC Tracker | PO Tracker |
|---|---|
| `Proses` | `No. PO` |
| `Delivery` | `PO Date` |
| `Target Arrival` | `Target Arrival` |
| `Supplier` | `Supplier` |
| `Status` | `Status` |
| `Notes` | `Notes` |

## 4. Table Columns

The PO Tracker table columns are:

1. `JO`
2. `Item`
3. `Qty`
4. `Supplier`
5. `No. PO`
6. `PO Date`
7. `Target Arrival`
8. `Status`
9. `Notes`

`Item` should show the item description, item number, and whether the row is `PO Mtl` or `PO`.

## 5. Data Model

Use the existing prototype domain model and add only the smallest procurement detail needed on a process control.

Suggested shape:

```ts
interface PoTracking {
  supplier?: string;
  poNo?: string;
  poDate?: string;
  targetArrival?: string;
  notes?: string;
}
```

Attach this data to the relevant `Control`:

- `control.process === "Material"` for Part PO Mtl rows
- `control.process === "PO"` for Component PO rows

Do not create a generic `PO / Arrival / Subcont` tracker array. That model was rejected and should not be revived.

## 6. Row Collection Rules

The PO Tracker collects rows by scanning all projects, JOs, categories, items, and controls.

Include a row when:

- `control.process` is `Material`
- or `control.process` is `PO`

Exclude:

- `Arrival`
- `Machining`
- `Hardening`
- `Grinding`
- `Wirecut`
- `Assembly`
- Subcont-only fields that are unrelated to PO procurement

Each included row should carry enough references to update the original item/control in the in-memory store:

- project id
- JO id
- category id
- item id
- process name

## 7. Editing Behavior

Inline editable fields:

- `Qty`
- `Supplier`
- `No. PO`
- `PO Date`
- `Target Arrival`
- `Status`
- `Notes`

Status should reuse existing control statuses where practical:

- `-`
- `Not Started`
- `In Progress`
- `Done`
- `Problem`

`In Progress SC` should not be offered in PO Tracker because it belongs to outsourced process tracking.

If the user selects `Problem`, keep the existing required Problem notes behavior.

Updates remain frontend-only and in-memory.

## 8. KPI Cards

Use four compact KPI cards:

1. `Active PO`: rows where status is not `Done`
2. `Mendekati Arrival`: active rows with target arrival from H-3 through Hari H
3. `Overdue`: active rows past target arrival
4. `Done`: rows where status is `Done`

## 9. Deadline Rules

Deadline badges are based on `Target Arrival`.

Show:

- `Overdue Xd` when target arrival is before today
- `Hari H` when target arrival is today
- `H-X` when target arrival is within 3 days

Suppress deadline warnings when the sibling `Arrival` control for the same item is already `Done`.

Reason: once the item has arrived physically, the PO delay risk is no longer active.

## 10. Search, Grouping, Sorting

Search should match:

- JO number
- item number
- item description
- supplier
- PO number
- tracker label (`PO Mtl` or `PO`)

Grouping modes:

- `Semua`
- `Per JO`
- `Per Supplier`

Sorting modes:

- PO date newest first
- Target arrival nearest first
- JO number
- Supplier name
- Qty highest first

## 11. Navigation

Add `PO Tracker` to the main app navigation beside `SC Tracker`.

Rows should link back to the JO detail page and, where possible, jump/highlight the related item row.

Notifications may continue to aggregate PO/material arrival risks as they do today, but this feature does not require a notification redesign.

## 12. Explicit Non-Goals

Do not add:

- backend or Laravel API persistence
- PostgreSQL changes
- localStorage persistence
- photos for PO Mtl or PO
- generic PO/Arrival/Subcont tracker rows
- PO attachment upload
- Excel import/export
- server-generated reports

Do not change:

- JO progress formula
- category progress formula
- SC Tracker behavior, except adding a separate PO Tracker navigation link
- Trial Reports behavior

## 13. Acceptance Criteria

- `/po-tracker` exists and renders inside `AppShell`.
- The page includes both `PO Mtl` and `PO` rows.
- `Material` controls appear as `PO Mtl`.
- `PO` controls appear as `PO`.
- SC Tracker `Proses` concept is replaced by editable `No. PO`.
- SC Tracker `Delivery` concept is replaced by editable `PO Date`.
- Users can edit procurement fields inline.
- Users can edit notes in a dialog.
- Users can group by all, JO, and supplier.
- Users can sort by PO date, target arrival, JO, supplier, and qty.
- Deadline badges appear from target arrival and disappear when sibling `Arrival` is `Done`.
- PO Tracker has no photo UI.
- State remains in-memory only.
- Existing tests, typecheck, lint, and build are verified or reported honestly if blocked.
