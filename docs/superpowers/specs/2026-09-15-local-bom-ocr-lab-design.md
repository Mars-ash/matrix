# Local BOM Image OCR Lab Design

Date: 2026-09-15

Project: MATRIX Project Controlling

Status: Approved

## 1. Decision Summary

MATRIX will validate a local, CPU-only OCR pipeline for engineering BOM table
images before integrating it into the Laravel and Next.js application.

The immediate deliverable is an independent OCR Lab. It reads only PNG, JPG,
and JPEG images. It does not accept PDFs, write to the MATRIX database, alter
current MATRIX UI behavior, call Gemini by default, or require a discrete GPU.

The local OCR engine becomes the future default only after it passes the
benchmark defined here. Gemini remains a later Controller-only, explicitly
confirmed fallback. A source image must never be sent to Gemini automatically.

The agreed sequence is:

~~~
prove image OCR quality and laptop performance
    ->
prove safe review behavior
    ->
integrate a known-good local service into MATRIX
~~~

## 2. Problem

The existing Image Conversion flow accepts an engineering BOM table image and
expects item rows with these fields:

~~~
No | Description | Dimension | Material | Qty | HRC | optional Remark
~~~

The current Laravel OcrService submits the image to Gemini Vision when an API
key is available. When unavailable, it returns static demonstration rows. That
is appropriate for a prototype but is not trusted extraction because it:

- depends on an external API, quota, latency, and credential;
- can send internal drawings outside the local machine;
- can make static example rows look like extraction results;
- gives no measured proof of accuracy for the actual MATRIX BOM format.

The supplied inputs are cropped ruled tables, not arbitrary CAD drawings or
PDFs. They have clear magenta grids, a repeated column structure, English or
Latin technical text, and relatively consistent fonts. A lightweight,
table-first local pipeline is therefore a better starting point than a general
vision model.

## 3. User, Privacy, and Authority

### Primary workflow

A Controller uploads one BOM table image while adding items to a MATRIX
category. The user must inspect and correct the extracted rows before any
MATRIX item is created.

### Privacy rules

- Treat drawings, BOM content, customer information, and OCR output as
  internal.
- Keep private source images, ground truth, generated overlays, and benchmark
  reports out of Git.
- Do not log image bytes, API keys, or full document text.
- The standalone Lab never sends an input image to a network service during
  extraction. Model binaries may be obtained once through an explicit, audited
  setup step and must then be cached locally before a benchmark run.

### Gemini fallback rule

After local OCR is integrated and only after the user approves that later
stage, Gemini may be available as a separate button named Coba dengan Gemini.
It is visible to Controller users only. The confirmation must say that the
selected image will be sent to Google. There is no automatic retry, background
upload, or silent provider switch.

## 4. Scope

### In scope for the standalone OCR Lab

- One PNG, JPG, or JPEG BOM table image per run.
- CPU-only operation on the stated i7 eighth-generation device with Intel UHD
  integrated graphics.
- OpenCV image preparation and table-grid detection.
- A lightweight, CPU-oriented PaddleOCR recognition model.
- Fixed six-column and seven-column BOM layouts.
- Header detection at the top, bottom, or absent.
- Per-cell confidence, normalization, validation warnings, JSON output, and an
  annotated image for visual review.
- Ground truth, repeatable benchmark, metrics, and an integration gate.

### Explicitly out of scope

- PDFs or PDF rendering.
- Training a model from scratch.
- CUDA, NVIDIA GPU, or heavyweight full PP-Structure deployment.
- Handwriting, CAD callout interpretation, arbitrary documents, or generic
  spreadsheet conversion.
- Any database write, Laravel route/controller change, Next.js UI change, or
  replacement of Gemini during the Lab stage.
- Automatic external fallback.
- Committing real customer drawings, credentials, or raw benchmark artifacts.

## 5. Chosen Architecture

### Table-first local pipeline

~~~
source image
    ->
validate type and size
    ->
normalize orientation, scale, contrast, and threshold
    ->
detect horizontal and vertical grid lines with OpenCV morphology
    ->
derive ordered rows and cell rectangles
    ->
remove grid pixels, crop, and pad each cell
    ->
recognize cell text locally with a lightweight PaddleOCR model
    ->
map cells into the BOM schema
    ->
normalize and validate values
    ->
write JSON, warnings, confidence, and annotated overlay
~~~

The table grid is the authority for rows and columns. OCR only reads text
inside already known cells. This reduces resource use and makes error diagnosis
far easier than asking a large model to infer the entire table.

### OCR engine boundary

Recognition must sit behind a small interface so the Lab can benchmark a
replacement engine without rewriting image preprocessing, table detection,
normalization, validation, benchmark logic, or the future Laravel adapter.

PaddleOCR mobile is the first candidate. Tesseract can be included only as a
benchmark baseline if useful. Full document/table models are not the first
implementation because the input is already a regular ruled table and the
target laptop has no CUDA-capable GPU.

## 6. BOM Layout Rules

### Supported schemas

