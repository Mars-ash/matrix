# Local BOM OCR Lab

> [!IMPORTANT]
> **RETAINED-BUT-INACTIVE RESEARCH ARCHIVE**
> This local OCR lab workspace is retained as an experimental / offline benchmark artifact only.
> It is **NOT** part of the active MATRIX production pipeline. Production OCR extraction is handled exclusively by **Google Gemini Vision AI** via `backend/app/Services/OcrService.php` behind Sanctum authentication (`auth.token`).
> Do **NOT** wire this directory, its Python runtime, or any local service facade into production backend routes or deployment containers.

Standalone, CPU-only extraction of ruled PNG/JPEG BOM tables. All results require
human review. MATRIX integration remains gated by the approved private benchmark.

The Lab reads one image and writes review JSON, an annotated image, and diagnostics.
It does not write to MATRIX, import items, or call Gemini. Failed extraction returns
warnings and an empty row list; it never substitutes demonstration rows.

## Supported input

- One ruled table with six or seven columns, in this order:
  `no, description, dimension, material, qty, hrc[, remark]`.
- A complete header at the top or bottom, or no header. Uncertain headers are kept
  as rows with `ambiguous_header` warnings, so a user can inspect them.
- PNG, JPG, or JPEG, with matching decoded format; at most 10 MiB, an 8192-pixel
  edge, and 24 million decoded pixels. Animated images and PDFs are rejected.
- Images are oriented using EXIF, reduced to a 2048-pixel long edge when needed,
  and deskewed for small rotations. Prefer the whole table with outside borders.
  An unrotated table clipped exactly at an image edge can be read when every
  observed perpendicular rule continues to that edge and the remaining cell
  dimensions are plausible. These results carry `cropped_table_border` on every
  row: check outer cells and column identities against the original. Source edges
  are crop bounds, never evidence for an invented internal separator. White
  margins, interrupted crossing rules, thin stubs and implausibly tall final rows
  remain rejected. Multiple plausible grids are rejected.
  The conservative stub check can also reject rasterized tables whose crossing
  rules bleed one or two pixels past an otherwise complete outer border. These
  false rejections remain an open geometry limitation; do not remove the check
  without tests distinguishing bleed from a genuinely truncated outer cell.

The original image is unchanged. Cell bounds refer to the original resolution
after EXIF orientation, before resizing or deskewing.

## Windows setup

Use 64-bit Python 3.11. The package permits Python 3.11–3.13; this checkout was
tested with Python 3.11.15. Do not use the system Python 3.14 for this stack.

This checkout already has the approved isolated interpreter, `.venv`, and cached
model. Start with `check-env`; installation is unnecessary if it succeeds.

```powershell
Set-Location C:\laragon\www\MATRIX\ocr-lab
.\.venv\Scripts\python.exe --version
.\.venv\Scripts\bom-ocr.exe check-env
```

For a fresh environment, dependency and model acquisition require an explicit
download decision. These are setup commands with network access:

```powershell
py -3.11 --version
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe scripts/download_model.py --confirm-download
.\.venv\Scripts\python.exe -m pip check
```

If Python 3.11 is not registered, install a supported interpreter first. The
portable interpreter already acquired for this checkout is
`.python/cpython-3.11.15-windows-x86_64-none/python.exe`; it can create a replacement
virtual environment without changing the system Python registration.

The model setup script downloads only the official `PP-OCRv5_mobile_rec` inference
archive. It extracts three allowlisted regular files, records SHA-256 hashes in
`model-cache/PP-OCRv5_mobile_rec/setup-manifest.json`, and refuses to overwrite an
existing model directory. No drawing is part of that request.

Tested direct dependency versions are pinned in [pyproject.toml](pyproject.toml):

| Component | Version |
| --- | --- |
| PaddleOCR | 3.7.0 |
| PaddleX OCR core | 3.7.2 |
| PaddlePaddle CPU | 3.3.1 |
| OpenCV contrib | 4.10.0.84 |
| NumPy | 2.3.5 |
| Pillow | 12.3.0 |
| psutil | 7.2.2 |
| pytest / Ruff | 9.1.1 / 0.16.7 |

