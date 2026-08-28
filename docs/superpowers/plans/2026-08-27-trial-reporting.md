# Trial Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Source spec: `docs/superpowers/specs/2026-08-27-trial-reporting-design.md`
Workspace: `C:\laragon\www\matrix`
Frontend app: `frontend/`
Scope: Next.js frontend prototype only, in-memory state, no Laravel API, no PostgreSQL, no localStorage.

## 1. Current Context

MATRIX is a frontend prototype using Next.js 16, React 19, TypeScript, Tailwind CSS v4, and Vitest. The root workspace is not a Git repository. The frontend Git repository is `frontend/`.

Before implementation, read:

- `AGENTS/AGENTS.md`
- `AGENTS/AGENT_WORKFLOW.md`
- `frontend/AGENTS.md`
- The relevant Next.js 16 docs under `frontend/node_modules/next/dist/docs/` before editing route files

Current app conventions:

- App state is React context plus reducer in `frontend/lib/store.tsx`.
- Initial data comes from `frontend/lib/mock-data.ts`.
- Domain types live in `frontend/lib/types.ts`.
- Progress logic lives in `frontend/lib/progress.ts` and must not include trial reports.
- Format/id helpers live in `frontend/lib/format.ts`.
- JO detail route is `frontend/app/projects/[projectId]/jos/[joId]/page.tsx`.
- Existing route pages using app state are client components and unwrap `params` with React `use(params)`.
- Shared buttons, inputs, dialogs, cards, and print styling are mostly CSS classes in `frontend/app/globals.css`.
- Existing process photo upload behavior is in `frontend/components/process-photo-dialog.tsx`.

Worktree warning:

- Preserve unrelated dirty changes.
- Do not run root-level Git commands as if `C:\laragon\www\matrix` is a repo.
- Use:

```bash
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend status --short
```

## 2. Approved Product Behavior

Build a JO-linked Trial Reports feature for die/tooling trial reporting.

Routes:

- Editor: `/projects/[projectId]/jos/[joId]/trial-reports`
- Print preview: `/projects/[projectId]/jos/[joId]/trial-reports/print`

Required behavior:

- User opens Trial Reports from a JO detail page.
- One JO has many trial sessions.
- User creates an empty trial session.
- User duplicates the selected/latest previous trial session.
- Duplicate copies session fields and finding text/status/order, but never copies photos.
- User edits one selected session at a time.
- User adds, edits, deletes, and reorders findings.
- User attaches/removes photos per finding.
- Session status is derived from finding statuses.
- User enters `PIC` and `Approved by` signature names per session.
- User selects one or multiple sessions for print.
- Print preview renders all findings and inline photos for selected sessions.
- Each printed session starts on a new page and has its own signature section.
- Report UI and print output are Indonesian only.
- Refresh may reset state to mock baseline.

Explicit exclusions:

- No Excel import/export.
- No server-generated PDF.
- No Laravel/backend persistence.
- No localStorage persistence.
- No direct database access from Next.js.
- No signature image upload.
- No photo captions.
- No finding-level print filtering.
- No manual page management.
- No revision/history restore.
- No linking findings to JO items/process cells.
- No trial summary/result field.
- No machine, press line, material lot, sample quantity, or customer part number fields.

## 3. File Structure

### Modify Existing Files

- `frontend/lib/types.ts`
  - Add trial report status constants and types.
  - Add `TrialFindingPhoto`, `TrialFinding`, and `TrialSession`.
  - Extend `JO` with `trialSessions?: TrialSession[]`.

- `frontend/lib/store.tsx`
  - Add reducer action types for session, finding, and finding photo mutations.
  - Keep all operations in memory.
  - Add activity entries only if the existing UX benefits from them. Do not make activity logging a blocker for core behavior.

- `frontend/lib/mock-data.ts`
  - Add at least two mock trial sessions to one existing JO.
  - Use realistic Indonesian report content.
  - Use local placeholder image paths only.

- `frontend/lib/store.test.ts`
  - Add reducer tests for trial report mutations.
  - Add a progress regression test proving trial sessions do not affect JO progress.

- `frontend/app/projects/[projectId]/jos/[joId]/page.tsx`
  - Add a `Trial Reports` action in the JO header action area.
  - Keep Activity, Finish JO, bulk actions, search, and process table behavior unchanged.

