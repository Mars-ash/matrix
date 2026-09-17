# Local BOM OCR Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Workspace: C:\laragon\www\MATRIX

Approved design: docs/superpowers/specs/2026-09-15-local-bom-ocr-lab-design.md

Scope: Build and validate a standalone local OCR Lab for ruled PNG/JPG/JPEG
engineering BOM tables. This plan deliberately does not change the Laravel,
Next.js, Docker, database, or Gemini integration.

## 1. Scope and Hard Gate

This plan produces a usable, testable local command-line OCR Lab. It reads
table images, produces JSON plus an annotated image, and measures accuracy
against checked ground truth.

Do not execute the separate MATRIX integration plan until this Lab has:

- a checked private corpus of at least 20 representative images;
- every benchmark threshold from the approved design passing;
- an explicit user decision that the benchmark evidence is sufficient.

This is not a soft recommendation. A nice-looking one-image demo is not a
reason to alter the production-facing conversion flow.

## 2. Current Context and Constraints

Read before touching code:

- AGENTS/AGENTS.md
- AGENTS/AGENT_WORKFLOW.md
- docs/superpowers/specs/2026-09-15-local-bom-ocr-lab-design.md
- backend/app/Services/OcrService.php, for the future boundary only
- frontend/components/add-data-dialog.tsx, for the future boundary only

Repository facts observed when this plan was written:

- The root worktree has extensive unrelated staged/uncommitted deletions and
  modifications. Preserve them all.
- Python 3.14 is the only currently registered Python interpreter.
- The CPU PaddlePaddle inference engine required by the Lab is not supported
  by the observed Python 3.14 environment. Do not install or run it with that
  interpreter; create a separate supported Python 3.11 environment.
- The existing application uses Gemini and an offline demonstration fallback;
  neither behavior is changed by this Lab plan.
- No Python project currently exists in the repository.

Execution rule:

1. Capture root git status before starting.
2. Do not reset, restore, stage, or commit unrelated files.
3. Run this work in a clean approved branch/worktree when one is available.
4. If working in the current dirty tree is explicitly approved, create only the
   new OCR Lab paths listed below and do not create a broad commit.
5. Do not install Python 3.11 or download packages/models until the user
   approves the external download/install action at execution time.

## 3. File Structure

Create a standalone package at the repository root:

| File or directory | Responsibility |
| --- | --- |
| ocr-lab/.gitignore | Keeps virtualenvs, model cache, private images, output, and test cache out of Git without editing the already-dirty root .gitignore. |
| ocr-lab/README.md | Windows setup, privacy rules, CLI commands, benchmark gate, and troubleshooting. |
| ocr-lab/pyproject.toml | Python 3.11 to 3.13 constraint, runtime/dev dependencies, console command, test and lint configuration. |
| ocr-lab/src/bom_ocr/models.py | Immutable result, bounding box, grid, cell, warning, and benchmark data contracts. |
| ocr-lab/src/bom_ocr/config.py | Typed runtime limits and configurable confidence/geometry thresholds. |
| ocr-lab/src/bom_ocr/schema.py | Six/seven column definitions, header synonyms, positional mapping, and header-row selection. |
| ocr-lab/src/bom_ocr/normalization.py | Pure text normalization for ID, dimension, material, quantity, HRC, and remark fields. |
| ocr-lab/src/bom_ocr/validation.py | Pure semantic validation and row-review status calculation. |
| ocr-lab/src/bom_ocr/preprocessing.py | Image load, EXIF orientation, safe resize, grayscale/binary conversion, and line-mask preparation. |
| ocr-lab/src/bom_ocr/grid.py | Horizontal/vertical line detection, grid intersection analysis, ordered boundaries, and structural confidence. |
| ocr-lab/src/bom_ocr/cells.py | Grid-cell crop, line removal, padding, upscale, and row construction. |
| ocr-lab/src/bom_ocr/recognition.py | Recognition interface, Paddle OCR implementation, lazy CPU model load, and a deterministic fake recognizer for tests. |
| ocr-lab/src/bom_ocr/pipeline.py | Orchestrates all local stages and produces the provider-neutral OCR result. |
| ocr-lab/src/bom_ocr/annotation.py | Writes a visual overlay with cell bounds, row status, and warning colors. |
| ocr-lab/src/bom_ocr/benchmark.py | Loads ground truth, compares results, calculates metrics, runs repeats, and writes reports. |
| ocr-lab/src/bom_ocr/cli.py | extract, benchmark, and environment-check commands. |
| ocr-lab/tests/ | Unit, synthetic image, pipeline, annotation, and benchmark tests. |
| ocr-lab/fixtures/ | Only synthetic or legally sanitized test assets and expected JSON. |
| ocr-lab/data/README.md | Documents private corpus layout and ground-truth format; contains no real drawings. |
| ocr-lab/data/private/ | Ignored local corpus, ground truth, output, and run artifacts. |

