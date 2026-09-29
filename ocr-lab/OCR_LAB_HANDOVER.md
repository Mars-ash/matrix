# Handover Dokumentasi: Modul Local BOM OCR Lab (`ocr-lab`)

> **Status Saat Ini:** **DIHENTIKAN SEMENTARA (PAUSED / ON-HOLD)**  
> **Tanggal Pembaruan Terakhir:** 28 September 2026  
> **Direktori Modul:** `c:\laragon\www\matrix\ocr-lab`  
> **Environment:** Python 3.11.15 (`ocr-lab/.venv`), PaddleOCR 3.7.0, PaddlePaddle 3.3.1 (CPU-only)  
> **Titik Lanjut Ketika Diaktifkan Kembali:** **FASE 2.1 — Perbaiki Deteksi Grid di `src/bom_ocr/grid.py`**

---

## 1. GOAL (Tujuan Utama & Standar Kualitas)

### Visi & Alasan Modul Dibuat
Proyek **MATRIX** adalah sistem estimasi dan manajemen manufaktur mold/dies. Gambar drawing teknik (BOM - *Bill of Materials*) pelanggan bersifat **rahasia dagang (Intellectual Property / NDA)** yang tidak boleh sembarangan dikirim ke API cloud pihak ketiga.

Modul `ocr-lab` dibuat sebagai **mesin ekstraksi OCR lokal, mandiri (standalone), CPU-only (tanpa GPU), dan on-premise**, sehingga pemrosesan gambar teknik berjalan 100% di dalam server lokal/jaringan tertutup pabrik tanpa kebocoran data keluar (*no data egress*).

### Prinsip Utama (Non-Negotiable)
1. **Human-in-the-Loop (Review-Only):**
   * Output OCR berstatus **DRAFT**, tidak pernah otomatis langsung disimpan ke database MATRIX. User (Controller/Estimator) wajib meninjau dan mengonfirmasi.
2. **Zero Hallucination / No Invented Rows:**
   * Jika ekstraksi tabel gagal atau kualitas gambar buruk, kembalikan daftar baris kosong (`[]`) dan kode peringatan (*warnings*). **Dilarang keras mengarang data atau memunculkan baris contoh/dummy**.
3. **CPU-Only & Hemat Resource:**
   * Dirancang berjalan lancar pada CPU prosesor standar (misal Intel Core i7 gen 8 atau VPS CPU modern) tanpa kartu grafis NVIDIA/CUDA. Menggunakan model ringan `PP-OCRv5_mobile_rec`.
4. **Isolasi Penuh:**
   * Tidak boleh melakukan unduhan model otomatis atau retry ke API remote saat proses ekstraksi berlangsung.

### Standar Kualitas (Hard Benchmark Gates)
Sebelum diizinkan diintegrasikan ke backend Laravel MATRIX, pipeline lokal wajib lulus uji benchmark 22 gambar private dengan kriteria ambang batas:
* **Table Detection:** $\ge 98\%$
* **Data-Row Recall:** $\ge 98\%$
* **Normalized Non-Empty Cell Exact Match:** $\ge 95\%$
* **Field Accuracy (`no` dan `qty`):** Masing-masing $\ge 99\%$
* **Repeatability:** $100\%$ deterministik (output identik diulang 3x)
* **P95 Latency:** $\le 20$ detik per gambar pada CPU target
* **Network Isolation Evidence:** Bukti audit OS bahwa proses OCR tidak membuka socket internet keluar (`no-egress-evidence.txt`).

---

## 2. PLAN (Rencana Arsitektur & Roadmap Perbaikan)

### A. Alur Pemrosesan (Pipeline Architecture)
```
Input Gambar (PNG/JPG)
   │
   ▼
[Preprocessing] -> EXIF orientation, deskew rotasi kecil, resize batas sisi max 2048px
   │
   ▼
[Ruled Grid Detection] -> Deteksi garis horizontal & vertikal (OpenCV), validasi border luar & stub check
   │
   ▼
[Cell Slicing] -> Pemotongan koordinat sel tabel (merujuk pada resolusi asli gambar)
   │
   ▼
[PaddleOCR Text Recognition] -> Inferensi teks per sel menggunakan PP-OCRv5_mobile_rec CPU
   │
   ▼
[Normalization & Validation] -> Standardisasi format (no, dimension, material, qty, hrc), flag jika ambigu
   │
   ▼
[Review Output] -> review.json, annotated.png (visual bounding box), dan export XLSX
```

