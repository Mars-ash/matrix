# Prototype User Suggestion Upgrade Design

> Status: Design approved in conversation; pending written-spec review
> Date: 2026-08-24
> Scope: Frontend prototype upgrade only

## 1. Goal

Upgrade the existing Project Controlling prototype based on user feedback after the prototype review.

This upgrade keeps the current prototype boundary: Next.js frontend only, in-memory browser state only, no Laravel API, no PostgreSQL persistence, and no backend file upload. The purpose is to validate workflow and screen behavior before backend MVP implementation.

## 2. Accepted Direction

Use the complete prototype-tracking approach:

- Keep all changes inside the frontend prototype.
- Add the requested workflow improvements.
- Simulate subcont tracking and process photo evidence in browser state.
- Make the behavior realistic enough for user validation while remaining clearly non-persistent.

## 3. Dashboard New Item Menu

Replace the separate dashboard actions:

- `New Project`
- `New JO`

with one primary action:

- `New Item`

The `New Item` action opens a small menu with three choices:

- `New Project`
- `New JO`
- `New Data`

`New Project` and `New JO` reuse the existing dialogs and behavior.

## 4. New Data Shortcut

`New Data` is a dashboard-level shortcut for manual item entry.

The flow is:

```text
New Item
   -> New Data
      -> Select Project
      -> Select JO
      -> Select Category
      -> Manual item form
      -> Add item to selected category
```

The manual form reuses the same fields as the existing category-level `Add Data` manual form:

- No
- Description
- Dimension
- Material
- Qty
- HRc

Add these fields:

- `Subcont` checkbox
- `Keterangan Subcont`, visible when `Subcont` is checked

Image conversion remains available only from the category-level `Add Data` dialog unless later requested.

## 5. Add New Category on JO Detail

The JO detail page gets an `Add New Category` action at the bottom of the category list.

The dialog contains:

- Category name
- Category kind: `Part` or `Component`

On submit:

- Add the category to the active JO.
- Mark it as custom.
- Use Part process controls for `Part`.
- Use Component process controls for `Component`.
- Add an activity entry.

This reuses the existing category concept already used during JO creation.

## 6. JO Detail Part and Component Search

The JO detail page gets a search control for items inside the current JO.

Searchable fields:

- Item no
- Description
- Dimension
- Material
- Category label

Expected behavior:

- Typing shows matching part/component results.
- Selecting a result scrolls to the relevant category and row.
- The selected row is highlighted temporarily.
- The feature behaves like navigation, not as a table filter.

This matches user feedback that the search should work like the current category jump links but target a specific part/component.

## 7. Subcont Item Marking

Items can be marked as subcont in two places:

- During manual `Add Data`.
- From existing rows in the JO detail table.

When an item is marked as `Subcont`, store:

- `isSubcont`
- `subcontNotes`
- `subcontTrackers`

When unchecked:

- Keep prototype behavior simple: retain any notes/tracker data in memory but hide the tracker UI.

The table shows a compact `Subcont` indicator or toggle per row.

## 8. Subcont Tracker

The `PO`, `Arrival`, and `Subcont` tracker applies only to items marked as `Subcont`.

Tracker fields:

- Tracker key: `PO`, `Arrival`, or `Subcont`
- Status
- Notes

Use the same five prototype statuses:

- `-`
- `Not Started`
- `In Progress`
- `Done`
- `Problem`

Problem notes remain required when status is `Problem`.

The tracker is not part of the existing process-progress denominator unless explicitly redesigned later. For this prototype upgrade, it is supplemental visibility for subcont work.

## 9. Process Photo Evidence

Photos are attached to individual process cells.

Example:

```text
Part: Insert Block A
Process: Machining
Evidence: 2 photos
```

Each process control may store:

- Photo id
- Photo name
- Preview URL
- Added timestamp

Prototype behavior:

- User can add image files from the browser file picker.
- The app creates local preview URLs.
- Thumbnail count or a photo indicator appears in the process cell.
- A dialog/drawer lets the user view attached previews and remove a preview in memory.
- Photos are not uploaded and are lost on refresh.

If camera capture is available on the device, the file input may use image capture hints, but the prototype must not promise production camera/upload support.

## 10. Data Model Changes in Prototype State

Extend `Control`:

```ts
interface Control {
  process: ProcessName;
  status: ControlStatus;
  notes: string;
  photos?: ProcessPhoto[];
}
```

Add:

```ts
interface ProcessPhoto {
  id: string;
  name: string;
  previewUrl: string;
  addedAt: string;
}

type SubcontTrackerKey = "PO" | "Arrival" | "Subcont";

interface SubcontTracker {
  key: SubcontTrackerKey;
  status: ControlStatus;
  notes: string;
}
```

Extend `Item`:

```ts
interface Item {
  id: string;
  no: string;
  description: string;
  dimension: string;
  material: string;
  qty: number;
  hrc: string;
  isSubcont?: boolean;
  subcontNotes?: string;
  subcontTrackers?: SubcontTracker[];
  controls: Control[];
}
```

## 11. Store Actions

Add reducer actions for:

- Add manual item with subcont metadata.
- Update item subcont flag and notes.
- Update subcont tracker status and notes.
- Add process photos.
- Remove process photo.

Existing progress calculation should continue to use only process control statuses and ignore subcont tracker statuses.

## 12. Acceptance Criteria

- Dashboard shows one `New Item` action instead of separate `New Project` and `New JO` buttons.
- `New Item` opens choices for `New Project`, `New JO`, and `New Data`.
- `New Data` can add a manual item into an existing Project, JO, and Category.
- Manual item creation supports `Subcont` and `Keterangan Subcont`.
- JO detail has an item search that scrolls/highlights matching rows.
- JO detail has `Add New Category` at the bottom.
- Existing items can be marked/unmarked as `Subcont`.
- `PO`, `Arrival`, and `Subcont` tracker UI appears only for subcont items.
- Process photo evidence is attached to a specific process cell.
- Photo evidence is visibly local/simulated and does not claim backend upload.
- Existing tests for progress and store behavior still pass.
- Add or update tests for new reducer behavior where practical.
- Frontend typecheck and build pass before completion is claimed.

## 13. Explicit Non-Goals

- No Laravel API changes.
- No PostgreSQL schema changes.
- No authentication changes.
- No backend upload or persistent file storage.
- No real camera integration beyond browser file input hints.
- No OCR/image conversion changes.
- No backend audit trail.

## 14. Backend MVP Notes for Later

If users approve this upgraded prototype, the backend MVP should later decide whether to persist:

- Subcont as item-level metadata or a separate subcontracting record.
- PO, Arrival, and Subcont tracker as item-level tracker rows.
- Process photos as attachment records linked to process controls.
- Activity/history events for subcont changes and photo additions.
