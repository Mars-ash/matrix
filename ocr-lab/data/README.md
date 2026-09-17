# Private benchmark corpus

No real drawing belongs in this directory outside the ignored `private/` folder.
The committed example is a schema/template with fictional data, not benchmark
evidence. The directory layout is:

```text
data/
  ground-truth.example.json
  private/                         # ignored
    images/
      bom-01.png
      bom-02.jpg
    ground-truth/
      bom-01.json
      bom-02.json
    no-egress-evidence.txt
    runs/
      bom-01/                      # extract artifacts
      benchmark-01/                # benchmark reports
```

Create local directories if needed:

```powershell
New-Item -ItemType Directory -Force .\data\private\images, .\data\private\ground-truth, .\data\private\runs
```

## Pairing and truth

Each image must have exactly one same-stem JSON and vice versa. Stems are compared
without case. Duplicate stems, symlinks, nested folders, unknown extensions, and
unpaired files are errors. `source.filename` must exactly match the paired image
filename; use the filename alone, with no directory or traversal components.
Ground-truth files are limited to 5 MiB and images to 10 MiB.

Copy `ground-truth.example.json` and replace the fictional values from the actual
image. A person must verify every field before setting `humanChecked` to `true`.
Do not use unverified OCR/Gemini output as truth, and do not generate 20 synthetic
variants to satisfy the real-corpus gate.

| Field | Meaning |
| --- | --- |
| `source.filename` | Paired image filename, including its extension. |
| `schema.columnCount` | Exactly 6 or 7. |
| `schema.headerLocation` | `top`, `bottom`, or `absent`. |
| `humanChecked` | Boolean attestation that a person checked this truth. |
| `expectedFailure` | Set `true` only for an intentional structural rejection case. |
| `coverage` | Tags that actually occur in this image; see below. |
| `rows` | Canonical data rows in visible order, excluding the header. |
| `warnings` | Optional expected warning codes at result or data-row level. |

All row fields are required by the selected schema, even when the value is null.
Six-column rows use `no, description, dimension, material, qty, hrc`; seven-column
rows also include `remark`. Represent item IDs as strings (`"04B"`, `"S1"`, `"-"`)
so leading zeros survive. Use a positive integer for a valid quantity. Empty cells
are null. A literal dash remains `"-"`, not null. Use canonical dimension/HRC
notation, for example `"Ø30x58"`, `"45x250x330"`, and `"58-60"`.

For deliberately malformed printed quantities, record the actual text and an
`invalid_qty` warning expectation; never invent a corrected number. Normalization
maps an unparseable quantity to null for comparison. Inspect raw output and the
warning requirement as part of human review.

Warning examples (`rowIndex` is zero-based after header exclusion):

```json
[
  {"rowIndex": 1, "codes": ["invalid_qty"]},
  {"codes": ["ambiguous_header"]}
]
```

An expected structural failure has `expectedFailure: true`, empty `rows`, and
result-level warning expectations such as `[{"codes": ["no_table"]}]`. Its schema
describes the intended layout (or six columns/absent for a no-table rejection
probe). Correct rejection must return `success: false`, no rows, and warnings.
These cases are scored separately from positive table-detection accuracy.

Fully empty rows are excluded from comparison. Do not add empty padding rows in
truth files that use `rowIndex` warning expectations; index the actual data rows.

## Representative coverage

Across at least 20 distinct real images, cover all tags below. Add only tags
visibly supported by each source. Tags are human annotations; the tool checks
their presence but cannot prove that an image actually contains that variation.

```text
six_columns           seven_columns         header_top
header_bottom         header_absent         magenta_grid
alphanumeric_ids      s_prefix_id           dash_id
diameter              dimension_separators  hrc_ranges
dash_values           compression           rotation
crop_variation        hard_failure
```

Include `10A`/`04B` IDs, `S1`, dash IDs, diameter symbols, x/X/multiplication
separators, hardness ranges, and dashes. Also vary crop, compression, and slight
rotation, and include at least one genuine hard failure. Review the actual images
and truth quality, not just the coverage-tag list.

## Evidence and review

1. Inspect at least the first/last row overlays for every representative layout.
2. Cache the model, then enforce OS/device network isolation.
3. Write `no-egress-evidence.txt` with the real method, time, verification, and
   exact benchmark command. Do not describe a control as enabled without checking.
4. Run the benchmark with `--no-egress-evidence` pointing at that file; see the
   parent README for the complete command.
5. Review all report gates, field metrics, mismatches, source hashes, timings,
   and supplied isolation evidence. Benchmark PASS still requires explicit
   user approval before MATRIX integration.

All these artifacts can contain customer content and stay in ignored directories.
Changing source images or truth requires a fresh run and review.