- `frontend/app/globals.css`
  - Add scoped trial report editor styles.
  - Add scoped print preview and `@media print` rules.
  - Keep print output clean and readable, not dark-themed.

### Add New Files

- `frontend/lib/trial-report.ts`
  - Pure helper functions for trial session naming, status derivation, sorting, and cloning.

- `frontend/lib/trial-report.test.ts`
  - Unit tests for helper functions.

- `frontend/app/projects/[projectId]/jos/[joId]/trial-reports/page.tsx`
  - Dedicated client route for the Trial Reports editor.

- `frontend/app/projects/[projectId]/jos/[joId]/trial-reports/print/page.tsx`
  - Dedicated client route for print preview.

- `frontend/components/trial-report-session-list.tsx`
  - Session selector, print selection, create, duplicate, delete, print action.

- `frontend/components/trial-session-form-dialog.tsx`
  - Small dialog for create/duplicate session prefix and trial date.

- `frontend/components/trial-report-editor.tsx`
  - Main selected-session editor.

- `frontend/components/trial-finding-card.tsx`
  - One finding editor.

- `frontend/components/trial-photo-uploader.tsx`
  - Finding-level photo upload/remove UI.

- `frontend/components/trial-report-print-view.tsx`
  - Print-safe rendering of selected trial sessions.

- `frontend/public/report-placeholder-1.svg`
- `frontend/public/report-placeholder-2.svg`
- `frontend/public/report-placeholder-3.svg`
  - Local neutral placeholder evidence images.

- `frontend/public/company-logo.png`
  - Copy from `logo/LOGO BMI 1200X630.png`.

## 4. Domain Model

Add these types in `frontend/lib/types.ts`:

```ts
export const TRIAL_FINDING_STATUSES = ["On Process", "Close"] as const;
export type TrialFindingStatus = (typeof TRIAL_FINDING_STATUSES)[number];

export interface TrialFindingPhoto {
  id: string;
  name: string;
  previewUrl: string;
  addedAt: string;
}

export interface TrialFinding {
  id: string;
  order: number;
  problem: string;
  cause: string;
  correctiveAction: string;
  targetDate: string;
  pic: string;
  status: TrialFindingStatus;
  photos: TrialFindingPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface TrialSession {
  id: string;
  joId: string;
  name: string;
  trialDate: string;
  updateDate: string;
  customer: string;
  jobNo: string;
  picName: string;
  approvedByName: string;
  findings: TrialFinding[];
  createdAt: string;
  updatedAt: string;
}
```

Extend `JO`:

```ts
trialSessions?: TrialSession[];
```

Helper behavior in `frontend/lib/trial-report.ts`:

- `formatTrialDateSuffix(date: string): string`
  - Input: `YYYY-MM-DD`
  - Output: `ddmmyy`
  - Invalid/empty input should return `""`.

- `buildTrialSessionName(prefix: string, trialDate: string): string`
  - Trim prefix.
  - Append automatic date suffix.
  - If prefix is empty, return suffix only.

- `deriveTrialSessionStatus(session: TrialSession): TrialFindingStatus`
  - Return `On Process` if findings are empty.
  - Return `On Process` if any finding is `On Process`.
  - Return `Close` only when all findings are `Close`.

- `sortTrialFindings(findings: TrialFinding[]): TrialFinding[]`
  - Return a sorted copy by `order`.
  - Do not mutate input.

- `cloneTrialSessionWithoutPhotos(source, overrides): TrialSession`
  - Generate new IDs and timestamps.
  - Copy session text fields unless overridden.
  - Copy findings and statuses.
  - Set every cloned finding `photos` to `[]`.
  - Re-sequence finding order values starting at `1`.

## 5. Reducer Actions

Add action variants to `AppAction`:

