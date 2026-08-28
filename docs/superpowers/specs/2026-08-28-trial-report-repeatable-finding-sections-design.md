# Trial Report Repeatable Finding Sections Design

Date: 2026-08-28
Project: MATRIX Project Controlling
Scope: Frontend prototype only, in-memory state
Source feature: `docs/superpowers/specs/2026-08-27-trial-reporting-design.md`

## 1. Purpose

Update the Trial Report module so each `Temuan` can contain multiple `Uraian Masalah`, multiple `Penyebab`, and multiple `Langkah Perbaikan`.

The current prototype stores one text cell each for `Uraian Masalah`, `Penyebab`, and `Langkah Perbaikan`, with one shared photo area at the finding level. Real trial work can require more than one item in each column, and photos often need to be attached to a specific item such as `Uraian Masalah 2` or `Penyebab 1`.

## 2. Approved Direction

Keep the current official Trial Report column positions in the print/table output:

```text
No | Uraian Masalah | Penyebab | Langkah Perbaikan | Target | PIC | Status
```

Change only the content model inside those columns. The editor can remain form/card based, but it should keep the same field order and labels so the screen still matches the printed report structure.

Each `Temuan` uses a letter label:

```text
A, B, C, ...
```

Inside one `Temuan`, users can independently add as many rows/items as needed:

```text
Temuan A

Uraian Masalah
1. ...
2. ...

Penyebab
1. ...
2. ...
3. ...

Langkah Perbaikan
1. ... | Target 1
2. ... | Target 2
```

`Target` belongs to each `Langkah Perbaikan`. If a `Temuan` has three `Langkah Perbaikan`, it has three target values, numbered the same way as the corrective actions.

There is no required strict relationship selector between `Uraian Masalah`, `Penyebab`, and `Langkah Perbaikan`. The user controls the meaning through numbering and the report text.

## 3. Data Model Update

Replace the single text fields on `TrialFinding`:

```text
problem
cause
correctiveAction
targetDate
photos
```

with repeatable item arrays:

```text
problemItems[]
causeItems[]
correctiveActionItems[]
```

Suggested TypeScript shape:

```ts
export interface TrialFindingPhoto {
  id: string;
  name: string;
  previewUrl: string;
  addedAt: string;
}

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

`pic` and `status` remain at the `Temuan` level.

## 4. Editor Behavior

Each finding card still represents one `Temuan`.

Finding numbering changes from numeric display to letter display:

```text
Temuan A
Temuan B
Temuan C
```

Within each finding card:

- `Uraian Masalah` section has item rows numbered `1..n`.
- `Penyebab` section has item rows numbered `1..n`.
- `Langkah Perbaikan` section has item rows numbered `1..n`.
- Each section has its own add button.
- Each row can be edited and deleted.
- Each row can have one or more photos.
- Each `Langkah Perbaikan` row includes its own `Target` date input.
- Moving/deleting a whole `Temuan` keeps existing finding reorder behavior.

Recommended visible controls:

- `Tambah Uraian Masalah`
- `Tambah Penyebab`
- `Tambah Langkah Perbaikan`
- `Tambah Foto` on each item row

Deletion remains confirmation-only.

## 5. Photo Behavior

Photos attach to the specific item row, not to the whole finding.

Examples:

```text
Temuan A / Uraian Masalah 1 / foto
Temuan A / Uraian Masalah 2 / foto
Temuan A / Penyebab 1 / foto
Temuan A / Langkah Perbaikan 3 / foto
```

Rules:

- Each item row can have multiple photos.
- Photos print directly below the item they belong to.
- No photo captions in this version.
- Duplicating a trial session copies all text rows and target dates but does not copy photos.
- Mock data uses local placeholder images only.

## 6. Print Behavior

The official print table keeps the same column order:

```text
No | Uraian Masalah | Penyebab | Langkah Perbaikan | Target | PIC | Status
```

For each `Temuan` row:

- `No` shows `A`, `B`, `C`, etc.
- `Uraian Masalah` cell renders a numbered list and item photos.
- `Penyebab` cell renders a numbered list and item photos.
- `Langkah Perbaikan` cell renders a numbered list and item photos.
- `Target` cell renders target dates numbered to match `Langkah Perbaikan`.
- `PIC` remains one value for the whole `Temuan`.
- `Status` remains one value for the whole `Temuan`.

If `Langkah Perbaikan` item 2 has target `2026-09-05`, the `Target` column should show it as target number 2.

## 7. Migration From Current Prototype Data

Existing mock/current in-memory findings can be mapped safely:

```text
problem -> problemItems[1].text
cause -> causeItems[1].text
correctiveAction -> correctiveActionItems[1].text
targetDate -> correctiveActionItems[1].targetDate
photos -> problemItems[1].photos
```

The photo migration target is a prototype decision. Because existing photos were attached to the whole finding, mapping them to the first `Uraian Masalah` is acceptable for mock data and current in-memory baseline.

## 8. Explicit Non-Goals

This change does not add:

- Laravel/backend persistence
- PostgreSQL schema
- LocalStorage persistence
- Excel import/export
- Server-generated PDF
- Photo captions
- Relationship selector between problem/cause/action items
- Per-action PIC
- Per-item status
- Finding-level print filtering

## 9. Acceptance Criteria

- User can add multiple `Uraian Masalah` inside one `Temuan`.
- User can add multiple `Penyebab` inside one `Temuan`.
- User can add multiple `Langkah Perbaikan` inside one `Temuan`.
- Every `Langkah Perbaikan` has its own target date.
- User can attach/remove photos on each problem, cause, or corrective action item.
- Whole finding labels display as letters in editor and print output.
- Print output keeps the current column order.
- Print output shows item numbering inside each relevant cell.
- Print output shows photos under the exact item they belong to.
- Duplicate session copies item texts and target dates but excludes photos.
- Trial report state remains frontend-only and in-memory.