Do not create Python modules under backend, frontend, or docker in this plan.

## 4. Task 0: Preflight and Safe Environment

1. Re-read the approved design and this plan.
2. Run and save a full porcelain snapshot in execution notes outside the
   repository; it is the baseline for the final dirty-worktree comparison.
   Also record interpreter discovery, not in source code:

~~~powershell
git status --porcelain=v1
py --version
py -0p
~~~

3. Confirm Python 3.14 is not used for the OCR environment.
4. Check whether Python 3.11 is registered:

~~~powershell
py -3.11 --version
~~~

5. If that command fails, stop before package installation and request approval
   to install a supported 64-bit Python 3.11 interpreter. Do not substitute
   Python 3.14.
6. Once a supported interpreter is available, create the isolated environment:

~~~powershell
Set-Location C:\laragon\www\MATRIX\ocr-lab
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
~~~

7. Add ocr-lab/.gitignore before placing any real images, model cache, or output
   inside the directory.
8. Verify the virtual environment interpreter:

~~~powershell
.\.venv\Scripts\python.exe --version
~~~

Deliverable: a supported, isolated, CPU-only Python environment exists without
changing MATRIX application dependencies or touching private drawings.

Suggested clean-worktree commit after review: chore(ocr-lab): scaffold isolated OCR lab

## 5. Task 1: Package Skeleton, Privacy Controls, and Tooling

1. Create ocr-lab/pyproject.toml with:

   - requires-python set to Python 3.11 through below 3.14;
   - package source rooted at src;
   - a bom-ocr console command;
   - runtime dependencies for OpenCV, Pillow, lightweight PaddleOCR CPU
     inference, and only the small utilities needed by the Lab;
   - dev dependencies for pytest and ruff;
   - pytest markers for tests requiring a downloaded model or private corpus;
     every ordinary documented test command must explicitly exclude both
     markers, while `-m model` is the sole opt-in for a model smoke test.

2. Do not install the heavyweight document-parser/all dependency group.
3. Pin exact package versions only after a successful CPU smoke test; record
   those tested versions in pyproject.toml rather than silently relying on
   unbounded latest packages.
4. Create ocr-lab/.gitignore with at minimum:

~~~text
.venv/
__pycache__/
.pytest_cache/
.ruff_cache/
.coverage
model-cache/
output/
data/private/
~~~

5. Create package initializer and a minimal CLI that supports:

~~~text
bom-ocr check-env
bom-ocr extract --input IMAGE --output DIRECTORY
bom-ocr benchmark --corpus DIRECTORY --report DIRECTORY --repeat 3
~~~

6. Add a failing CLI smoke test that invokes check-env without accessing a
   network or loading a model.
7. Implement only enough CLI plumbing to pass the smoke test.
8. Install package dependencies after explicit authorization for external
   downloads:

~~~powershell
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
~~~

9. Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus"
.\.venv\Scripts\python.exe -m ruff check src tests
.\.venv\Scripts\bom-ocr.exe check-env
~~~

10. In README.md, state that first-time model acquisition is an audited setup
    action; actual image extraction must work after model cache is warm and
    without contacting Gemini or another external OCR service.

Deliverable: reproducible package skeleton and privacy-safe local workspace.

## 6. Task 2: Lock the Result Contract, Schema, and Pure Rules With Tests

1. Add failing tests before writing implementation:

   - tests/test_schema.py
   - tests/test_normalization.py
   - tests/test_validation.py
   - tests/test_models.py

2. In models.py, define typed immutable structures for:

   - BoundingBox with left/top/right/bottom coordinates;
   - Grid with ordered horizontal and vertical boundaries and confidence;
   - RecognizedCell with raw text, normalized value, confidence, and bounding
     box;
   - BomRow with status, canonical cells, and warnings;
   - ExtractionResult with success, provider local_bom_ocr, schema version,
     source metadata, table metadata, rows, warnings, and artifact paths;
   - BenchmarkMetrics and BenchmarkReport;
   - warning codes including no_table, unsupported_column_count,
     low_confidence, invalid_qty, unexpected_item_no, duplicate_item_no, and
     malformed_row, and ambiguous_table.

3. In schema.py, add fixed schemas:

~~~text
6 columns: no, description, dimension, material, qty, hrc
7 columns: no, description, dimension, material, qty, hrc, remark
~~~

4. Add tests for header synonyms NO, DESCRIPTION, DIMENSION, MATERIAL, QTY,
   HRC, and REMARK.
5. Add tests for no header, top header, and bottom header. The bottom header
   must be excluded and must not reorder the data.
6. Add tests that a non-six/non-seven column count produces a structural
   warning rather than a positional guess.
7. In normalization.py, write tests first for:

   - trim/collapse whitespace;
   - 10A, 04B, S1, and dash item numbers;
   - dimension separators x, X, and multiplication glyph variants;
   - diameter symbol variants;
   - materials such as SS400, S50C, SKD11, SKS3, and STD;
   - positive integer quantity;
   - HRC values 58-60, 58-60 HRC, 35-40, and dash;
   - no invented fallback value for empty input.

8. Implement pure normalization functions with no OpenCV, model, file-system,
   or network imports.
9. In validation.py, write tests first for row warning composition:

   - invalid/missing quantity;
   - low confidence on a required cell;
   - unexpected item number;
   - duplicate item number;
   - structural cell-count mismatch;
   - a clean valid row;
   - a row with only an optional remark empty.

10. Implement review status so clean rows are ready_for_review and every
    warning produces needs_review. Neither status may mean auto-import.
11. Run the targeted suite and ruff:

~~~powershell
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus" tests/test_models.py tests/test_schema.py tests/test_normalization.py tests/test_validation.py
.\.venv\Scripts\python.exe -m ruff check src tests
~~~

Deliverable: the BOM contract and safety rules are independently tested before
image or AI work begins.

Suggested clean-worktree commit after review: feat(ocr-lab): define validated BOM result contract

## 7. Task 3: Build Image Preprocessing and Grid Detection Test-First

1. Create tests/support/synthetic_table.py to generate small deterministic
   table images with configurable row count, six/seven columns, line colors,
   header position, and text placeholders. Do not add real drawings to Git.
2. Add failing tests:

   - tests/test_preprocessing.py
   - tests/test_grid.py
   - tests/test_cells.py

3. In preprocessing.py, implement:

   - PNG/JPEG extension-and-MIME validation plus a configurable file-byte
     limit before decode;
   - decoded width, height, and pixel-count limits before expensive image
     processing; reject animated/multi-frame inputs rather than silently using
     an arbitrary frame;
   - EXIF orientation normalization;
   - long-edge resize with original-to-working scale metadata;
   - grayscale and contrast/binarization pipeline;
   - morphology-ready horizontal/vertical line masks;
   - explanatory errors for corrupt image or unsupported type.

