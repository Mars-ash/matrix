# Mobile Ultra-Compact View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

---

## 1. Overview & Context

On mobile screens (< 768px), the current JO control table forces users to scroll in two dimensions (horizontal across 12+ columns and vertical across 20–50 rows). When scrolled vertically, column headers disappear completely, leaving operators unable to identify which process status dropdown they are tapping.

This plan implements an **Ultra-Compact Mobile List with Single-Open Accordion** as the default view on mobile devices, paired with an industrial segmented toggle `[ List | Matriks ]`. Desktop viewports (>= 768px) remain 100% untouched.

### Non-Negotiable Design Constraints
- **Zero AI Slop / No Emojis**: No cartoonish emojis (no emojis like folder, chart, truck, gear, camera, colored dots, etc.). All indicators must use crisp, monochrome vector SVGs (strokeWidth 1.5–2.0) or semantic CSS variable status badges already defined in `globals.css` (`var(--color-status-*)`, `.status-badge`).
- **Design System Consistency**: Use exact MATRIX tokens:
  - Font: `var(--font-sans)` (`DM Sans`), `var(--font-mono)` (`JetBrains Mono` for Part numbers, Qty, and Dimensions).
  - Backgrounds: `var(--color-bg-raised)` (#ffffff), `var(--color-bg-wash)` (#faf9f7), `var(--color-bg-hover)` (#eeedea).
  - Borders: `var(--color-border)` (#d8d5cf), `var(--color-border-subtle)` (#eeedea).
  - Buttons: `.btn`, `.btn-secondary`, `.btn-sm`, `.btn-icon`.
- **Ultra-Compact Ergonomics**:
  - Collapsed row height: ~56px–62px (fits 8–10 parts on a standard 800px mobile viewport).
  - Touch targets for interactive elements (checkbox, status dropdown, chevron, photo button): minimum 44px × 44px padded clickable area.
  - Single-open accordion: expanding Part N automatically collapses Part N-1, preventing vertical page bloat.
  - Sticky table headers: In addition to the compact list, apply `position: sticky; top: 0` to table `<thead>` so that if a user switches to "Matriks" view on mobile, headers never scroll away.

---

## 2. File Structure & Responsibilities

| File Path | Responsibility |
| :--- | :--- |
| `frontend/components/mobile-item-list.tsx` | **NEW**: Component rendering the compact list on mobile viewports. Includes search filter, status filter chips, collapsed row summary, and expanded process status controls. |
| `frontend/components/mobile-item-list.test.tsx` | **NEW**: Unit tests for `MobileItemList` (search filtering, accordion expansion, status change dispatch, selection). |
| `frontend/components/control-table.tsx` | **MODIFIED**: Integrate responsive view toggle (`[ List | Matriks ]`), render `MobileItemList` when in mobile list mode, and apply vertical sticky `<thead>` for table mode. |
| `frontend/app/globals.css` | **MODIFIED**: Add sticky `thead` rules and mobile responsive utility classes for compact cards and segmented controls. |

---

## 3. Step-by-Step Implementation Tasks

### Task 1: Add Sticky Table Header Styles in `globals.css`

Ensure table headers stay visible when scrolling vertically in both desktop and mobile table views.

- **Files to touch:** `frontend/app/globals.css`
- **Steps:**
  1. Add `position: sticky; top: 0; z-index: 10;` to `.control-table thead th`.
  2. Ensure `.th-sticky-no` and `.th-sticky-desc` have `z-index: 15` so intersecting sticky headers (top + left) don't bleed or overlap awkwardly.
  3. Verify with existing tests: `npm run test` in `frontend/`.

---

### Task 2: Create `MobileItemList` Component & Unit Tests (TDD)

Build the dedicated ultra-compact mobile list component.

- **Files to touch:**
  - `frontend/components/mobile-item-list.test.tsx`
  - `frontend/components/mobile-item-list.tsx`
- **Sub-tasks:**
  1. **Write failing unit tests** (`mobile-item-list.test.tsx`):
     - Renders item rows with part number (`font-mono`), description, dimension, and material.
     - Collapsed item displays current active process stage badge (e.g. "Machining: In Progress") and progress count (e.g. "2/6").
     - Clicking an item expands its accordion showing all process controls.
     - Clicking another item collapses the first item (single-open behavior).
     - Search filter filters parts by description, part number, and dimension.
     - Status filter chip ("In Progress", "Problem", etc.) isolates matching parts.
  2. **Implement `MobileItemList` (`mobile-item-list.tsx`)**:
     - Header bar with quick search input and status pills.
     - `MobileItemRow` (collapsed):
       - Checkbox (for Controller role).
       - Left column: `item.no` in `JetBrains Mono`, `item.description` in 600 weight, secondary meta `[dim] · [material] · Qty: [qty]`.
       - Right column: Active process status badge + `2/6` ratio + clean SVG chevron.
     - `MobileItemAccordion` (expanded):
       - Vertical stack of all processes with clear process labels on the left.
       - Reuses `StatusSelect` with existing theme colors.
       - Clean SVG camera icon for photo attachment (no emoji).
       - Controller actions: Edit Part and Delete Part buttons.
  3. **Run Vitest**: Ensure all tests in `mobile-item-list.test.tsx` pass.

---

### Task 3: Integrate View Switcher into `ControlTable`

Connect the mobile list to `ControlTable` with responsive auto-detection and manual toggle.

- **Files to touch:** `frontend/components/control-table.tsx`
- **Steps:**
  1. Add state `mobileViewMode: "list" | "table"` defaulting to `"list"`.
  2. In the category action area (or directly above the table), render a segmented toggle visible only on mobile screens (`@media (max-width: 768px)`):
     ```tsx
     <div className="mobile-view-toggle">
       <button className={mobileViewMode === "list" ? "active" : ""} onClick={() => setMobileViewMode("list")}>
         List
       </button>
       <button className={mobileViewMode === "table" ? "active" : ""} onClick={() => setMobileViewMode("table")}>
         Matriks
       </button>
     </div>
     ```
  3. When screen width < 768px and `mobileViewMode === "list"`, render `<MobileItemList ... />`.
  4. When `mobileViewMode === "table"`, render the standard `<table className="control-table">` with the sticky header styles from Task 1.

---

### Task 4: Responsive Verification & Regression Testing

Verify complete behavior across mobile viewports, automated test suites, and typechecks.

- **Steps:**
  1. Run `npm run typecheck` in `frontend/`.
  2. Run `npm run test` in `frontend/` (ensure all 187+ tests pass).
  3. Run `php artisan test` in `backend/` (ensure backend API remains unaffected).
  4. Test in browser using Chrome/Firefox devtools responsive mode (viewport 375px × 667px and 390px × 844px) via Cloudflare tunnel.

---

## 4. Verification Criteria & Deliverables

- [ ] Desktop layout (> 768px) is 100% pixel-identical to current production layout.
- [ ] Mobile viewport (< 768px) defaults to ultra-compact row view (~60px height per item).
- [ ] No emojis in the interface; all icons are clean SVG strokes consistent with MATRIX.
- [ ] Tapping an item opens its accordion smoothly; opening another item closes the previous one.
- [ ] Changing process status or attaching photos works seamlessly on mobile without horizontal scrolling.
- [ ] All Vitest and PHPUnit tests pass cleanly.