### B. Tahapan Roadmap Perbaikan (Fase 0 s/d 5)
* **Fase 0: Investigasi Read-Only** $\rightarrow$ Membedah akar masalah 7 gambar gagal dari 22 corpus. *(Selesai)*
* **Fase 1: Regression Test Suite** $\rightarrow$ Membuat tes otomatis yang mereproduksi bug sebelum kode disentuh. *(Selesai)*
* **Fase 2: Perbaiki Deteksi Grid** $\rightarrow$ Memperbaiki algoritma pemisah border-bleed vs truncated-stub agar 7 gambar masuk tanpa merusak 15 gambar yang sudah lolos. *(Tertunda — Siap Dikerjakan)*
* **Fase 3: Perbaiki Pengenalan Sel** $\rightarrow$ Menangani ambiguitas karakter `0`/`O` di nomor part, spasi dimensi, simbol diameter `Ø`, tanda strip HRC, dan pemotongan teks.
* **Fase 4: Re-benchmark & Serah ke Review** $\rightarrow$ Menjalankan benchmark penuh 22 gambar 3 repeat, membuat laporan metrik (Indonesia), dan menyerahkan file XLSX baru.
* **Fase 5: Bukti Isolasi Jaringan & Kesiapan Integrasi** $\rightarrow$ Pengujian isolasi egress, melengkapi corpus 17 tag wajib, dan menyusun spesifikasi Docker.

### C. Rencana Integrasi ke MATRIX (Setelah Lolos Benchmark)
* Mengemas core `ocr-lab` menjadi service HTTP privat (FastAPI/Flask) di dalam container `docker/Dockerfile.ocr`.
* Memasang service ke `docker-compose.yml` hanya di internal network (tidak membuka port ke internet).
* Laravel backend bertindak sebagai orkestrator:
  1. Default: Panggil Local OCR container.
  2. Jika Local OCR mengembalikan warning atau gagal: Munculkan hasil apa adanya + opsi tombol *"Coba dengan Gemini"* dengan konfirmasi privasi eksplisit.

---

## 3. PROGRESS (Kemajuan yang Telah Dicapai)

Sebelum modul dihentikan sementara, seluruh target **Fase 0** dan **Fase 1** telah selesai:

### 1. Temuan Fase 0 (Akar Masalah Kegagalan 7 Gambar)
* Dari 22 gambar BOM private, **15 gambar lolos** dan **7 gambar gagal** (`no_table`).
* **Akar Masalah:** Garis pembatas sel pada gambar raster tertentu menembus/melebihi garis luar (border) sebesar 1–2 piksel (*border-bleed*). Mekanisme *conservative stub check* di `src/bom_ocr/grid.py` saat ini menganggap kelebihan 1–2 px tersebut sebagai indikasi adanya sel tabel luar yang terpotong (*truncated stub*), sehingga tabel sengaja ditolak demi keamanan.
* Dibuat script diagnostik `ocr-lab/diag_bleed.py` untuk mengukur perilaku mask OpenCV terhadap pola border-bleed ini.

### 2. Capaian Fase 1 (Regression Test & Normalisasi Kuantitas)
* **Synthetic Regression Fixture Dibuat:**
  * File: `ocr-lab/tests/test_grid_bleed_regression.py`
  * `test_truncated_stub_is_rejected` $\rightarrow$ **PASSED** (memastikan tabel terpotong sungguhan tetap ditolak dengan aman).
  * `test_border_bleed_past_complete_outer_border_is_accepted` $\rightarrow$ **FAILED (Reproduced!)** (berhasil mereproduksi kegagalan deteksi pada border-bleed).
* **Penambahan Tes Leading Truncated Stubs:**
  * Menambahkan parameterisasi crop sisi kiri dan atas pada `ocr-lab/tests/test_grid.py`.