```ts
| {
    type: "CREATE_TRIAL_SESSION";
    projectId: string;
    joId: string;
    session: TrialSession;
  }
| {
    type: "DUPLICATE_TRIAL_SESSION";
    projectId: string;
    joId: string;
    sourceSessionId: string;
    session: TrialSession;
  }
| {
    type: "UPDATE_TRIAL_SESSION";
    projectId: string;
    joId: string;
    sessionId: string;
    updates: Partial<Omit<TrialSession, "id" | "joId" | "findings" | "createdAt">>;
  }
| {
    type: "DELETE_TRIAL_SESSION";
    projectId: string;
    joId: string;
    sessionId: string;
  }
| {
    type: "ADD_TRIAL_FINDING";
    projectId: string;
    joId: string;
    sessionId: string;
    finding: TrialFinding;
  }
| {
    type: "UPDATE_TRIAL_FINDING";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    updates: Partial<Omit<TrialFinding, "id" | "photos" | "createdAt">>;
  }
| {
    type: "DELETE_TRIAL_FINDING";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
  }
| {
    type: "REORDER_TRIAL_FINDING";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    direction: "up" | "down";
  }
| {
    type: "ADD_TRIAL_FINDING_PHOTO";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    photo: { id: string; name: string; previewUrl: string };
  }
| {
    type: "REMOVE_TRIAL_FINDING_PHOTO";
    projectId: string;
    joId: string;
    sessionId: string;
    findingId: string;
    photoId: string;
  }
```

Reducer rules:

- If project, JO, session, or finding cannot be found, return original `state`.
- Normalize `jo.trialSessions` to an empty array before push/filter operations.
- Stamp `updatedAt` on sessions and findings when edited.
- Reorder by sorted current order, then reassign sequential `1..n`.
- Deleting a finding also reassigns sequential orders.
- Adding a photo appends `addedAt`.
- Removing a photo only changes that finding's `photos`.
- Do not update progress-related controls.

## 6. Task Plan

### Task 0: Preflight

1. Read root and frontend agent instructions.
2. Read the relevant Next.js 16 docs under `frontend/node_modules/next/dist/docs/` for app routes, `params`, and `searchParams`.
3. Run frontend Git status and note dirty files.
4. Open the source spec and this implementation plan.
5. Confirm `logo/LOGO BMI 1200X630.png` exists.
6. Inspect current reducer, mock data, JO route, dialog, photo dialog, CSS, and tests.

Verification:

```bash
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend status --short
```

### Task 1: Add Trial Report Types And Pure Helpers

1. Add trial report constants and interfaces to `frontend/lib/types.ts`.
2. Extend `JO` with optional `trialSessions`.
3. Create `frontend/lib/trial-report.ts`.
4. Implement `formatTrialDateSuffix`.
5. Implement `buildTrialSessionName`.
6. Implement `deriveTrialSessionStatus`.
7. Implement `sortTrialFindings`.
8. Implement `cloneTrialSessionWithoutPhotos`.
9. Create `frontend/lib/trial-report.test.ts`.
10. Add helper tests for valid date suffix.
11. Add helper tests for empty/invalid date suffix.
12. Add helper tests for prefix plus suffix naming.
13. Add helper tests for date-only naming.
14. Add helper tests for empty, on-process, and all-close session status.
15. Add helper tests proving sort does not mutate input.
16. Add helper tests proving cloned sessions do not copy photos.
17. Run targeted helper tests.
18. Run typecheck.
19. Review the diff for type-only blast radius.

Verification:

```bash
cd frontend
npm run test -- --run lib/trial-report.test.ts
npm run typecheck
```

PowerShell fallback:

```powershell
cd frontend
npm.cmd run test -- --run lib/trial-report.test.ts
npm.cmd run typecheck
```

### Task 2: Extend Store Reducer

1. Add trial action variants to `frontend/lib/store.tsx`.
2. Add local reducer helper lookup functions if they reduce repeated nesting.
3. Implement `CREATE_TRIAL_SESSION`.
4. Implement `DUPLICATE_TRIAL_SESSION`.
5. Implement `UPDATE_TRIAL_SESSION`.
6. Implement `DELETE_TRIAL_SESSION`.
7. Implement `ADD_TRIAL_FINDING`.
8. Implement `UPDATE_TRIAL_FINDING`.
9. Implement `DELETE_TRIAL_FINDING`.
10. Implement `REORDER_TRIAL_FINDING`.
11. Implement `ADD_TRIAL_FINDING_PHOTO`.
12. Implement `REMOVE_TRIAL_FINDING_PHOTO`.
13. Add reducer tests for creating a session.
14. Add reducer tests for duplicating without photos.
15. Add reducer tests for editing session header/signature fields.
16. Add reducer tests for deleting one session.
17. Add reducer tests for adding one finding.
18. Add reducer tests for editing a finding.
19. Add reducer tests for deleting a finding and re-sequencing order.
20. Add reducer tests for moving finding up/down.
21. Add reducer tests for boundary reorder no-ops.
22. Add reducer tests for add/remove finding photos.
23. Add reducer test proving missing IDs return the original state object.
24. Add progress regression test proving `trialSessions` do not change `joProgress`.
25. Run targeted store/progress tests.
26. Run typecheck.
27. Review the diff for accidental changes to manufacturing controls.