| Column count | Canonical mapping |
| --- | --- |
| 6 | No, Description, Dimension, Material, Qty, HRC |
| 7 | No, Description, Dimension, Material, Qty, HRC, Remark |

Headers may be absent, above rows, or below rows. A bottom header must be
excluded from data rows and must not reverse data-row order.

When legible, normalize header variants:

| Source labels | Canonical field |
| --- | --- |
| NO, NO., NUMBER | no |
| DESCRIPTION, DESC | description |
| DIMENSION, SIZE | dimension |
| MATERIAL, MATL | material |
| QTY, QT'Y, QUANTITY | qty |
| HRC, HARDNESS | hrc |
| REMARK, NOTES | remark |

When headers are absent or uncertain, positional mapping is allowed only for an
otherwise valid six- or seven-column grid. A different count is a structural
warning, not a ready-to-import result.

### Field expectations

| Field | Expected values | Examples |
| --- | --- | --- |
| no | number, alphanumeric number, S-prefix, or dash | 10A, 04B, S1, - |
| description | free technical text | PUNCH FORMING, Guide Post |
| dimension | technical dimension string | 45x250x330, Ø30x58, MYAP32-200 |
| material | material or standard identifier | SS400, S50C, SKD11, STD |
| qty | positive whole number | 1, 6 |
| hrc | hardness range/value or dash | 58-60 HRC, 35-40, - |
| remark | optional free text | - |

Normalization may trim whitespace, collapse repeated spaces, normalize common
dimension and diameter glyphs for comparison, normalize HRC spacing/case, and
parse an unambiguous positive integer quantity. It must never invent a missing
description, quantity, material, or dimension.

## 7. Result Contract

The standalone Lab returns a provider-neutral result that can later be adapted
to MATRIX's current frontend item shape:

~~~
{
  "success": true,
  "provider": "local_bom_ocr",
  "schemaVersion": 1,
  "source": { "filename": "bom.png", "width": 1207, "height": 717 },
  "table": {
    "columnCount": 7,
    "headerLocation": "bottom",
    "confidence": 0.97
  },
  "rows": [
    {
      "index": 0,
      "status": "needs_review",
      "cells": {
        "no": { "raw": "10B", "value": "10B", "confidence": 0.99 },
        "description": { "raw": "BC DIE 2", "value": "BC DIE 2", "confidence": 0.96 },
        "dimension": { "raw": "25X120X145", "value": "25x120x145", "confidence": 0.93 },
        "material": { "raw": "S50C", "value": "S50C", "confidence": 0.98 },
        "qty": { "raw": "1", "value": 1, "confidence": 1.00 },
        "hrc": { "raw": "35-40", "value": "35-40", "confidence": 0.95 },
        "remark": { "raw": "-", "value": "-", "confidence": 0.99 }
      },
      "warnings": []
    }
  ],
  "warnings": [],
  "artifacts": { "annotatedImage": "output/annotated/bom.png" }
}
~~~

Implementation naming can vary, but the contract must preserve:

- separate raw text and normalized value;
- cell and table confidence;
- machine-readable, human-visible warnings;
- no auto-import behavior;
- an honest failed parse with no fabricated rows.

## 8. Confidence and Review

Confidence is advisory, not proof. Mark a row as needs_review when any of the
following is true:

- grid/table confidence is below the configured threshold;
- a required cell has low recognition confidence;
- cell count does not match the chosen schema;
- quantity is not an unambiguous positive integer;
- item number has an unexpected pattern;
- HRC or dimension contains ambiguous characters;
- a duplicate item number is found;
- a row is structurally incomplete.

A row may be ready_for_review only when no structural or semantic warning is
present. It must still go through human review. The Lab never writes MATRIX
items, so it cannot silently create data.

## 9. Runtime Rules

### Initial Lab runtime

Use a native Python virtual environment on Windows rather than Docker for the
first benchmark. It minimizes overhead on the target device and lets us measure
the actual CPU-only experience.

The initial operating limits are:

- CPU only;
- one image at a time;
- one OCR worker/model instance;
- configurable maximum long edge, initially 2048 pixels;
- no parallel batch processing by default;
- model loaded once per benchmark session;
- source and output paths located in ignored local directories.

### Later service runtime

Only after a passing benchmark, package the same tested OCR core as a small
local HTTP service. Laravel can then call it through a private Docker-network
URL in deployment or a configurable localhost URL during development.

The CLI and Python tests remain the primary evidence; a network service is not
a prerequisite for proving OCR quality.

## 10. Corpus and Ground Truth

Create this ignored local layout before real samples are added:

~~~
ocr-lab/data/private/
  images/
  ground-truth/
  runs/
~~~

Use at least 20 to 30 checked images before integration. The corpus must cover:

- six and seven columns;
- header at top, bottom, and absent;
- magenta grid lines like the supplied examples;
- item numbers such as 10A, 04B, S1, and dash;
- diameter symbols and multiple dimension separators;
- HRC ranges with and without HRC text;
- dash values in HRC/Remark;
- ordinary compression, rotation, and crop-quality variation;
- at least one intentionally difficult image that should be flagged.

