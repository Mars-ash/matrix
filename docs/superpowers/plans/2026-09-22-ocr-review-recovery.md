# OCR review recovery and measurement

> Authorized by the user's clarification that blank Excel entries are failed OCR
> and instruction to continue on 2026-09-22. Scope: standalone OCR Lab.

## Deliverables

1. Reproduce and fix truncated-edge regressions without inventing grid rules.
2. Preserve positive R/L quantity pairs, including side order, as text. Keep raw
   recognition unchanged, require review, and count these references in accuracy.
3. Import all eight checked images from the saved Excel workbook into private
   reference JSON with before/after audit and byte-identical backups. Preserve the
   original workbook, source images, and initial extraction artifacts.
4. Extract all sources again using the cached local CPU model. Populate a separate
   review workbook for missing data. Newly generated references remain unchecked;
   only the user's prior Excel review is evidence of human verification.
5. Run ordinary regression tests, lint/format, and model extraction. Measure the
   already checked subset as diagnostic evidence. Report any incomplete corpus,
   coverage, accuracy, or OS no-egress gate honestly; no MATRIX integration.

## Outcome (2026-09-23)

- Existing six edge-stub tests fail before the fix and pass after it; new tests
  cover leading edges and intact thick borders.
- Quantity tests cover exact pair preservation, spacing, invalid/zero/duplicate
  sides, and benchmark denominator/mismatch behavior.
- All 22 source images and the original review workbook matched their saved
  hashes after synchronization and extraction. Original references were backed
  up byte-for-byte before the eight previously reviewed records were imported.
- The new workbook reopens with 22 image records and 437 ordered rows. Seven
  images retain checked status; 14 images have new unchecked drafts; image 7 is
  unchecked until one formula-derived HRC cell is confirmed. The R/L quantity
  pair is preserved as text.
- Local extraction found 15/22 tables (252 rows); seven images still return
  `no_table`. Images 1 and 17 have separately labeled AI visual transcriptions,
  not OCR results.
- The seven-image diagnostic is deterministic but fails release gates:
  42.9% table detection, 20.8% row recall, 35.3% cell accuracy, and no enforced
  OS network-isolation evidence. It is not integration evidence.
- Ordinary suite: 313 passed, 1 deselected. Ruff lint, Ruff format, `pip check`,
  diff whitespace checks, and workbook export/reopen checks passed.

## Remaining review and follow-up

Review the 14 newly populated images row by row against their source drawings,
plus image 7's HRC cell. After corrections, update the private references and
rerun the diagnostic. Separately resolve the strict edge-bleed rejection and
expand checked positive/negative coverage before any release benchmark or MATRIX
integration decision. The missing OCR detections and low accuracy currently
keep the Lab from passing its release gate.