Verification:

```bash
cd frontend
npm run test -- --run lib/store.test.ts lib/progress.test.ts lib/trial-report.test.ts
npm run typecheck
```

### Task 3: Add Mock Trial Data And Assets

1. Copy `logo/LOGO BMI 1200X630.png` to `frontend/public/company-logo.png`.
2. Add three local SVG placeholder evidence images under `frontend/public/`.
3. Add at least two trial sessions to one existing JO in `frontend/lib/mock-data.ts`.
4. Use the existing project customer for default `customer`.
5. Use the existing JO number for default `jobNo`.
6. Add several findings per session.
7. Include a mix of `On Process` and `Close`.
8. Attach placeholder photos to some findings.
9. Keep mock text Indonesian and realistic.
10. Run store/progress/helper tests.
11. Run typecheck.
12. Review image paths and ensure there are no external/random URLs.

Verification:

```bash
cd frontend
npm run test -- --run lib/store.test.ts lib/progress.test.ts lib/trial-report.test.ts
npm run typecheck
```

### Task 4: Add JO Detail Entry Point

1. Open `frontend/app/projects/[projectId]/jos/[joId]/page.tsx`.
2. Import `Link` from `next/link` if it is not already imported.
3. Add a `Trial Reports` link in `.jo-detail-meta`.
4. Link to `/projects/${projectId}/jos/${joId}/trial-reports`.
5. Keep Activity and Finish JO controls intact.
6. Check that mobile wrapping remains usable.
7. Run lint.
8. Run typecheck.
9. Review the diff for unrelated header changes.

Verification:

```bash
cd frontend
npm run lint
npm run typecheck
```

Manual check:

- Open an existing JO.
- Confirm `Trial Reports` appears in the header action group.
- Confirm the link navigates to the new route after that route exists.

### Task 5: Build Trial Reports Page Shell

1. Create `frontend/app/projects/[projectId]/jos/[joId]/trial-reports/page.tsx`.
2. Mark it as a client component.
3. Use the same `params` pattern as the JO detail page after confirming current Next docs.
4. Read `projects` from `useAppState()`.
5. Read `dispatch` from `useAppDispatch()`.
6. Find the current project and JO.
7. Call `notFound()` if either ID is invalid.
8. Derive `sessions` from `jo.trialSessions ?? []`.
9. Store selected session ID in component state.
10. Default selected session to the first available session.
11. Keep selection valid after create/delete/duplicate.
12. Store print selected IDs in component state.
13. Render `AppShell` breadcrumbs: Dashboard, Project, JO, Trial Reports.
14. Render JO context: JO number, product, customer, type.
15. Render the session list component.
16. Render empty state when no sessions exist.
17. Render selected-session editor when a session is selected.
18. Run typecheck.
19. Run lint.

Verification:

```bash
cd frontend
npm run typecheck
npm run lint
```

Manual check:

- Valid route loads.
- Invalid project/JO shows not found.
- No-session state is clear and action-oriented.

### Task 6: Build Session Create/Duplicate Dialog

1. Create `frontend/components/trial-session-form-dialog.tsx`.
2. Reuse `Dialog`, `.input`, `.label`, and `.btn` conventions.
3. Accept mode: `create` or `duplicate`.
4. Accept default prefix.
5. Accept default trial date.
6. Show a readonly preview of the generated session name.
7. Let empty prefix produce date-only name.
8. Require a valid trial date before submit.
9. Return prefix and date to the parent.
10. Keep all visible labels Indonesian.
11. Run typecheck.
12. Run lint.

Verification:

```bash
cd frontend
npm run typecheck
npm run lint
```

### Task 7: Build Session List And Session Actions