4. Test that a 2048-pixel limit preserves aspect ratio and coordinate mapping.
5. Test that the implementation never accepts a PDF by filename or MIME type,
   rejects an oversized byte payload and decompression-bomb-sized image before
   resize, and rejects animated/multi-frame input.
6. In grid.py, use relative morphology kernel sizes derived from image
   dimensions; do not hard-code the line thickness or fixed cell widths from
   the three supplied screenshots.
7. Detect horizontal and vertical candidates, merge near-duplicate lines,
   calculate intersections, and return monotonically ordered boundaries.
8. Define grid confidence from usable intersections, consistent cell count, and
   row/column spacing; return no_table rather than a guessed grid when
   confidence is inadequate. Accept exactly one usable BOM grid per image;
   return ambiguous_table when multiple candidates are plausible.
9. Test successful six- and seven-column synthetic grids, a cropped outer
   border, minor rotation/tolerance, missing lines, an invalid non-grid image,
   and multiple framed grids that must return ambiguous_table.
10. In cells.py, derive row/cell rectangles from the grid; remove only detected
    grid pixels from each crop, then pad and optionally upscale cell images.
11. Test row-major ordering and that grid lines do not dominate crop pixels.
12. Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus" tests/test_preprocessing.py tests/test_grid.py tests/test_cells.py
.\.venv\Scripts\python.exe -m ruff check src tests
~~~

Deliverable: a deterministic, debuggable table geometry layer that does not
depend on OCR accuracy.

Suggested clean-worktree commit after review: feat(ocr-lab): detect ruled BOM table grids

## 8. Task 4: Add CPU Recognition Behind a Replaceable Interface

1. Add tests/test_recognition.py before implementation.
2. In recognition.py, define a recognizer protocol whose input is one prepared
   cell crop and whose output is raw text plus confidence.
3. Implement a FakeRecognizer for deterministic unit/pipeline tests; it must
   not load a model or access the network.
4. Implement PaddleCellRecognizer with:

   - CPU device selection only;
   - lazy model initialization so unit tests stay fast;
   - a model-cache directory configurable through config.py and environment;
   - one model instance per process;
   - no parallel worker creation;
   - sanitized error reporting if model load or inference fails.

5. Use the current official PaddleOCR API at execution time, not an obsolete
   copied API. Select only the recognition capability necessary for cell crops,
   not a document-parser/table-recognition package.
6. Add a model-marked smoke test that runs only after an explicit model
   installation/download is approved. It should recognize one synthetic or
   sanitized cell and assert that confidence is numeric and bounded.
7. Add a test that a model-marked test is selected only by the explicit
   `-m model` command. Every non-model test command in this plan must use
   `-m "not model and not private_corpus"`; do not rely on hidden pytest
   defaults.
8. After package/model installation, run the model smoke test once, record the
   exact working dependency versions, and re-run it with the machine offline
   to prove inference no longer needs Gemini or a network.
9. Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus" tests/test_recognition.py
.\.venv\Scripts\python.exe -m pytest -q -m model
.\.venv\Scripts\python.exe -m ruff check src tests
~~~

Deliverable: local CPU text recognition is replaceable, loaded once, and
separate from table geometry.

Suggested clean-worktree commit after review: feat(ocr-lab): add local CPU cell recognizer

## 9. Task 5: Assemble the Pipeline, JSON Output, and Visual Diagnostics

1. Add failing tests/test_pipeline.py and tests/test_annotation.py using
   FakeRecognizer plus synthetic tables.
2. In pipeline.py, compose the stages in this exact order:

~~~text
validate -> preprocess -> detect grid -> crop cells -> recognize cells
-> select/exclude header row -> map columns -> normalize -> validate rows
-> build result
~~~

3. Make the pipeline return success false with an empty row list for a
   structural failure. Do not return hard-coded sample BOM rows.
