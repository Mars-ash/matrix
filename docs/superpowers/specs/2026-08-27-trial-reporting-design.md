# Trial Reporting Design

Date: 2026-08-27
Project: MATRIX Project Controlling
Scope: Frontend prototype only, in-memory state

## 1. Purpose

Add a JO-linked Trial Reports feature for die/tooling trial reporting.

The current manual workflow uses an Excel workbook such as `GUIDANCE/Trial Report Dummy.xlsx`. That workbook represents one JO and contains multiple report sheets/trial updates. MATRIX should replace that manual authoring flow by letting users create trial reports inside the app, then print or save them as PDF through a dedicated print preview.

This feature is for reports created after or during die/tooling trials, where the completed die is tested by producing sample parts and recording defects, causes, improvements, targets, PICs, status, and photo evidence.

## 2. Approved Direction

Use a dedicated Trial Reports subpage under each JO instead of adding the full report editor into the existing JO process-control page.

Route shape:

```text
/projects/[projectId]/jos/[joId]/trial-reports
```

Print preview route shape:

```text
/projects/[projectId]/jos/[joId]/trial-reports/print
```

The first version remains frontend-only and stores data in memory, consistent with the current prototype behavior. Refreshing the browser may reset trial report data to mock baseline data.

## 3. Workbook Reference

The Excel reference provides the field baseline:

- `Hari Trial`
- `Update`
- `Job . No.`
- `Halaman`
- `PIC`
- `No`
- `Uraian Masalah`
- `Penyebab`
- `Langkah Perbaikan`
- `Target`
- `Keterangan, Flow Up/Status`

The new UI does not need to clone Excel visually. The report should be easier, more effective, and more professional for both internal and external parties.

## 4. Domain Model

### 4.1 JO Relationship

One JO can have many trial sessions.

```text
Job Order
  Trial Session 1
    Finding 1
    Finding 2
  Trial Session 2
    Finding 1
```

Trial reporting does not affect JO manufacturing progress calculation.

### 4.2 Trial Session

A trial session represents one separate trial event or trial update for one JO.

Fields:

- `id`
- `joId`
- `name`
- `trialDate`
- `updateDate`
- `customer`
- `jobNo`
- `picName`
- `approvedByName`
- `findings`
- `createdAt`
- `updatedAt`

Session status is derived automatically:

- `On Process` if at least one finding is `On Process`
- `Close` if all findings are `Close`

No manual session status field is required.

### 4.3 Trial Session Naming

Session naming is hybrid:

- User may enter a manual prefix.
- Date suffix is automatic in `ddmmyy` format.
- If the user leaves the prefix empty and confirms, the name uses the date only.

Examples:

```text
Trial Lower Arm 240726
240726
```

The exact date source should be the trial date selected by the user.

### 4.4 Finding

Findings are free-form and are not required to link to JO items, categories, or process cells.

Fields:

- `id`
- `order`
- `problem`
- `cause`
- `correctiveAction`
- `targetDate`
- `pic`
- `status`
- `photos`
- `createdAt`
- `updatedAt`

Status values:

- `On Process`
- `Close`

Users can manually reorder findings. Printed numbering follows the manual order.

### 4.5 Photos

Photos are attached at the individual finding/problem row level.

Rules:

- Photos appear inline under each finding in print/PDF output.
- No photo captions in the first version.
- Duplicating a trial session copies text fields and findings, but does not copy photos.
- Prototype mock data should use local placeholder images, not random internet images.

### 4.6 Signatures

Each trial session has its own signature section.

Signature fields:

- `PIC`
- `Approved by`

The trial session `picName` is the main PIC used for the report header and signature section. Finding rows can still have their own `pic` values for action ownership.

Each signature field prints with:

- blank signature space
- name below the signature space

No title/position fields.
No signature image upload in the first version.

## 5. UI Design

### 5.1 JO Detail Entry Point

Add a clear `Trial Reports` action from the JO detail page.

The JO process-control page remains focused on production/process tracking. Trial reporting opens a dedicated page.

### 5.2 Trial Reports Page

The page shows one selected session editor at a time.

Recommended layout:

- Session list/selector
- Create actions
- Print selection actions
- Main selected-session editor

