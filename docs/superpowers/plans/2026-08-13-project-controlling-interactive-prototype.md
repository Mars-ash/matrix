# Project Controlling Interactive Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

## Goal

Build a high-fidelity interactive frontend prototype for management review before implementing Laravel APIs, PostgreSQL persistence, real authentication, OCR, or Supervisor mode.

The prototype must demonstrate the approved Staff Engineering flow:

```text
Dashboard → Project Overview → JO List → JO Detail
```

It uses local mock data, updates in-memory state, and visibly labels Image Conversion as a simulated future feature.

The source of truth is `docs/superpowers/specs/2026-08-13-project-controlling-prototype-design.md`. Do not expand the prototype into a backend implementation.

## Current Repository Baseline

- Workspace root is `C:\laragon\www\MATRIX`.
- `backend/` is an untouched Laravel starter and is out of scope for prototype code.
- No `frontend/` application exists yet.
- The root currently has no Git metadata, so planned commit checkpoints cannot be executed unless Git is initialized externally.
- Workbook source data is `GUIDANCE/CONTROL AS IS.xlsx`; its displayed prototype JO must be `126.110`, never `126.115`.

## Technical Approach

- Create a standalone `frontend/` application using Next.js App Router, React, TypeScript, and Tailwind CSS.
- Use local React state and a mock data module only; do not call a backend/API or add database dependencies.
- Preserve a production-friendly organization: typed domain models, pure calculation utilities, reusable UI components, and page-level composition.
- Use no external UI component library unless it is necessary for an accessible primitive. Prefer native semantic HTML and Tailwind.
- Do not add real upload/OCR packages; the image conversion flow must be a clearly marked simulator.
- Do not add authentication. Render a persistent `Staff Engineering · Demo Mode` label.

## File Structure

| Path | Responsibility |
|---|---|
| `frontend/package.json` | App scripts and frontend dependencies. |
| `frontend/next.config.*` | Next.js configuration. |
| `frontend/tsconfig.json` | Strict TypeScript config. |
| `frontend/tailwind.config.*` or Tailwind v4 CSS setup | Theme tokens and content sources where required. |
| `frontend/app/globals.css` | Color tokens, typography, focus, responsive table styles, and utilities. |
| `frontend/app/layout.tsx` | Metadata, font, global app providers, and shell. |
| `frontend/app/page.tsx` | Dashboard page composition. |
| `frontend/app/projects/[projectId]/page.tsx` | Project overview and JO list. |
| `frontend/app/projects/[projectId]/jos/[joId]/page.tsx` | JO detail page composition. |
| `frontend/app/not-found.tsx` | Usable invalid-route state. |
| `frontend/components/app-shell.tsx` | Sidebar/topbar, breadcrumbs, role/demo label, and navigation. |
| `frontend/components/dashboard-overview.tsx` | Project KPI and exception composition. |
| `frontend/components/project-summary.tsx` | Project header and search/filter controls. |
| `frontend/components/jo-card.tsx` | JO card/list row with type, progress, Problem count, and last activity. |
| `frontend/components/jo-create-dialog.tsx` | Create JO form and category multiselect/custom category flow. |
| `frontend/components/jo-detail-header.tsx` | Detail identity and summary status. |
| `frontend/components/category-section.tsx` | One independently-rendered Part/Component category section. |
| `frontend/components/control-table.tsx` | Responsive item table and process status controls. |
| `frontend/components/status-select.tsx` | The five allowed statuses and state transitions. |
| `frontend/components/problem-notes-dialog.tsx` | Required notes confirmation for a Problem transition. |
| `frontend/components/add-data-dialog.tsx` | Manual Entry vs Image Conversion selection. |
| `frontend/components/manual-entry-form.tsx` | Item form for a Part or Component category. |
| `frontend/components/image-conversion-simulator.tsx` | Simulated upload, editable extraction preview, and confirm flow. |
| `frontend/components/activity-panel.tsx` | Reverse chronological local-history timeline. |
| `frontend/components/progress-bar.tsx` | Accessible progress rendering including `-` state. |
| `frontend/components/status-badge.tsx` | Text + semantic color status representation. |
| `frontend/components/dialog.tsx` | Reusable accessible dialog primitive. |
| `frontend/components/empty-state.tsx` | Empty category and no-result states. |
| `frontend/lib/types.ts` | Prototype domain types, status/type/category constants. |
| `frontend/lib/mock-data.ts` | Project and JO mock data, including `126.110` derived from the workbook. |
| `frontend/lib/progress.ts` | Pure progress, Problem-count, and status-summary calculations. |
| `frontend/lib/category.ts` | Category process mapping and custom-category helpers. |
| `frontend/lib/format.ts` | Date, percentage, and label formatting. |
| `frontend/lib/store.tsx` | React context/reducer for in-memory JOs, items, controls, and activities. |
| `frontend/lib/store.test.ts` | Store actions and state transition tests. |
| `frontend/lib/progress.test.ts` | Progress weights and exclusion edge cases. |
| `frontend/components/*.test.tsx` | Critical component interaction tests. |
| `frontend/README.md` | Run instructions and explicit prototype limitations. |