4. Preserve both raw and normalized cell values.
5. Ensure processing has no writes except to an explicitly requested output
   directory; source images remain unchanged. Default output to an ignored Lab
   path, and reject/warn for an output path outside `ocr-lab/output` or
   `ocr-lab/data/private/runs` unless the user passes a deliberate
   `--allow-output-outside-lab` override.
6. In annotation.py, render original-coordinate overlays:

   - green for clean ready_for_review cells;
   - amber for needs_review cells;
   - red for structural failure;
   - column/row labels and warning abbreviations;
   - no raw source or full row text in logs.

7. Generate:

~~~text
result.json
annotated.png
diagnostics.json
~~~

8. Add CLI extract behavior:

~~~powershell
.\.venv\Scripts\bom-ocr.exe extract --input .\fixtures\synthetic\six-column.png --output .\output\demo
~~~

9. Test no table, unknown column count, a bottom header, alphanumeric numbers,
   dash cells, invalid quantity, stable JSON serialization, and output-path
   refusal outside the ignored Lab locations.
10. Run all non-model tests:

~~~powershell
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus"
.\.venv\Scripts\python.exe -m ruff check src tests
~~~

Deliverable: one local image produces review-only JSON and an inspectable
overlay without touching MATRIX or a remote API.

Suggested clean-worktree commit after review: feat(ocr-lab): produce reviewed local BOM extraction

## 10. Task 6: Build the Benchmark and Ground-Truth Tooling

1. Create a documented canonical ground-truth JSON example in
   ocr-lab/data/ground-truth.example.json. It must include source filename,
   expected schema, header location, and expected canonical rows.
2. Add failing tests/test_benchmark.py for:

   - missing ground-truth pair;
   - unknown/extra image;
   - field-level normalized exact match;
   - row recall and precision;
   - critical-field accuracy, reported separately for No, Description,
     Dimension, Material, and Qty;
   - warning coverage;
   - repeat-run determinism;
   - report serialization.

3. In benchmark.py, match each private image with same-stem ground truth and
   calculate metrics overall plus by field. Match data rows by stable ordered
   row index after header exclusion, not by item number (dash IDs and duplicate
   IDs are valid inputs). Exclude headers and fully empty rows from both sides;
   count missing, extra, and structural-failure rows as mismatches. Define row
   recall as correct ordered data rows divided by expected data rows and row
   precision as correct ordered data rows divided by returned data rows. Define
   each field denominator as expected non-empty canonical cells, with extra
   non-empty returned cells recorded as mismatches.
4. Include p50/p95 elapsed time after one warm-up run, peak process memory,
   Python version, OS, engine name/version, configured image limit, and
   recognized model profile.
5. Write reports only under an explicit ignored output directory:

~~~text
report.json
report.md
field-metrics.csv
mismatches.csv
~~~

6. Make benchmark exit nonzero when corpus/ground truth is incomplete or
   configured thresholds fail.
7. Add a repeat option defaulting to three runs per image for determinism.
8. Add an explicit threshold configuration matching the approved design:

   - table detection at least 98 percent;
   - data-row recall at least 98 percent;
   - normalized cell exact match at least 95 percent;
   - No and Qty each at least 99 percent;
   - p95 after warm-up no more than 20 seconds.

9. Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus" tests/test_benchmark.py
.\.venv\Scripts\python.exe -m ruff check src tests
~~~

Deliverable: benchmark results are reproducible, auditable, and cannot pass
silently with incomplete evidence.

Suggested clean-worktree commit after review: feat(ocr-lab): benchmark BOM extraction quality

## 11. Task 7: Run the Private Corpus and Enforce the Gate

This task requires user-provided private images and human-checked ground truth.
Do not substitute Gemini output or synthetic data for the gate.

1. Create ignored directories:

~~~powershell
New-Item -ItemType Directory -Force .\data\private\images, .\data\private\ground-truth, .\data\private\runs
~~~

