# Project Controlling Interactive Prototype Design

> Status: Approved direction; pending written-spec review
> Date: 2026-08-13
> Purpose: Stakeholder validation before backend/API implementation

## 1. Prototype Goal

Create a high-fidelity, clickable frontend prototype for demonstrating the Project Controlling experience to management before the Laravel backend, PostgreSQL schema, and real authentication are implemented.

The prototype is intentionally local and uses in-memory mock data. It must demonstrate UI, navigation, status behavior, progress calculation, category selection, and data-entry flows without persisting data or calling an API.

## 2. Demo Boundaries

Included:

- Staff Engineering mode only.
- English UI labels.
- Dashboard, Project, JO list, and JO detail navigation.
- One Project with several dummy JOs, including JO `126.110` derived from the `126.115` workbook structure.
- Interactive JO creation.
- Interactive category selection.
- Manual data entry for Part and Component categories.
- Simulated image-conversion flow.
- Interactive process status changes, required Problem notes, calculated progress, and visible activity history.

Excluded:

- Laravel REST API and database.
- Real login, user management, and Supervisor read-only mode.
- Real file upload, OCR, GstarCAD parsing, or persistent storage.
- Production authorization, audit guarantees, and multi-user concurrency.

## 3. User and Navigation

The demo operates as Staff Engineering. A small profile label communicates that this is the active demo role.

```text
Dashboard
   ↓
Project Overview
   ↓
JO List
   ↓
JO Detail
   ├── Category sections
   ├── Add Data
   ├── Status updates
   └── Activity history
```

The dashboard can link directly to a JO with an active Problem. Breadcrumbs provide a return path from JO Detail to its Project.

## 4. Mock Data

### Primary Project

- Project name: `Mercedes Tooling Program`
- Customer: `PT. Mercedes`

### Demo JOs

Include enough variety to demonstrate list states:

| JO | Product | Type | Intended state |
|---|---|---|---|
| `126.110` | Upper Die Assembly | PROGRESSIVE | Main detailed example, derived from workbook `126.115`. |
| `126.111` | Bracket Forming Die | TANDEM | In progress, no active Problem. |
| `126.112` | Locator Jig | JIG | Early-stage work. |
| `126.113` | Wirecut Service Set | WIRECUT SERVICE | Compact service-only example. |
| `126.114` | Machining Service Set | MACHINING SERVICE | Compact service-only example with a Problem. |

The original source number `126.115` must not appear as the displayed JO number in the prototype. It remains only as a local source reference.

### Main JO Detail (`126.110`)

Use the existing workbook item data for its initial categories, converting source symbols to prototype statuses:

- `O` becomes `Done`.
- `V` becomes `In Progress`.
- `X` and blank become `Not Started`.
- `-` remains `-`.
- The anomalous source status value `12` is represented in the prototype as a `Problem` with a visible dummy note, not as a status option.

Initial category sections should include at least:

- `PART DIES OP 10`
- `COMPONENT DIES OP 10`

Additional relevant categories may be shown to demonstrate multi-category JOs, provided that data remains clearly dummy.

## 5. JO Type Selection

Every JO has exactly one type, selected from:

- `PROGRESSIVE`
- `TANDEM`
- `JIG`
- `WIRECUT SERVICE`
- `MACHINING SERVICE`

The Create JO form must require a type. Type is displayed as a concise badge on Dashboard, Project, JO List, and JO Detail.

## 6. Category Selection

During JO creation, Staff can select zero or more categories. A JO may be saved with no items in its selected categories.

### Standard Part categories

- `PART`
- `PART JIG`
- `PART DIES`
- `PART DIES OP 10`
- `PART DIES OP 20`
- `PART DIES OP 30`
- `PART DIES OP 40`
- `PART DIES OP 50`

### Standard Component categories

- `COMPONENT`
- `COMPONENT JIG`
- `COMPONENT DIES`
- `COMPONENT DIES OP 10`
- `COMPONENT DIES OP 20`
- `COMPONENT DIES OP 30`
- `COMPONENT DIES OP 40`
- `COMPONENT DIES OP 50`

### Custom category

`CUSTOM` opens two additional fields:

- Custom category name
- Category type: `Part` or `Component`

The name becomes the header of a new independent category section. A custom Part category uses the Part process matrix; a custom Component category uses the Component process matrix.

## 7. Data Categories and Controls

