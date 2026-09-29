# TASK LIST — Perbaiki OCR Pipeline (BOM OCR Lab)

**Tanggal:** 2026-09-24
**Tujuan:** memperbaiki OCR otomatis agar 22 gambar terbaca akurat, lalu user review ulang. Data = core project, jadi kualitas pipeline adalah prioritas.

## Aturan tetap (dari AGENTS.md)
- Python 3.11 (`.venv` saja, BUKAN system Python 3.14).
- Privacy/review-only: gagal -> warnings + empty rows, **jangan pernah mengarang baris**.
- Jangan klaim tes/build lolos tanpa benar-benar menjalankannya.
- Jangan commit `.env`, `data/private/`, `model-cache/`, `.venv/`.
- **Jangan mengubah "stub check" tanpa regression test** (README memperingatkan ini).

## FASE 0 — Investigasi Read-Only (pahami akar masalah)
- [x] 0.1 Baca `src/bom_ocr/grid.py` — pahami logika deteksi grid & "conservative stub check".
- [x] 0.2 Baca `src/bom_ocr/preprocessing.py` — pahami resize/deskew/EXIF.
- [x] 0.3 Baca `src/bom_ocr/config.py` — catat semua threshold (`BenchmarkThresholds`, dsb).
- [x] 0.4 Baca `src/bom_ocr/recognition.py`, `normalization.py`, `cells.py`.
- [x] 0.5 Ukur geometri 7 gambar gagal vs 15 lolos (dimensi px, aspect ratio, posisi border) -> catat pola.
- [x] 0.6 Jalankan `extract` pada 7 gambar gagal, baca `diagnostics.json` masing-masing -> identifikasi penyebab persis `no_table`.
- [x] 0.7 Dokumentasikan temuan: "kenapa 7 gagal" (border-bleed vs truncated stub vs tinggi/aspect ratio).

Output Fase 0: daftar akar masalah yang terukur, bukan tebakan.

## FASE 1 — Regression Test (syarat sebelum ubah kode)
- [x] 1.1 Buat synthetic fixture yang membedakan **border-bleed** (harus LOLOS) vs **truncated stub** (harus DITOLAK).
- [x] 1.2 Tambahkan pytest untuk kasus 7 gambar (atau pola geometrinya).
- [x] 1.3 Pastikan test FAIL sekarang (mereproduksi bug) -> buktikan test menangkap masalah.
- [x] 1.4 Jalankan seluruh test suite existing (pastikan 255 unit test tetap hijau).

Output Fase 1: test yang "merah" sebelum fix, "hijau" setelah fix.

## FASE 2 — Perbaiki Deteksi Grid (dampak ~91% error)
- [ ] 2.1 Perbaiki logika deteksi agar 7 gambar masuk, tanpa merusak 15 yang sudah benar.
- [ ] 2.2 Verifikasi: 7 gambar sekarang terdeteksi, 15 tetap terdeteksi.
- [ ] 2.3 Jalankan regression test Fase 1 -> harus hijau.
- [ ] 2.4 Ukur ulang recall baris -> target naik drastis (dari ~36%).

Output Fase 2: semua 22 gambar terdeteksi; recall baris membaik signifikan.

## FASE 3 — Perbaiki Pengenalan Sel (dampak ~9% error, penting untuk akurasi)
- [ ] 3.1 `0`/`O` ambiguity di kolom `no` (`S02A`->`SO2A`, 34 error) -> post-check alfabet terbatas + flag review (bukan auto-correct).
- [ ] 3.2 Normalisasi spasi `dimension` (`CHP 16`->`CHP16`) -> aturan injeksi spasi prefiks alfa+digit (perlu konfirmasi schema).
- [ ] 3.3 Diameter `Ø` (`Ø50x100`->`050x100`) -> cek mapping `_DIAMETERS` di `normalization.py`.
- [ ] 3.4 HRC dash-only (`-`->null, 12 error) -> flag review dash vs empty.
- [ ] 3.5 Truncation (`PIN`->`PI`) -> cek `cell_padding`/`cell_scale` di `config.py`.

Output Fase 3: error sel menurun; sel yang ragu di-flag (bukan ditebak).

## FASE 4 — Re-benchmark & Serah ke Review
- [ ] 4.1 Jalankan benchmark penuh 22 gambar, 3 repeat.
- [ ] 4.2 Bandingkan metrik sebelum/sesudah (tableDetection, rowRecall, cellAccuracy).
- [ ] 4.3 Buat laporan perbandingan (Indonesia).
- [ ] 4.4 Generate output review baru (xlsx) -> serahkan ke user untuk review ulang.

Output Fase 4: laporan perbaikan + file review baru siap dicek.

## FASE 5 — (Opsional, blocker integrasi) Bukti Isolasi Jaringan
> Terpisah dari perbaikan OCR, tapi tetap blocker untuk klaim "siap integrasi".

- [ ] 5.1 Siapkan `no-egress-evidence.txt` (bukti isolasi jaringan tingkat OS).
- [ ] 5.2 Lengkapi cakupan corpus (17 tag wajib, saat ini baru 3).
- [ ] 5.3 Tambah negative case (0 `expectedFailure` sekarang).
- [ ] 5.4 Pastikan `representative_coverage` lolos.

## Rekomendasi urutan
Fase 0 -> 1 -> 2 -> 3 -> 4 adalah jalur wajib untuk perbaikan OCR. Fase 5 bisa paralel atau belakangan.

## File referensi penting
- Kode: `ocr-lab/src/bom_ocr/{grid,preprocessing,config,recognition,normalization,cells,benchmark}.py`
- README (aturan & gerbang): `ocr-lab/README.md`
- Benchmark terakhir: `ocr-lab/data/private/runs/diagnostic-full-2026-09-23/report.md` + `report.json`
- 7 gambar gagal: `3.20.52 PM`, `3.21.20 PM`, `3.21.54 PM`, `3.22.13 PM`, `3.22.49 PM`, `3.26.20 PM`, `3.32.27 PM` (semua `.jpeg`)
- Ground truth (22 file): `ocr-lab/data/private/ground-truth/`

## Perintah pembuka chat baru
```
Lanjutkan perbaikan OCR dari task list yang sudah dibuat.
Mulai dari Fase 0 (investigasi read-only): baca grid.py, preprocessing.py,
config.py, dan ukur geometri 7 gambar gagal vs 15 yang lolos.
Jangan ubah kode apa pun dulu. Laporkan temuan akar masalah.
```