## Typed Domain Rules

### JO Types

```text
PROGRESSIVE
TANDEM
JIG
WIRECUT SERVICE
MACHINING SERVICE
```

Each JO has exactly one type.

### Categories

Part categories:

```text
PART
PART JIG
PART DIES
PART DIES OP 10
PART DIES OP 20
PART DIES OP 30
PART DIES OP 40
PART DIES OP 50
```

Component categories:

```text
COMPONENT
COMPONENT JIG
COMPONENT DIES
COMPONENT DIES OP 10
COMPONENT DIES OP 20
COMPONENT DIES OP 30
COMPONENT DIES OP 40
COMPONENT DIES OP 50
```

Custom category:

- requires a non-empty display name;
- requires type `Part` or `Component`;
- has its own distinct local id and independent section.

### Item Processes

Part item processes:

```text
Material, Arrival, Machining, Hardening, Grinding, Wirecut, Assembly
```

Component item processes:

```text
PO, Arrival
```

### Control statuses

```text
-
Not Started
In Progress
Done
Problem
```

Weights:

- `Done` = 1.0
- `In Progress` = 0.5
- `Not Started` = 0.0
- `Problem` = 0.0
- `-` = excluded from the denominator

If every control in a JO is `-`, return `null` from the calculation and render `-` in the interface.

When a status changes to `Problem`, require notes before state is committed. Closing/cancelling the notes dialog must leave the previous status unchanged.

## Main Interaction Flows

### Create JO

1. User opens `Create JO` from Dashboard or Project view.
2. User enters JO number and product name.
3. User selects one required type.
4. User selects zero or more categories.
5. If `CUSTOM` is selected, user supplies custom name and category kind.
6. User can save with all selected categories empty.
7. The new JO appears immediately in local state with no applicable progress shown as `-` until an item/control becomes applicable.

### Change a status

1. User changes a status dropdown.
2. A non-Problem status commits immediately and adds a local activity event.
3. Selecting `Problem` opens a notes dialog.
4. Empty notes show an inline error and cannot confirm.
5. Confirming commits the status and notes, recalculates progress/Problem count, and adds activity history.
6. Cancelling retains the previous status.

### Add Data

1. User opens a category's `Add Data` action.
2. User chooses `Manual Entry` or `Image Conversion`.
3. Manual Entry creates one item with item fields and default `-` controls.
4. Image Conversion presents a labelled simulated upload, generated extraction preview, editable rows, and `Confirm Add`.
5. Confirming adds preview rows to that category in local state and records an activity event.

## Implementation Tasks

### Task 1: Frontend scaffold

1. Create the `frontend/` Next.js App Router project with TypeScript and Tailwind CSS.
2. Configure strict type checking, linting, test runner, and build scripts.
3. Add a minimal page test that initially fails if the root Dashboard is absent.
4. Implement the root page placeholder.
5. Run the focused test, typecheck, and production build.
6. Commit checkpoint if Git becomes available.

### Task 2: Typed mock domain and pure calculations

1. Write failing unit tests for all five status weights and an all-`-` JO.
2. Implement status/type/category constants and typed domain interfaces.
3. Implement pure progress, status-count, and Problem-count utilities.
4. Add mixed Part/Component and `Problem` calculation test cases.
5. Build mock data for `Mercedes Tooling Program`, JOs `126.110` through `126.114`, and source-derived data for `126.110`.
6. Verify no mock data displays `126.115` as a JO number.
7. Run the focused unit tests and typecheck.
8. Commit checkpoint if Git becomes available.

### Task 3: In-memory store and prototype actions

1. Write failing reducer/store tests for JO creation, category creation, item addition, status update, Problem notes, and history.
2. Implement a provider/reducer that owns only browser-session state.
3. Implement actions that create JOs with empty categories.
4. Implement an action that rejects a Problem update without notes.
5. Implement actions for manual item additions and simulated conversion batch additions.
6. Implement immutable local activity records in reverse chronological order.
7. Run store tests and typecheck.
8. Commit checkpoint if Git becomes available.