For every image, a human prepares canonical JSON or CSV ground truth. Ground
truth is the benchmark authority, not Gemini output. Every OCR rule change must
be checked against the entire corpus.

## 11. Benchmark and Integration Gate

The benchmark reports:

| Metric | Definition |
| --- | --- |
| table detection success | image produces one ordered usable grid |
| row recall | correct data rows divided by ground-truth rows |
| row precision | correct data rows divided by returned data rows |
| normalized cell exact match | correct non-empty canonical cells divided by ground-truth cells |
| critical-field accuracy | exact No, Description, Material, Qty, and Dimension values |
| warning coverage | known bad/ambiguous output is flagged rather than marked clean |
| p50 and p95 latency | local extraction time after model warm-up |
| peak memory | memory used for a single image |
| determinism | repeated runs return the same parsed values and warnings |

Metrics must appear overall and by field. High description accuracy must not
hide poor Qty or item-number accuracy.

The local default may be integrated only when all of these pass:

- at least 20 representative images have checked ground truth;
- table detection success is at least 98 percent;
- data-row recall is at least 98 percent;
- normalized exact-match accuracy across non-empty cells is at least 95 percent;
- No and Qty are each at least 99 percent correct;
- structural failures emit warnings and never fabricated data;
- images do not leave the local machine during the benchmark;
- every output remains review-only;
- repeat runs are stable;
- p95 one-image processing time after warm-up is 20 seconds or less on the
  target laptop, unless the user explicitly approves a measured alternative.

The 95 percent overall threshold does not permit automatic saving of the
remaining errors. Review remains mandatory.

If the benchmark fails, improve preprocessing, grid detection, model/profile,
or normalization rules. Do not integrate an unmeasured engine because a
happy-path screenshot looked correct.

## 12. Failure Behavior

| Condition | Required behavior |
| --- | --- |
| unsupported type or oversized image | reject before OCR with useful error |
| no stable grid | return structural failure and diagnostic overlay when possible |
| unexpected column count | warning, not import-ready data |
| OCR/model failure | return failure with no sample rows |
| low confidence or invalid field | retain row and flag exact cells |
| artifact/report write failure | report separately and do not claim passing benchmark |

The production-capable local OCR path must never use the existing static
demonstration rows as a fallback. Demonstration data belongs in tests only.

## 13. Deferred MATRIX Integration

Integration begins only after the benchmark gate passes. The later work will:

1. Run the tested OCR core as a local service.
2. Add a Laravel adapter that sends an uploaded image to that service.
3. Preserve the existing review/edit experience in
   frontend/components/add-data-dialog.tsx.
4. Change the upload selector from image/PDF to image-only.
5. Map local rows into no, description, dimension, material, qty, and hrc.
6. Replace fake fallback rows with an honest error/review state.
7. Add the Controller-only, explicitly confirmed Gemini retry action.
8. Keep credentials server-side and never expose them to Next.js.
9. Avoid PDF support, automatic external fallback, and generic document
   conversion in the initial integration.

## 14. Proposed Lab Boundaries

The Lab stays outside the application domain layers:

~~~
ocr-lab/
  README.md
  pyproject.toml
  src/bom_ocr/
    cli.py
    config.py
    image_preprocessing.py
    grid_detection.py
    cell_extraction.py
    recognition.py
    normalization.py
    validation.py
    result_schema.py
    annotation.py
    benchmark.py
  tests/
  fixtures/
  data/private/              ignored
~~~

Responsibilities must remain separate: image preparation, table geometry, cell
recognition, domain normalization, validation/confidence, serialization and
annotation, and benchmark reporting.

## 15. Test Strategy

Develop the Lab test-first where practical:

- unit tests for each normalizer and validator;
- header/column mapping tests for six and seven columns;
- fixture tests for row order, bottom headers, dashes, alphanumeric IDs,
  diameter symbols, HRC ranges, and malformed quantities;
- grid integration tests using sanitized or synthetic fixtures;
- golden JSON tests for known inputs;
- benchmark-command test for missing/invalid ground truth;
- repeated-run determinism test;
- manual visual inspection of overlay boxes against the source image.

The benchmark report is a release artifact; it does not replace tests.

## 16. Acceptance of This Design

This design is ready for an implementation plan when the user confirms:

- standalone OCR validation comes before MATRIX integration;
- image-only input is sufficient;
- local CPU-only OCR is the default direction;
- real drawings are local and ignored by Git;
- review before import is mandatory;
- Gemini later requires Controller confirmation;
- integration waits for the benchmark gate.

## 17. Deferred Evidence-Based Decisions

The following are deliberately postponed until the Lab produces evidence:

- exact PaddleOCR model/version and Windows installation path;
- calibrated confidence thresholds;
- whether Tesseract remains a useful benchmark baseline;
- production hosting/container topology;
- whether a user-visible OCR diagnostics page is useful;
- whether any sanitized image fixture can be committed.