Each selected category is rendered as a distinct section. Categories may be empty.

### Part category

Each item can contain:

- No
- Description
- Dimension
- Material
- Qty
- HRc

The process controls are:

- Material
- Arrival
- Machining
- Hardening
- Grinding
- Wirecut
- Assembly

### Component category

Each item can contain the same identification fields. Only two controls are displayed:

- PO
- Arrival

## 8. Status Behavior and Progress

Every visible control uses exactly these options:

- `-`
- `Not Started`
- `In Progress`
- `Done`
- `Problem`

Weights:

| Status | Weight |
|---|---:|
| Done | 1.0 |
| In Progress | 0.5 |
| Not Started | 0.0 |
| Problem | 0.0 |
| - | Excluded |

The JO progress updates immediately in local state after every status change.

```text
JO progress =
  sum of applicable control weights
  ÷ count of controls whose status is not '-'
  × 100%
```

If no control is applicable, show `-` rather than `0%`.

When `Problem` is selected:

1. Open a dialog requesting notes.
2. Require non-empty notes before saving.
3. Update the control, progress, Problem count, and history on confirmation.
4. Retain the prior status if the dialog is cancelled.

## 9. Add Data Interaction

Each category section shows an `Add Data` action. It opens a choice dialog:

```text
Add Data
├── Manual Entry
└── Image Conversion
```

### Manual Entry

Show a focused form for one item, with the applicable fields and default process statuses. On confirm, add the item to the category in local state and recalculate progress.

### Image Conversion (Simulated)

The prototype must clearly label this as a preview of a future feature. The flow is clickable but no actual OCR occurs:

```text
Select image (simulated)
   ↓
Extracted table preview
   ↓
Edit/correct rows
   ↓
Confirm Add
```

The preview uses a small, believable extracted-data table with editable cells. Confirming adds those rows to the current category in local state. It must never claim that a real image was processed.

## 10. Screen Design

### Dashboard

- Prominent overview title and Staff Engineering demo label.
- Project card for `Mercedes Tooling Program`.
- JO cards/list rows with type badge, progress, Problem count, last activity, and concise category summary.
- Exception panel for JOs with active Problems.
- `Create JO` action.

### Project Overview / JO List

- Project identity and customer.
- Search/filter by JO number, type, and Problem state.
- Group JOs by product only when it aids scanning; do not create a new aggregation model.
- Create JO dialog with required JO number, product, type, and optional category multiselect.

### JO Detail

- Breadcrumb to the Project.
- Header with JO number, product, type, progress, Problem count, and last update.
- Category chips to jump among sections.
- Separate sections for every selected category.
- A sticky or otherwise persistent summary on large screens without obstructing the data table.
- Each process cell uses a readable status badge/dropdown, never legacy `O/V/X` symbols.
- An Activity panel shows local status/data events in reverse chronological order.

### Visual Language

- Modern industrial control center rather than a spreadsheet copy.
- Clear hierarchy, intentional whitespace, compact but legible tables.
- Status is communicated with text and color:
  - neutral gray: `-`
  - blue: `Not Started`
  - amber: `In Progress`
  - green: `Done`
  - red: `Problem`
- Responsive layout, keyboard-focus styles, semantic buttons, labels, and dialogs.

## 11. Prototype Acceptance Criteria

- A management reviewer can navigate Dashboard → Project → JO Detail without assistance.
- The prototype displays several dummy JOs and uses `126.110` as its main JO.
- Staff can create a new JO, choose exactly one type, choose multiple categories, and save while categories are empty.
- Custom category requires a name and Part/Component type.
- Each category is rendered independently in JO Detail.
- Add Data supports Manual Entry and simulated Image Conversion.
- Manual additions and simulated conversion additions appear immediately in the correct category.
- Status changes update progress and Problem count immediately.
- Problem cannot be saved without notes.
- Activity history reflects interactions during the current browser session.
- The app visibly identifies image conversion as simulated/future functionality.
- No backend, database, real OCR, or real authentication is required for the demo.

## 12. Transition After Stakeholder Review

After UI approval, promote accepted prototype concepts into the existing backend MVP plan:

- Persist JO type and category selection.
- Support category-specific Part/Component records.
- Preserve the established status/progress rules and Problem history.
- Replace in-memory functions with Laravel API calls.
- Add Supervisor authorization and real audit trail.
- Implement actual image conversion only as a later separately designed feature.