### Task 4: Design system and common UI components

1. Define visual tokens and a responsive layout in global CSS.
2. Implement AppShell, ProgressBar, StatusBadge, Dialog, EmptyState, and visual status labels.
3. Write component tests for status text, color-independent labels, null progress, and keyboard-close dialog behavior.
4. Implement focus-visible, button, field, error, and responsive table styles.
5. Run component tests, typecheck, and build.
6. Commit checkpoint if Git becomes available.

### Task 5: Dashboard and Project navigation

1. Write a failing page/component test for rendering several JOs and the `126.110` card.
2. Implement Dashboard cards/KPIs and the active-Problem exception panel.
3. Implement project route, Project summary, JO list, and search/filter controls.
4. Add links/breadcrumbs to JO Detail.
5. Add loading/no-result visual states appropriate to local data.
6. Verify navigation using browser interaction tests.
7. Run tests, typecheck, and build.
8. Commit checkpoint if Git becomes available.

### Task 6: Create JO and category selection

1. Write failing tests for required type, multi-category selection, empty category save, and custom category validation.
2. Implement the Create JO dialog/form.
3. Implement standard Part/Component multiselect groups and `CUSTOM` details.
4. Add client-side validation messages and accessible labels.
5. Connect successful submission to the in-memory store and direct the user to the new JO.
6. Verify the saved JO shows correct type and independently visible empty category sections.
7. Run tests, typecheck, and build.
8. Commit checkpoint if Git becomes available.

### Task 7: JO detail, category sections, and interactive statuses

1. Write failing tests for the `126.110` detail header, process set per category type, and individual category rendering.
2. Implement JO detail header, type badge, progress, Problem count, category jump links, and activity panel.
3. Implement Part and Component control tables using the correct process columns only.
4. Implement StatusSelect and immediate non-Problem updates.
5. Implement the required-Problem-notes dialog flow, including cancel rollback.
6. Update progress/Problem count/activity without a page refresh.
7. Verify with component and browser interaction tests.
8. Run tests, typecheck, and build.
9. Commit checkpoint if Git becomes available.

### Task 8: Add Data modes

1. Write failing tests for the Add Data choice dialog.
2. Implement Manual Entry form for both Part and Component categories.
3. Verify added Part items receive seven `-` controls and Component items receive two `-` controls.
4. Implement the Image Conversion simulator flow and explicit future-feature label.
5. Build editable extracted row preview and confirm/cancel behavior.
6. Verify confirmed rows appear only in the selected category and update activity/progress locally.
7. Run tests, typecheck, and build.
8. Commit checkpoint if Git becomes available.

### Task 9: Visual QA and stakeholder-demo verification

1. Run the production build and start the frontend locally.
2. Verify Desktop and narrow-screen layouts for Dashboard, Project, JO creation, JO detail, category tables, dialogs, and Activity panel.
3. Confirm management demo path: Dashboard → Project → `126.110` → status change → required Problem note → activity history.
4. Confirm Create JO supports every type, multiple categories, custom Part/Component, and empty save.
5. Confirm Manual Entry and simulated Image Conversion change only browser-session state and make no OCR claim.
6. Verify the page communicates `Staff Engineering · Demo Mode` and includes no Supervisor control or real sign-in implication.
7. Inspect the final diff and run the full test, typecheck, and build commands.
8. Report verified behavior and any unverified items accurately.

## Verification Commands

Run from `frontend/` after the app is created:

```powershell
npm run test
npm run typecheck
npm run build
npm run dev
```

Use the in-app browser to exercise the management-demo flows. Inspect actual visible states rather than assuming CSS/layout works from source alone.

## Completion Criteria

- No server/backend code, migrations, API endpoints, or database writes are introduced.
- Prototype UI is English and clearly marked Staff Engineering demo mode.
- `126.110` is the main demo JO; source JO `126.115` is not displayed as a prototype JO.
- Several dummy JOs are visible and linkable.
- Every approved JO type and standard category is available.
- Custom category requires both name and Part/Component kind.
- JOs can save with selected but empty categories.
- A Part section has seven controls; a Component section has exactly PO and Arrival.
- Status, progress, Problem count, and activity update locally and consistently.
- Problem notes are mandatory; cancellation does not change status.
- Add Data supports Manual Entry and an explicitly simulated Image Conversion flow.
- Tests, typecheck, build, and browser-based smoke verification have actually been run successfully before claiming the prototype complete.