1. Create `frontend/components/trial-report-session-list.tsx`.
2. Accept project, JO, sessions, selected ID, print selected IDs, and callbacks.
3. Render sessions sorted by trial/update date or insertion order. Use the simplest ordering that matches mock data and does not surprise users.
4. Show session name.
5. Show trial date.
6. Show derived status.
7. Show selected state.
8. Show print selection checkbox for each session.
9. Add `Buat Trial Baru` action.
10. Add `Duplikat Trial Sebelumnya` action.
11. Disable duplicate when no source session exists.
12. Add delete session action.
13. Confirm before deleting a session.
14. If deleting the selected session, select a nearby remaining session.
15. Add `Print Terpilih` action.
16. Disable print when no sessions are selected.
17. Build the print URL with selected session IDs in query params.
18. Use `Link` or router navigation consistently with current app patterns.
19. Run typecheck.
20. Run lint.

Verification:

```bash
cd frontend
npm run typecheck
npm run lint
```

Manual check:

- Create empty trial.
- Duplicate selected/latest trial.
- Confirm duplicated findings have no photos.
- Delete only after confirmation.
- Select multiple sessions for print.

### Task 8: Build Selected Session Editor

1. Create `frontend/components/trial-report-editor.tsx`.
2. Accept project, JO, selected session, and dispatch callbacks.
3. Render session identity header.
4. Render derived session status.
5. Render editable `Hari Trial`.
6. Render editable `Update`.
7. Render editable `Customer`.
8. Render editable `Job . No.`.
9. Render editable `PIC`.
10. Render editable `Approved by`.
11. Prefill new sessions from project/JO data in parent creation logic.
12. Keep fields editable after creation.
13. Render findings sorted by manual order.
14. Add `Tambah Temuan` action.
15. Create a blank finding with next sequential order.
16. Render `TrialFindingCard` for each finding.
17. Keep the editor focused on one selected session.
18. Run typecheck.
19. Run lint.

Verification:

```bash
cd frontend
npm run typecheck
npm run lint
```

Manual check:

- Edit session fields.
- Switch sessions.
- Confirm edits persist in memory during the browser session.

### Task 9: Build Finding Card Editor

1. Create `frontend/components/trial-finding-card.tsx`.
2. Accept session/finding identifiers and callbacks.
3. Display finding number from sorted order.
4. Render status selector with only `On Process` and `Close`.
5. Render `Uraian Masalah` textarea.
6. Render `Penyebab` textarea.
7. Render `Langkah Perbaikan` textarea.
8. Render `Target` date input.
9. Render `PIC` text input.
10. Add move up button.
11. Add move down button.
12. Disable move up on first finding.
13. Disable move down on last finding.
14. Add delete finding button.
15. Confirm before delete.
16. Render `TrialPhotoUploader`.
17. Use stable spacing for long Indonesian text.
18. Avoid cards inside cards.
19. Run typecheck.
20. Run lint.

Verification:

```bash
cd frontend
npm run typecheck
npm run lint
```

Manual check:

- Add several findings.
- Edit long text.
- Move findings and confirm numbering updates.
- Delete a finding and confirm remaining numbers are sequential.

### Task 10: Build Finding Photo Upload UI

1. Create `frontend/components/trial-photo-uploader.tsx`.
2. Reuse the object URL pattern from `ProcessPhotoDialog`.
3. Accept multiple image files.
4. Dispatch `ADD_TRIAL_FINDING_PHOTO` for each file.
5. Reset the file input after upload.
6. Render thumbnails under the finding.
7. Show file names with truncation.
8. Confirm before removing a photo.
9. Revoke object URLs for uploaded blob URLs when removing.
10. Do not revoke local public placeholder paths from mock data.
11. Do not add photo captions.
12. Run typecheck.
13. Run lint.

Verification:

```bash
cd frontend
npm run typecheck
npm run lint
```

Manual check:

- Upload one photo.
- Upload multiple photos.
- Remove one photo.
- Confirm remaining photos stay visible until refresh.

### Task 11: Build Print Preview Route

1. Create `frontend/app/projects/[projectId]/jos/[joId]/trial-reports/print/page.tsx`.
2. Mark it as a client component.
3. Confirm the current Next.js 16 `searchParams` or `useSearchParams` pattern before coding.
4. Find project and JO from app state.
5. Call `notFound()` when IDs are invalid.
6. Parse selected session IDs from the query string.
7. Use an explicit empty state when no IDs are supplied.
8. Filter sessions by selected IDs.
9. Render `AppShell` or a print-specific shell that can hide chrome in print.
10. Add a back link to the editor.
11. Add a `Print` button calling `window.print()`.
12. Render `TrialReportPrintView`.
13. Run typecheck.
14. Run lint.