* **Fitur Sided Quantity (`1R / 1L`):**
  * Di manufaktur mold/dies, part sering memiliki kuantitas bersisi kanan/kiri (`1R / 1L`). Modul telah diperbarui di `normalization.py`, `validation.py`, dan `test_benchmark.py` agar nilai ini dipertahankan utuh dan tidak dijumlahkan sembarangan, serta memunculkan flag review `sided_quantity`.
* **Kondisi Test Suite Unit Test:**
  * **314 test PASSED**, **1 test FAILED** (tes regresi border-bleed yang memang disiapkan untuk dihijaukan pada Fase 2), dan **1 test SKIPPED**.

---

## 4. SALINAN TASK LIST LENGKAP ([TASK_LIST_OCR_FIX.md](TASK_LIST_OCR_FIX.md))

Berikut adalah status terkini dari dokumen `TASK_LIST_OCR_FIX.md`:

```markdown
# TASK LIST — Perbaiki OCR Pipeline (BOM OCR Lab)

**Tanggal:** 2026-09-24 (Diperbarui: 2026-09-28)
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

Output Fase 0: daftar akar masalah yang terukur, bukan tebakan. (SELESAI)

## FASE 1 — Regression Test (syarat sebelum ubah kode)
- [x] 1.1 Buat synthetic fixture yang membedakan **border-bleed** (harus LOLOS) vs **truncated stub** (harus DITOLAK).
- [x] 1.2 Tambahkan pytest untuk kasus 7 gambar (atau pola geometrinya).
- [x] 1.3 Pastikan test FAIL sekarang (mereproduksi bug) -> buktikan test menangkap masalah.
- [x] 1.4 Jalankan seluruh test suite existing (pastikan unit test tetap hijau).

Output Fase 1: test yang "merah" sebelum fix, "hijau" setelah fix. (SELESAI)

## FASE 2 — Perbaiki Deteksi Grid (dampak ~91% error) [TERTUNDA / NEXT POINT]
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
```

---

## 5. PANDUAN MELANJUTKAN KEMBALI (HOW TO RESUME)

Saat modul ini hendak dilanjutkan di kemudian hari, ikuti langkah berikut:

### Langkah 1: Pengecekan Environment
Pastikan menggunakan interpreter virtual environment lokal (`.venv`), bukan Python sistem:
```powershell
Set-Location C:\laragon\www\matrix\ocr-lab
.\.venv\Scripts\python.exe --version
# Output wajib: Python 3.11.x

.\.venv\Scripts\bom-ocr.exe check-env
```

### Langkah 2: Menjalankan Tes Regresi (Memverifikasi Status Terakhir)
Jalankan tes regresi untuk melihat tes merah yang menunggu perbaikan:
```powershell
.\.venv\Scripts\pytest tests\test_grid_bleed_regression.py --basetemp=build\tmp -v
```
*Hasil yang diharapkan saat ini:* `test_truncated_stub_is_rejected` **PASSED**, `test_border_bleed_past_complete_outer_border_is_accepted` **FAILED**.

### Langkah 3: Eksekusi Titik Mulai (Fase 2.1)
Buka file `ocr-lab/src/bom_ocr/grid.py`, fokus pada fungsi:
* `_source_edge_bounds`
* `_has_partial_separator`
* `_grid_candidate`
Perbaiki logika toleransi bleed 1–2 px pada garis luar tanpa menghapus proteksi terhadap sel terpotong sungguhan (*truncated stub*). Target perbaikan: kedua tes di `test_grid_bleed_regression.py` harus berubah menjadi **PASSED (Hijau)**.

---

### Prompt Siap Pakai untuk Membuka Chat/Sesi Baru Nanti:
Salin teks di bawah ini ke prompt chat AI saat ingin melanjutkan pengerjaan:

```text
Lanjutkan pekerjaan pada modul ocr-lab berdasarkan dokumentasi di ocr-lab/OCR_LAB_HANDOVER.md.
Status modul: Fase 0 dan Fase 1 sudah selesai. 
Mulai langsung dari FASE 2.1: Perbaiki logika deteksi grid di src/bom_ocr/grid.py agar tes regresi di tests/test_grid_bleed_regression.py menjadi HIJAU (border-bleed lolos, truncated stub tetap ditolak).
Gunakan Python 3.11 di .venv (jangan gunakan Python sistem).
Jangan ubah logika stub check tanpa memastikan seluruh unit test tetap hijau.
```