On desktop, the session list may be a sidebar or compact upper panel. On mobile, the session list should stack above the editor.

Actions:

- Create empty trial session
- Duplicate previous trial session
- Select one or more sessions for print
- Print selected sessions
- Delete session with confirmation

### 5.3 Session Editor

The selected session editor contains:

- Header fields from the Excel baseline
- Finding cards/forms
- Manual reorder controls for findings
- Add finding action
- Delete finding with confirmation
- Photo upload/remove per finding, with confirmation for removal
- Signature name fields

Use card/form editing for findings instead of an Excel-like grid.

Reason:

- Long problem/cause/action text is easier to edit.
- Photos fit naturally under each finding.
- Mobile and external-report readability are better.

### 5.4 Finding Card

Each finding card includes:

- Finding number based on manual order
- Status selector: `On Process` or `Close`
- `Uraian Masalah`
- `Penyebab`
- `Langkah Perbaikan`
- `Target`
- `PIC`
- Photos
- Move up/down controls
- Delete button

## 6. Print And PDF Design

Printing uses a dedicated print preview page. Users can print physically or use browser Save as PDF.

Flow:

```text
Trial Reports page
  select one or multiple sessions
  click Print
  open print preview route
  review layout
  click Print
  browser print dialog
```

Rules:

- Users can print one trial session or multiple selected trial sessions.
- All findings from selected sessions are included.
- No finding-level filtering in official print output.
- Each trial session starts on a new printed page.
- Each trial session includes its own signature section after its findings.
- Photos are shown inline under their associated finding.
- Page numbers are automatic; users do not manually manage `Halaman`.
- Report language is Indonesian only.
- Print report includes company logo.

Company logo dependency:

- The user will provide the logo file before implementation.
- If implementation starts before the final logo is available, use a clearly marked local placeholder area and keep the code ready for logo replacement.

## 7. Mock Data

Add demo trial report data for existing mock JO data so the feature is visible immediately.

Mock data should include:

- At least two trial sessions for one JO
- Several findings per session
- A mix of `On Process` and `Close`
- Local placeholder photos on some findings
- Filled signature names

Mock data should be realistic and inspired by the report workbook, but should not require importing the workbook.

## 8. Explicit Exclusions

The first version does not include:

- Excel import
- Excel export
- Server-generated PDF
- Laravel/backend persistence
- LocalStorage persistence
- Digital signature image upload
- Photo captions
- Finding-level print filtering
- Manual page management
- Full revision/history tracking
- Restore deleted findings/photos
- Linking findings to specific JO items/process cells
- Trial summary/result field
- Machine, press line, material lot, sample quantity, or customer part number fields

Delete behavior is confirmation-only. If users delete data, they can recreate or edit it again.

## 9. Future Backend Notes

When moving from prototype to MVP backend, trial reporting should be stored through Laravel and PostgreSQL, not through direct Next.js database access.

Potential backend tables:

- `trial_sessions`
- `trial_findings`
- `trial_finding_photos`

Potential APIs:

- `GET /api/jos/{jo}/trial-sessions`
- `POST /api/jos/{jo}/trial-sessions`
- `PATCH /api/trial-sessions/{session}`
- `DELETE /api/trial-sessions/{session}`
- `POST /api/trial-sessions/{session}/duplicate`
- `POST /api/trial-sessions/{session}/findings`
- `PATCH /api/trial-findings/{finding}`
- `DELETE /api/trial-findings/{finding}`
- `POST /api/trial-findings/{finding}/photos`
- `DELETE /api/trial-finding-photos/{photo}`

Backend authorization, validation, file upload storage, and PDF generation can be designed later.

## 10. Acceptance Criteria

- User can open Trial Reports from a JO detail page.
- User can create an empty trial session.
- User can duplicate the previous trial session without copying photos.
- User can edit one selected session at a time.
- User can add, edit, delete, and reorder findings.
- User can attach/remove photos per finding.
- Session status is derived from finding statuses.
- User can enter signature names for PIC and Approved by.
- User can select one or multiple sessions for print.
- Print preview renders all findings and inline photos.
- Each printed session starts on a new page and ends with its own signature section.
- Report UI and print output are Indonesian only.
- Prototype data remains in-memory.