2. Copy at least 20 representative images locally. Cover every approved
   variation: six/seven columns, absent/top/bottom headers, magenta lines,
   10A/04B/S1/dash IDs, diameter symbols, HRC ranges, dashes, and one hard
   failure case.
3. Prepare checked same-stem truth files. A human must verify every row and
   canonical field.
4. Run one extraction manually per representative type and inspect annotated
   overlays before benchmarking.
5. Warm the model once and verify all model assets are in the local cache.
   Then run the actual benchmark with outbound network access disabled or
   blocked for the OCR process, recording the method used. This no-egress run
   is mandatory evidence that images did not leave the device and that no
   Gemini or other external OCR service was called. If it cannot be enforced
   and evidenced, the integration gate fails.
6. Execute:

~~~powershell
.\.venv\Scripts\bom-ocr.exe benchmark --corpus .\data\private --report .\data\private\runs\YYYY-MM-DD --repeat 3
~~~

7. Inspect report.md, report.json, mismatch CSV, and at least the first/last
   overlay of each table layout.
8. If any threshold fails, keep MATRIX untouched. Create a focused regression
   test from a sanitized representation of the failure where possible, improve
   the narrowest pipeline stage, and rerun the full corpus.
9. Give the user the benchmark report and a concise evidence summary. Ask for
   explicit approval before starting the gated integration plan.

Deliverable: a measured go/no-go decision based on actual MATRIX-style images.

## 12. Task 8: Documentation, Review, and Final Verification

1. Complete README.md with:

   - supported image-only input;
   - Python 3.11 setup;
   - explicit first-time dependency/model download note;
   - privacy/no-Gemini behavior;
   - extract and benchmark commands;
   - ground-truth format;
   - expected artifacts;
   - benchmark gate;
   - troubleshooting for Python 3.14, poor crop, no-grid, and model cache.

2. Run final Lab checks:

~~~powershell
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus"
.\.venv\Scripts\python.exe -m ruff check src tests
.\.venv\Scripts\bom-ocr.exe check-env
~~~

3. Run the private benchmark only when the private corpus exists. Do not claim
   the gate passed without its actual report.
4. Inspect:

~~~powershell
git diff --check -- ocr-lab
rg -n "[ \t]+$" ocr-lab --glob "!**/.venv/**" --glob "!**/model-cache/**"
git status --short -- ocr-lab
~~~

5. Because new OCR Lab files are initially untracked, do not treat
   `git diff --check` as a complete whitespace check: `rg` should return no
   matches (exit code 1) and ruff must pass. Compare the final full
   `git status --porcelain=v1` output to the preflight snapshot from Task 0;
   investigate every delta outside the planned OCR Lab paths. Verify no
   backend, frontend, Docker, database, image source, API key, or unrelated
   dirty file changed.
6. If executing in a clean approved worktree, make a final focused commit. If
   executing in the current dirty worktree, do not create a mixed commit.
7. Request code review before treating the Lab as ready for benchmark sign-off.

## 13. Verification Matrix

| Check | When | Evidence |
| --- | --- | --- |
| Pure BOM rules | Task 2 | pytest targeted suite |
| Grid/crop geometry | Task 3 | synthetic image tests plus overlays |
| CPU recognizer | Task 4 | approved model smoke test |
| Full local pipeline | Task 5 | pipeline/annotation tests and extract artifact |
| Benchmark calculations | Task 6 | benchmark tests |
| Real accuracy/performance | Task 7 | private report and mismatch evidence |
| Scope preservation | Task 8 | git diff/status review |

## 14. Explicit Non-Goals

Do not add during this plan:

- a Laravel route/controller/service;
- a Next.js component or API-client change;
- a Docker service;
- database migrations or persistence;
- PDF support;
- auto-import;
- automatic Gemini fallback;
- an external model-training workflow;
- real drawings or credentials to Git.