Verification:

```bash
cd frontend
npm run typecheck
npm run lint
```

Manual check:

- Preview one selected session.
- Preview multiple selected sessions.
- No selected IDs shows a clear empty state.

### Task 12: Build Print View

1. Create `frontend/components/trial-report-print-view.tsx`.
2. Accept project, JO, and selected sessions.
3. Render company logo from `/company-logo.png`.
4. Render report title in Indonesian.
5. Render JO/product/customer context.
6. Render session name.
7. Render `Hari Trial`.
8. Render `Update`.
9. Render `Job . No.`.
10. Render findings in manual order.
11. Render problem, cause, corrective action, target, PIC, and status for each finding.
12. Render inline photos under the correct finding.
13. Bound print image sizes.
14. Render signature section for PIC and Approved by after each session.
15. Start each session on a new printed page.
16. Avoid page breaks inside signature blocks.
17. Keep report text Indonesian.
18. Run typecheck.
19. Run lint.

Verification:

```bash
cd frontend
npm run typecheck
npm run lint
```

Manual check:

- Photos appear under the correct finding.
- Each printed session has its own signatures.
- Printed layout is readable at A4 scale.

### Task 13: Responsive And Print Styling

1. Add scoped editor layout styles to `frontend/app/globals.css`.
2. Add session list layout styles.
3. Add selected editor layout styles.
4. Add finding card styles.
5. Add photo grid styles.
6. Add print preview screen styles.
7. Add `@media print` rules.
8. Hide navigation, buttons, checkboxes, and app chrome in print.
9. Set white print background and black text.
10. Add page break rules for report sessions.
11. Add page break avoidance for finding blocks where practical.
12. Add page break avoidance for signatures.
13. Check mobile layout widths and text wrapping.
14. Check button labels do not overflow.
15. Run lint.
16. Run typecheck.
17. Run build.

Verification:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

Manual check:

- Desktop Trial Reports editor.
- Narrow/mobile Trial Reports editor.
- Desktop print preview.
- Browser print preview.

### Task 14: Full Verification

1. Run full Vitest suite.
2. Run lint.
3. Run typecheck.
4. Run production build.
5. Start dev server.
6. Open dashboard.
7. Open an existing JO.
8. Click `Trial Reports`.
9. Create an empty session.
10. Duplicate a session.
11. Confirm duplicated session has no photos.
12. Edit session fields.
13. Add a finding.
14. Edit a finding.
15. Reorder findings.
16. Delete a finding after confirmation.
17. Upload photos.
18. Remove a photo after confirmation.
19. Select one session for print.
20. Open print preview.
21. Select multiple sessions for print.
22. Open print preview.
23. Use browser print preview and inspect page breaks.
24. Review Git diff.
25. Confirm no unrelated files were reverted.
26. Confirm no secrets or external image URLs were introduced.
27. Confirm trial report state remains frontend-only/in-memory.

Verification:

```bash
cd frontend
npm run test
npm run lint
npm run typecheck
npm run build
npm run dev
```

Report only checks that actually ran successfully. If browser or print verification is blocked, state that clearly.

## 7. Review Checklist

- Trial reports do not affect `joProgress`, `categoryProgress`, or `joProblemCount`.
- No backend framework, ORM, API, PostgreSQL, or localStorage was added.
- No Excel import/export or generated PDF code was added.
- Duplicate session logic excludes photos.
- Session status is derived, not manually stored.
- Finding order is stable and sequential after add/delete/reorder.
- Photo upload state uses object URLs only for newly uploaded local files.
- Mock data uses local placeholder assets.
- UI labels and print report text are Indonesian.
- Print controls do not appear in printed output.
- Each printed trial session starts on a new page.
- Existing JO detail, process table, process photos, subcont tracker, and progress behavior still work.
- Existing dirty worktree changes are preserved.

## 8. Suggested Implementation Order

Implement in this order:

1. Types and pure helpers.
2. Reducer actions and tests.
3. Mock data and assets.
4. JO detail entry point.
5. Trial report editor route.
6. Session list and create/duplicate/delete flow.
7. Session editor and finding editor.
8. Photo upload UI.
9. Print preview route and print view.
10. Responsive/print styling.
11. Full verification and diff review.

Do not start UI work until helper and reducer behavior has passing tests. The UI should consume reducer behavior rather than reimplementing mutation rules locally.