Recognition uses PaddleOCR's
[TextRecognition module](https://www.paddleocr.ai/main/en/version3.x/module_usage/text_recognition.html)
with a local `model_dir`, `device="cpu"`, two CPU threads, oneDNN (MKL-DNN) CPU
acceleration enabled, and HPI disabled.
Only cell recognition is loaded; there is no document-parser pipeline or GPU
dependency. See the official
[Windows CPU installation reference](https://www.paddlepaddle.org.cn/documentation/docs/install/pip/windows-pip_en.html).

## Extract and review

Try the included synthetic BOM:

```powershell
.\.venv\Scripts\bom-ocr.exe extract --input .\fixtures\synthetic\readable-bom.png --output .\output\demo
```

Then use a local private drawing:

```powershell
.\.venv\Scripts\bom-ocr.exe extract --input .\data\private\images\bom-01.png --output .\data\private\runs\bom-01
```

Each output directory contains:

| Artifact | What to review |
| --- | --- |
| `result.json` | Raw and normalized text, confidence, original cell bounds, row status and warnings. |
| `annotated.png` | Green cells are `ready_for_review`, amber cells are `needs_review`; structural failure is red. |
| `diagnostics.json` | Table information, row warning codes, and coordinate convention. |

Both row statuses require a human decision. `ready_for_review` does not mean
approved for import. Values are normalized conservatively: leading zeros in IDs
remain, quantities may be positive integers or explicit positive R/L pairs, and
missing values stay null. A pair such as `1R / 1L` stays text with its counts,
labels, and side order intact; it is never summed and always carries the
`sided_quantity` review warning. Low confidence, missing fields, duplicate IDs,
malformed quantities, and uncertain dimensions/HRC produce review warnings.

Observed limitation: the synthetic demo's `Ø30x58` can be recognized as `030x58`.
Leading-zero measurements are therefore flagged for review while their raw and
normalized text remain unchanged. This check cannot detect every confident OCR
mistake; always compare against the source, including green rows.

Output defaults to `output/<input-stem>`. Only `ocr-lab/output` and
`ocr-lab/data/private/runs` are accepted unless you deliberately pass
`--allow-output-outside-lab`. A repeated run replaces artifacts in the selected
directory; use a new run directory to retain earlier evidence.

Exit codes: `0` means extraction produced review rows or benchmark gates passed;
`2` means invalid input, extraction failure, or failed benchmark gates; `3` means
local file I/O failed. A failed extraction still produces diagnostic artifacts
when its output directory is writable. CLI logs contain counts and warning codes,
not the extracted row text.

## Local processing and private files

- Keep real images, truth files, and reports under ignored `data/private/`.
  Generated `output/`, model downloads/cache, virtual environments, and Python
  caches are also ignored by the Lab's own `.gitignore`.
- `extract` and `benchmark` use cached model assets only. Missing assets cause a
  failure; they never trigger an automatic model download or remote OCR retry.
- The recognizer initializes lazily and shares one model within a process.
  It recognizes cells sequentially and creates no OCR worker processes.
- Python socket calls are blocked during local inference. This guard is defense
  in depth; native libraries can use network APIs outside Python. The private
  release benchmark additionally requires enforced OS/device network isolation.
- Set `BOM_OCR_MODEL_CACHE` to change the cache root, or `BOM_OCR_MODEL_DIR` to use
  a specific already-downloaded model directory. Start a new process after a
  model-profile change. Use local paths that are excluded from version control.

The Lab has no Gemini credentials or upload path. Any later MATRIX/Gemini work
requires the separate integration gate and Controller confirmation described in
the approved design.

## Tests

Ordinary tests use deterministic fake recognition and synthetic images:

```powershell
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus"
.\.venv\Scripts\python.exe -m ruff check src tests scripts
.\.venv\Scripts\python.exe -m ruff format --check src tests scripts
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\bom-ocr.exe check-env
```

After approved model setup, explicitly run the real CPU smoke test:

```powershell
.\.venv\Scripts\python.exe -m pytest -q -m model tests/test_recognition.py
```

Only the exact `-m model` expression opts into model tests. A bare pytest run or
a broader marker expression cannot accidentally run them. The smoke test uses a
synthetic cell and the same network guard as extraction. Running it with cached
assets is useful setup evidence; it does not prove the private release gate.

`scripts/make_demo.py` regenerates the readable synthetic fixture using the
Windows Arial font (including the diameter glyph). No private drawing is used
to create the committed fixtures.

## Private benchmark and integration gate

See [data/README.md](data/README.md) and
[data/ground-truth.example.json](data/ground-truth.example.json) for corpus setup.
At least 20 distinct real representative images and human-checked truth pairs
are required. Synthetic fixtures never qualify for integration sign-off.

First inspect representative extraction overlays. Then warm the local model and
enforce no outbound network access for the benchmark. For example, run on the
device with all network connections disabled, or use a reviewed OS policy that
blocks the OCR process and its native runtime. Record the actual isolation
method, time, verification, and command in a local text file. An assertion that
the Python guard was enabled is insufficient OS isolation evidence.

```powershell
.\.venv\Scripts\bom-ocr.exe benchmark --corpus .\data\private --report .\data\private\runs\benchmark-01 --repeat 3 --no-egress-evidence .\data\private\no-egress-evidence.txt
```

The evidence argument attaches a human-provided record; it does not enable a
firewall or independently prove that the record is accurate. Without the record,
the CLI still computes metrics but the `no_egress` gate fails. Keep network
isolation in effect throughout the actual run and review the evidence before
sign-off.

Reports: `report.json`, `report.md`, `field-metrics.csv`, and `mismatches.csv`.
Reports contain document content and remain private. CSV cells that could be
spreadsheet formulas are escaped. The benchmark itself does not create image
overlays; retain those from the representative `extract` runs.

| Gate | Required result |
| --- | --- |
| Corpus | At least 20 unique image hashes; every truth file human checked; all coverage tags present. |
| Table detection | At least 98% of positive table images. |
| Data-row recall | At least 98% exact ordered rows. |
| Cell exact match | At least 95% of expected nonempty normalized cells. |
| No and Qty accuracy | Each at least 99%. |
| Warnings / negative cases | All expected warnings covered; all intentional structural failures rejected with warnings. |
| Extra output | No invented extra nonempty cells or rows, including raw text that normalizes to null. |
| Determinism | Stable normalized values, structure, status, and warning codes across repeats. |
| Warm p95 latency | At most 20 seconds per image on the target device. |
| Privacy and approval | Enforced no-egress evidence plus explicit human integration sign-off. |

Rows are matched by order after removing the header and fully empty rows, never
by item ID. Recall and precision require a completely matching ordered row.
Field accuracy uses expected nonempty cells as its denominator; extras are
reported separately and fail their own gate. Intentional negative images are
scored separately so correct rejection does not lower positive table detection.

One positive-table warm-up extraction is excluded when available. Timing includes
validation, preprocessing,
geometry, recognition, and result construction, but excludes artifact writing.
p50/p95 use the nearest-rank method. Peak memory is process RSS sampled every
20 ms plus Windows' lifetime peak working set where available; it includes the
model and is not a per-image allocation measurement. Reports record package
versions, OS/Python, model profile, CPU acceleration/thread count, and image limit.

Threshold defaults are in `BenchmarkThresholds` in `src/bom_ocr/config.py`.
Changing a threshold or model profile requires a new report and an explicit
decision on whether it still meets the approved integration requirements.

**Current release state:** a private corpus is present, but human verification is
incomplete and diagnostic measurement fails the accuracy/detection gates. Keep
recovered OCR or AI-transcribed references marked `humanChecked: false` until a
person checks them. An OCR failure on a visible table is not an intentional
negative case. MATRIX integration remains gated until the complete representative
corpus, no-egress evidence, passing measurements, and user sign-off exist.

### Local verification snapshot — 2026-09-16

- 255 ordinary unit/synthetic tests and one explicitly selected CPU model smoke
  test passed on Python 3.11.15. Ruff lint/format and `pip check` passed.
- The readable synthetic BOM produced three ordered rows with its bottom header
  excluded. The `Ø`/`0` recognition ambiguity described above remained and was
  flagged for review; the overlay was inspected against the source.
- A two-image synthetic command smoke run (one table, one no-table probe), with
  three repeats, was deterministic and reported all observed errors with warnings.
  Warm p95 was 3.63 seconds with oneDNN, versus 22.66 seconds without it on the
  same sample. These are setup measurements, not representative-corpus evidence.
- That report correctly returned FAIL: the corpus is too small, is not a checked
  real corpus, lacks the required variation/isolation evidence, and the diameter
  error fails row recall. No private accuracy gate or integration approval exists.

## Troubleshooting

| Symptom | Next step |
| --- | --- |
| Python 3.14 or incompatible wheel | Use the isolated Python 3.11 environment, not the system interpreter. |
| `recognition_failed` | Check the three inference files and setup manifest in the local model directory; run the explicit smoke test. No automatic download occurs. |
| `no_table` or `ambiguous_table` | Use a crop containing exactly one complete ruled table with all outside borders. |
| `unsupported_column_count` | Inspect missing/merged rules; only six or seven detected columns are supported. |
| `ambiguous_header` | Inspect the retained header-like row and raw values; never delete it silently. |
| Text too small or blurred | Use the original-resolution image, avoid repeated JPEG compression, inspect the overlay and cell confidence. |
| Incomplete corpus | Every image needs a same-stem JSON; no unrelated files or nested folders belong in `images` or `ground-truth`. |
| Slow first command | Model loading is a cold start; benchmark latency excludes one warm-up. Measure the real corpus before tuning. |

If any real benchmark gate fails, keep the app integration gated, diagnose the
specific pipeline stage from private evidence, add a synthetic regression test
where practical, and rerun the complete corpus after a focused fix.
