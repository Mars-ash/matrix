# DOKUMENTASI LENGKAP PROTOTYPE SISTEM MATRIX — PROJECT CONTROLLING

> **Sistem:** MATRIX — Project Controlling  
> **Tipe Aplikasi:** High-Fidelity Interactive Web Prototype  
> **Status:** ✅ Selesai & Terverifikasi (Frontend Ready untuk Demo Manajemen)  
> **Basis Teknologi:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Industrial Theme  
> **Lokasi Source Code:** `frontend/`  

---

## DAFTAR ISI
1. [Latar Belakang & Tujuan Prototype](#1-latar-belakang--tujuan-prototype)
2. [Arsitektur Sistem & Spesifikasi Teknologi](#2-arsitektur-sistem--spesifikasi-teknologi)
3. [Struktur Hirarki Data & Model Domain](#3-struktur-hirarki-data--model-domain)
4. [Logika Bisnis & Perhitungan Progress](#4-logika-bisnis--perhitungan-progress)
5. [Fitur-Fitur & Halaman Antarmuka (Lengkap)](#5-fitur-fitur--halaman-antarmuka-lengkap)
   - [5.1 Dashboard Utama (`/`)](#51-dashboard-utama-)
   - [5.2 Halaman Detail JO (`/projects/[projectId]/jos/[joId]`)](#52-halaman-detail-jo-projectsprojectidjosjoid)
   - [5.3 Subcontractor Tracker (`/subcont`)](#53-subcontractor-tracker-subcont)
   - [5.4 Sistem Notifikasi Global & Deadlines](#54-sistem-notifikasi-global--deadlines)
   - [5.5 Modal Pembuatan & Entri Data](#55-modal-pembuatan--entri-data)
6. [Fitur Berdasarkan Masukan Pengguna (User Suggestions)](#6-fitur-berdasarkan-masukan-pengguna-user-suggestions)
7. [Panduan Menjalankan & Pengujian (Walkthrough Demo)](#7-panduan-menjalankan--pengujian-walkthrough-demo)
8. [Roadmap Menuju MVP Backend (Laravel 13)](#8-roadmap-menuju-mvp-backend-laravel-13)

---

## 1. Latar Belakang & Tujuan Prototype

### 1.1 Permasalahan Operasional
Proses pemantauan produksi pada industri manufaktur tooling (*dies*, *jig*, pemesinan presisi, dan fabrikasi) sebelumnya mengandalkan dokumen lembar sebar manual (Excel *CONTROL AS IS*). Beberapa kendala utama metode lama antara lain:
- **Keterlambatan Pembaruan Data:** Status pengerjaan komponen di lantai produksi (*workshop*) dan subkontraktor luar sering terlambat diperbarui ke tim perencana/manajemen.
- **Ketiadaan Visibilitas Terpusat:** Sulit mengidentifikasi komponen kritis yang mengalami masalah (*problem* / *bottleneck*) tanpa membuka file spreadsheet satu per satu.
- **Risiko Keterlambatan Material & Subcont:** Keterlambatan kedatangan bahan mentah (*raw material*) atau komponen dari subkontraktor (*machining/hardening luar*) kerap baru disadari saat mendekati tanggal batas perakitan (*assembly*).

### 1.2 Tujuan Pembuatan Prototype
Prototype interaktif MATRIX dibuat untuk:
1. Memberikan **pengalaman pengguna nyata (high-fidelity clickable prototype)** kepada tim *Staff Engineering*, *Supervisor*, dan *Manajemen* sebelum basis data dan backend diproduksi secara permanen.
2. Memvalidasi alur kerja: mulai dari pembuatan Job Order (JO), pengelompokan kategori part/komponen, pemantauan 7 tahapan proses part internal, penanganan status kendala (*Problem notes*), hingga pelacakan subkontraktor (*Subcont Tracker*).
3. Menyediakan simulasi data operasional riil (menggunakan data JO *Mercedes Tooling Program* seperti JO `126.110` s/d `126.114`).

---

## 2. Arsitektur Sistem & Spesifikasi Teknologi

Prototype ini dibangun murni di sisi *client-side* menggunakan teknologi modern:

| Komponen | Spesifikasi & Keterangan |
|---|---|
| **Framework** | **Next.js 16.3 (App Router)** |
| **Library Utama** | **React 19.2 & TypeScript 5** |
| **Gaya Desain & CSS** | **Tailwind CSS v4** dipadukan dengan variabel token CSS kustom (`globals.css`) bertema *Dark Industrial Control System* |
| **State Management** | **React Context & Reducer (`frontend/lib/store.tsx`)** — *In-memory state* yang reaktif dan responsif secara *real-time* tanpa jeda *network latency* |
| **Manajemen File Gambar** | *Object URL Blob* lokal untuk simulasi foto fisik proses tanpa penyimpanan server |
| **Testing & Typecheck** | Vitest, React Testing Library, JSDOM, dan TypeScript Compiler (`tsc --noEmit`) |

> **Catatan Prototype:** State data tersimpan selama sesi peramban berjalan (*in-memory*). Refresh halaman akan mengembalikan data ke kondisi *mock baseline*. Hal ini dirancang sengaja agar penguji demo bebas memodifikasi data tanpa mengotori basis data asli.

---

## 3. Struktur Hirarki Data & Model Domain

Struktur data aplikasi MATRIX dirancang mencerminkan alur kerja manufaktur *die-making*:

```
Project (Contoh: "Mercedes Tooling Program")
  └── Job Order / JO (1 JO = 1 Produk + 1 Die Set, Contoh: "JO 126.110")
        └── Category (Kelompok Part / Komponen / Custom)
              └── Item (Part atau Komponen Fisik)
                    ├── Process Controls (Status per tahapan proses manufaktur)
                    └── Subcontractor Trackers (Pelacakan jika diproses pihak ke-3)
```

### 3.1 Entitas Utama

#### A. Project
Mewakili kontrak kerja induk atau program manufaktur pelanggan.
- Atribut: `id`, `name` (Nama Project), `customer` (Nama Pelanggan), `jos` (Daftar JO terkait).

#### B. Job Order (JO)
Mewakili satu paket pesanan kerja (1 cetakan dies atau jig tertentu).
- Atribut: `id`, `joNumber` (misal: `126.110`), `product` (nama bagian/part mobil yang dicetak), `type` (tipe proses), `targetDate` (target selesai), `finishDate` (tanggal aktual selesai), `categories`, `activities`.
- **5 Tipe JO (Single-Select):**
  1. `PROGRESSIVE` (Dies progresif kontinu)
  2. `TANDEM` (Dies tandem bertahap)
  3. `JIG` (Alat bantu perakitan / checking fixture)
  4. `WIRECUT SERVICE` (Layanan kawat potong presisi)
  5. `MACHINING SERVICE` (Layanan pemesinan CNC/konvensional)

#### C. Kategori (Category)
Setiap JO memiliki satu atau banyak kategori. Terdapat 2 *Kind* (jenis) kategori:
1. **Kind: `Part`** (Part fabrikasi yang melalui proses pemesinan internal):
   - Kategori Standar: `PART`, `PART DIES`, `PART JIG`, `PART RH`, `PART LH`, `PART DIES OP 10` s/d `OP 50` (kelipatan 10).
2. **Kind: `Component`** (Komponen standar / barang beli jadi / *bought-out standard parts*):
   - Kategori Standar: `COMPONENT`, `COMPONENT DIES`, `COMPONENT JIG`, `COMPONENT RH`, `COMPONENT LH`, `COMPONENT DIES OP 10` s/d `OP 50`.
3. **Custom Category:**
   - Pengguna bebas memberi nama baru (misal: `"SPECIAL INSERT"`, `"SLIDER DIES"`) dengan memilih *Kind* apakah bertipe `Part` atau `Component`.

#### D. Item (Part / Component)
Mewakili setiap baris part fisik di dalam tabel:
- **Atribut Teknis:**
  - `no`: Nomor urut part / nomor posisi gambar (contoh: `01`, `02`).
  - `description`: Deskripsi / nama part (contoh: `PUNCH HOLDER`, `GUIDE PIN`, `DIE PLATE`).
  - `dimension`: Ukuran dimensi part (contoh: `50 x 120 x 200 mm`).
  - `material`: Spesifikasi material (contoh: `SKD11`, `SS400`, `S45C`).
  - `qty`: Jumlah unit yang dibutuhkan.
  - `hrc`: Kekerasan perlakuan panas / *Heat Treatment* (contoh: `58-60`, `-`).
- **Atribut Subkontraktor:**
  - `isSubcont` (boolean): Penanda apakah part ini dikerjakan/dikirim ke subkontraktor luar.
  - `subcontNotes`: Catatan khusus untuk instruksi pengerjaan subkontraktor.
  - `subcontSupplier`: Nama vendor (misal: `CHIYODA`, `PRO-TECH`, `GEMA`, `PUTRA`, `NCI`, `KANETSU`).
  - `subcontStatus`: `"In Progress"` atau `"Done"`.
  - `subcontDispatchDate`: Waktu saat dikirim ke subcont.
  - `arrivalTargetDate`: Target tanggal kedatangan kembali part dari subkontraktor.

#### E. Process Controls (Kontrol Proses)
Kolom kontrol proses yang melekat pada masing-masing item ditentukan oleh jenis kategorinya (*Kind*):
- **Part Category (7 Tahapan Proses):**
  1. `Material` / `PO Mtl` (Pemesanan & penyediaan bahan baku)
  2. `Arrival` (Kedatangan fisik material di workshop)
  3. `Machining` (Pemesinan kasar / CNC Milling)
  4. `Hardening` (Perlakuan panas / Heat treatment)
  5. `Grinding` (Penggerindaan permukaan presisi)
  6. `Wirecut` (Pemotongan kawat EDM presisi)
  7. `Assembly` (Perakitan / Fitting akhir)
- **Component Category (2 Tahapan Proses):**
  1. `PO` (Pemesanan pembelian barang standar)
  2. `Arrival` (Kedatangan barang di gudang/workshop)

---

## 4. Logika Bisnis & Perhitungan Progress

### 4.1 Status Proses & Bobot Nilai

Setiap sel tahapan proses dapat memiliki satu dari 6 status berikut:

| Status | Bobot Nilai | Warna Tampilan | Deskripsi Operasional |
|---|:---:|---|---|
| **`Done`** | **1.0 (100%)** | Hijau Emerald | Tahapan proses telah selesai 100% dan lolos QC. |
| **`In Progress`** | **0.5 (50%)** | Amber / Kuning | Proses sedang berlangsung di bengkel internal. |
| **`In Progress SC`** | **0.5 (50%)** | Ungu / Cyan | Proses sedang berlangsung di subkontraktor luar. |
| **`Not Started`** | **0.0 (0%)** | Biru Slate | Belum dimulai, masih dalam antrean pekerjaan. |
| **`Problem`** | **0.0 (0%)** | Merah Crimson | Mengalami hambatan/cacat. **Wajib mengisi catatan masalah**. |
| **`-`** | *Excluded* | Abu-abu Gelap | Proses tidak berlaku untuk part ini (dikeluarkan dari rumus). |

### 4.2 Rumus Perhitungan Persentase Progress

Perhitungan persentase progress dilakukan murni dan matematis (*pure functions*) baik di tingkat Kategori maupun JO:

$$\text{Persentase Progress} = \frac{\sum (\text{Bobot Sel Berlaku})}{\text{Jumlah Sel dengan Status} \ne \text{'-'}} \times 100\%$$

**Aturan Khusus:**
- Jika seluruh sel berstatus `'-'` (tidak ada proses aktif), tampilan progress menampilkan tanda strip (`-`).
- Status pelacakan subkontraktor (*Subcont Tracker*) adalah pelacak alur logistik mandiri dan **tidak mendistorsi** bobot progress manufaktur inti.

### 4.3 Alur Kendala (*Problem Flow*)
1. Ketika pengguna mengubah status proses apa pun menjadi `Problem`, sistem secara otomatis memunculkan modal dialog **Problem Notes**.
2. **Validasi Wajib:** Tombol *Save/Confirm* terkunci jika kolom penjelasan kendala kosong.
3. **Rollback Otomatis:** Jika pengguna menekan tombol *Cancel* atau menutup dialog, status sel dikembalikan (*rollback*) ke status sebelumnya tanpa mengubah progres.
4. Jika catatan diisi dan dikonfirmasi, entri audit baru otomatis ditambahkan ke **Activity & Problem Log** dengan stempel waktu real-time.

---

## 5. Fitur-Fitur & Halaman Antarmuka (Lengkap)

### 5.1 Dashboard Utama (`/`)

Dashboard menyajikan gambaran menyeluruh portofolio proyek manufaktur:
1. **Ringkasan Kartu KPI Atas:**
   - Menghitung total proyek aktif.
   - Menghitung total Job Order berjalan.
   - Indikator bahaya merah yang menampilkan total kendala aktif (*active problems*) di seluruh JO.
2. **Universal Live Search:**
   - Input pencarian cepat di kanan atas yang menyaring data secara instan berdasarkan: Nama Proyek, Nama Pelanggan (*Customer*), Nomor JO, Nama Produk, maupun Tipe JO.
3. **Menu Tombol Tunggal "New Item":**
   - Menggantikan tombol yang terpisah sebelumnya menjadi satu tombol ringkas dengan menu dropdown:
     - 📁 **New Project:** Membuka modal pembuatan nama project & customer baru.
     - 📋 **New JO:** Membuka modal pembuatan JO baru dengan pilihan tipe dan multi-kategori.
     - ➕ **New Data:** Shortcut cepat input manual part langsung dari dashboard.
4. **Daftar Kartu Proyek & JO:**
   - Setiap kartu JO menampilkan: Nomor JO, Nama Produk, Badge Tipe JO, Bar Progress Visual interaktif, Counter badge kendala jika ada masalah, dan informasi aktivitas terakhir.

---

### 5.2 Halaman Detail JO (`/projects/[projectId]/jos/[joId]`)

Halaman kerja utama bagi tim *engineering* untuk mengontrol proses part demi part:

1. **Header Lock-up Industrial:**
   - Tampilan visual nomor JO (misal `JO 126.110`) bersanding dengan jenis JO (`PROGRESSIVE`) dan nama produk.
   - Indikator angka persentase progres berukuran besar yang otomatis berganti warna hijau saat mencapai 100%.
   - Target tanggal penyelesaian JO.
2. **Tombol "Activity & Problem Log":**
   - Membuka panel geser (*slide-out drawer*) dari kanan layar.
   - Menampilkan riwayat kronologis lengkap: pembuatan part, perubahan status, catatan masalah kendala (*problem descriptions*), pendelegasian subkontraktor, serta perubahan tanggal target.
3. **Tombol "Finish JO":**
   - Dialog konfirmasi untuk mengunci dan menandai JO selesai dengan mencatat tanggal hari ini secara otomatis.
4. **Category Quick Jump Tabs:**
   - Bar navigasi horizontal di bawah header yang berisi tab semua kategori dalam JO.
   - Dilengkapi persentase progres masing-masing kategori. Menekan tab langsung menggulirkan layar (*smooth scroll*) ke tabel kategori terkait.
5. **Fitur Live Item Search Bar (`JoItemSearch`):**
   - Fitur pencarian spesifik untuk menemukan part/komponen di seluruh kategori dalam satu JO.
   - Menampilkan saran nama part, nomor part, dan kategori asalnya.
   - Saat item diklik, halaman otomatis melakukan *smooth scroll* tepat ke baris tabel part tersebut dan memberikan **efek animasi sorot berkedip (highlight pulse)** pada baris bersangkutan.
6. **Tabel Kontrol Proses (Control Table):**
   - **Sticky Columns:** Kolom kotak centang (*checkbox*) dan nomor urut part tetap terkunci di sisi kiri saat pengguna menggulirkan tabel ke arah proses kanan (*horizontal scroll*).
   - **Data Komponen:** Deskripsi, Dimensi material, Spesifikasi bahan, Qty, dan Standar Kekerasan (HRc).
   - **Kolom Proses Interaktif:** Dropdown status dengan kode warna intuitif pada setiap sel tahapan pengerjaan.
   - **Bukti Foto Aktual (`ProcessPhotoDialog`):**
     - Setiap sel proses memiliki tombol kamera / indikator jumlah foto.
     - Pengguna dapat mengunggah atau mengambil gambar posisi fisik komponen di mesin.
     - Pratinjau foto langsung muncul di modal dialog untuk verifikasi visual mandor/supervisor.
7. **Tombol "+ Add New Category":**
   - Berada di posisi paling bawah setelah seluruh tabel kategori.
   - Memungkinkan tim menambahkan kategori baru kapan saja di tengah jalannya proyek tanpa harus membuat JO ulang.
8. **Floating Bulk Action Bar (Aksi Massal Part):**
   - Muncul otomatis mengambang di bawah layar begitu satu atau beberapa part dicentang.
   - Menampilkan informasi jumlah part yang dipilih (`X Part Terpilih`).
   - Menyediakan 4 opsi aksi massal:
     1. **Set Target Arrival:** Mengatur tanggal target kedatangan material untuk semua part yang dipilih sekaligus.
     2. **Ubah Status:** Mengubah status pengerjaan proses tertentu secara massal (misal: langsung mengubah proses `Machining` 10 part menjadi `In Progress` atau `Done`).
     3. **Kirim ke Subcont:** Mendisposisikan part terpilih ke supplier luar, menetapkan vendor pilihan, dan menetapkan target kedatangan.
     4. **Hapus Part:** Menghapus part-part terpilih sekaligus dengan dialog konfirmasi aman.

---

### 5.3 Subcontractor Tracker (`/subcont`)

Halaman khusus yang didedikasikan untuk bagian *Procurement*, *Ekspedisi*, dan *Engineering* dalam memonitor barang-barang yang dikerjakan pihak ketiga:

1. **4 Kartu Metrik KPI:**
   - **Active Subcont:** Jumlah komponen yang saat ini sedang berada di pihak subkontraktor.
   - **Urgent (H-3 & Hari H):** Komponen dengan batas kedatangan tersisa 3 hari atau jatuh tempo hari ini.
   - **Overdue:** Komponen yang telah melewati batas target kedatangan dan berisiko menghentikan perakitan dies.
   - **Recently Done:** Komponen yang baru saja selesai dalam kurun 5 menit terakhir.
2. **Filter, Pengelompokan & Pengurutan Cerdas:**
   - **Pencarian Cepat:** Mencari berdasarkan nama part, nomor JO, maupun nama supplier.
   - **Mode Grouping:**
     - *None:* Daftar datar berurut.
     - *By JO:* Dikelompokkan per Job Order.
     - *By Supplier:* Dikelompokkan berdasarkan mitra vendor (`CHIYODA`, `PRO-TECH`, `GEMA`, `PUTRA`, `NCI`, `KANETSU`).
   - **Mode Sorting:** Berdasarkan part terbaru, tanggal batas tempo terdekat (*deadline*), nomor JO, nama supplier, atau jumlah kuantitas (*qty*).
3. **Peringatan Batas Waktu Otomatis:**
   - `Overdue Xd` (Warna Merah Menyala): Keterlambatan kedatangan.
   - `Hari H` (Warna Amber Kuning): Kedatangan harus tiba hari ini.
   - `H-X` (Warna Amber Kuning): Menghitung mundur batas hari tersisa.
4. **Aturan Auto-Archive (5 Menit):**
   - Komponen subcont yang diubah statusnya menjadi `Done` akan tetap tampil di daftar aktif selama **5 menit** untuk memberikan kesempatan verifikasi penerimaan barang fisik, sebelum otomatis diarsipkan dari daftar aktif guna menjaga tampilan tetap bersih.
5. **In-place Quick Editor:**
   - Pengguna dapat langsung mengganti nama supplier, memperbarui estimasi tanggal tiba, mengubah status, serta melihat/mengubah catatan pengerjaan subcont langsung dari baris tabel.

---

### 5.4 Sistem Notifikasi Global & Deadlines

Komponen lonceng notifikasi pada navigasi atas (`NotificationBell` di `AppShell`) secara otomatis mengagregasi seluruh tenggat waktu kritis dari seluruh proyek:
- Notifikasi keterlambatan (*Overdue*) material arrival internal.
- Notifikasi pengingat H-3 dan Hari H kedatangan material / PO.
- Notifikasi kedatangan barang dari mitra subkontraktor.
- Mengklik notifikasi memberikan visibilitas langsung terhadap nomor JO dan part yang membutuhkan perhatian mendesak.

---

### 5.5 Modal Pembuatan & Entri Data

1. **Modal New Project:** Pembuatan entitas project dengan nama dan identitas pelanggan.
2. **Modal New JO:**
   - Pengisian nomor JO dan nama produk cetakan.
   - Pemilihan jenis JO (*Single Select*).
   - Pengisian target tanggal rampung JO.
   - Pemilihan multi-kategori awal dengan kotak centang (*multi-select checkboxes*), mencakup kategori standar Part dan Component.
   - Form pembuatan kategori *Custom* langsung saat pendaftaran JO.
3. **Modal New Data (Dashboard Shortcut):**
   - Alur bertahap 3 langkah:
     1. Pilih Proyek sasaran.
     2. Pilih Job Order sasaran.
     3. Pilih Kategori sasaran.
     4. Tampil formulir pengisian data part lengkap.
4. **Formulir Item Part Manual (`ManualItemForm`):**
   - Nomor part, Deskripsi (wajib), Dimensi, Material, Qty, dan HRc.
   - Kotak centang **"Subcont"**: Jika dicentang, kolom input **"Keterangan Subcont"** otomatis muncul untuk memasukkan spesifikasi instruksi pengerjaan luar.
5. **Simulasi Image Conversion (Future Feature):**
   - Mode unggah gambar rancangan CAD / gambar teknik (format JPG/PNG).
   - Menampilkan tabel simulasi hasil ekstraksi otomatis (*OCR*) yang dapat diedit sebelum disetujui, ditandai jelas dengan label *"SIMULATED — FUTURE FEATURE"* sebagai persiapan fase integrasi GstarCAD.

---

## 6. Fitur Berdasarkan Masukan Pengguna (User Suggestions)

Semua poin masukan pengguna yang tercantum pada dokumen operasional (`docs/Users_Suggestion.md`) telah diimplementasikan secara penuh pada prototype:

| No | Poin Masukan Pengguna | Status | Implementasi pada Prototype |
|:---:|---|:---:|---|
| **1** | Fitur *"New Data"* dari halaman utama (Dashboard), dengan menyatukan tombol *New Project*, *New JO*, dan *New Data* ke dalam satu tombol dropdown *"New Item"*. | ✅ Selesai | Komponen `NewItemMenu` & `NewDataDialog` terpasang di header Dashboard. |
| **2** | Menambahkan tombol *"Add New Category"* di bagian paling bawah halaman JO. | ✅ Selesai | Komponen `CategoryCreateDialog` terpasang di bawah tabel seluruh kategori pada halaman detail JO. |
| **3** | Kolom & opsi pengerjaan Part disubkontrakkan (*Keterangan Part Subcont*). | ✅ Selesai | Checkbox *Subcont* dan input *Keterangan Subcont* tersedia pada penambahan data manual serta tabel kontrol. |
| **4** | Pencarian (*Search Bar*) spesifik part/komponen di dalam halaman JO yang langsung melompat ke baris part terkait. | ✅ Selesai | Komponen `JoItemSearch` terpasang di bar navigasi JO; mengarahkan *smooth scroll* dan memberikan efek *highlight pulse* pada baris yang dipilih. |
| **5** | *PO, Arrival, dan Subcont Tracker*. | ✅ Selesai | Halaman dedicated `/subcont` dengan kartu metrik KPI, sorting, grouping vendor, dan pelacak kedatangan terintegrasi. |
| **6** | Kemampuan melampirkan foto aktual (*take picture/upload photo*) untuk setiap tahapan proses part. | ✅ Selesai | Komponen `ProcessControlCell` dan `ProcessPhotoDialog` memungkinkan pratinjau bukti foto langsung pada setiap sel tahapan proses. |

---

## 7. Panduan Menjalankan & Pengujian (Walkthrough Demo)

### 7.1 Menjalankan Aplikasi Secara Lokal

Pastikan Anda membuka terminal di folder `frontend/`:

```bash
cd frontend

# 1. Menjalankan pemeriksaan tipe data (TypeScript)
npm run typecheck

# 2. Menjalankan build produksi untuk validasi kompilasi
npm run build

# 3. Menjalankan server pengembangan (Development Server)
npm run dev
```

Buka peramban (*browser*) pada alamat: **`http://localhost:3000`**

---

### 7.2 Skenario Pengujian Alur Demo (Demo Flow)

Untuk mendemonstrasikan keunggulan sistem kepada manajemen atau tim pengguna, ikuti skenario berikut:

1. **Eksplorasi Dashboard:**
   - Perhatikan 5 JO demo pada proyek *"Mercedes Tooling Program"* (`126.110` s/d `126.114`).
   - Coba ketik kata kunci pada kotak pencarian di kanan atas (misal: `"126.110"` atau `"TANDEM"`).
   - Klik tombol **"New Item"** untuk melihat 3 opsi pembuatan (*New Project*, *New JO*, *New Data*).
2. **Masuk ke Halaman Detail JO `126.110`:**
   - Klik kartu **JO 126.110**.
   - Perhatikan ringkasan header: Angka progress besar, target tanggal penyelesaian, dan indikator kendala.
   - Gunakan fitur **Pencarian Part** di atas tabel (ketik misalnya `"PUNCH"` atau `"DIE"`), lalu klik salah satu hasil pencarian. Layar akan otomatis melompat dan menyorot baris part tersebut.
3. **Interaksi Perubahan Status & Alur Problem:**
   - Pilih salah satu sel proses part, ubah statusnya menjadi **"Problem"**.
   - Dialog catatan kendala akan muncul. Coba kosongkan catatan (tombol simpan tidak dapat ditekan). Masukkan catatan masalah seperti *"Pahat aus saat proses roughing"*, lalu simpan.
   - Amati persentase progres yang otomatis menghitung ulang dan tombol **"Activity & Problem Log"** yang kini mencatat riwayat tersebut.
4. **Mengunggah Bukti Foto Proses:**
   - Klik ikon kamera kecil di dalam salah satu sel proses.
   - Unggah file gambar pengujian untuk memverifikasi bahwa bukti kondisi aktual tersimpan dan dapat dilihat kembali oleh mandor.
5. **Uji Coba Aksi Massal (Bulk Action):**
   - Centang 3 part di kolom paling kiri tabel.
   - Amati munculnya *Floating Bulk Action Bar* di bagian bawah layar.
   - Klik tombol **"Set Target Arrival"** atau **"Kirim ke Subcont"** untuk memperbarui data beberapa part secara serentak.
6. **Melihat Halaman Subcont Tracker:**
   - Klik menu navigasi **"Subcont Tracker"** di bilah atas.
   - Amati pembagian kategori deadline (Overdue, Hari H, H-3).
   - Ubah mode tampilan dari *None* menjadi *By Supplier* atau *By JO*.
   - Ubah status salah satu item menjadi *Done* dan perhatikan bahwa item tetap berada di layar selama 5 menit sebelum diarsipkan otomatis.

---

## 8. Roadmap Menuju MVP Backend (Laravel 13)

Setelah prototype interaktif ini disetujui oleh pihak manajemen, tahap implementasi backend akan mengacu pada spesifikasi arsitektur berikut:

1. **Basis Data & Migrasi (MySQL / MariaDB):**
   - Tabel `projects` (id, name, customer, created_at).
   - Tabel `jos` (id, project_id, jo_number, product, type, target_date, finish_date).
   - Tabel `categories` (id, jo_id, label, kind, is_custom).
   - Tabel `items` (id, category_id, no, description, dimension, material, qty, hrc, is_subcont, subcont_notes, subcont_supplier, subcont_status, arrival_target_date).
   - Tabel `controls` (id, item_id, process, status, notes, in_progress_at, target_date).
   - Tabel `control_photos` (id, control_id, file_path, original_name, created_at).
   - Tabel `activities` (id, jo_id, message, created_at).
2. **REST API (Laravel 13 Controllers & Form Requests):**
   - `GET /api/projects` & `POST /api/projects`
   - `GET /api/projects/{id}/jos/{joId}`
   - `POST /api/jos` & `PATCH /api/jos/{id}/finish`
   - `POST /api/categories`
   - `POST /api/items` & `POST /api/items/bulk-update`
   - `PATCH /api/controls/{id}/status`
   - `POST /api/controls/{id}/photos` (Multi-part file upload ke Laravel Storage)
3. **Autentikasi & Otorisasi Pengguna:**
   - Laravel Sanctum token-based authentication.
   - Pembagian peran:
     - **Staff Engineering / Workshop Admin:** Akses penuh untuk membuat JO, mengubah status proses, melampirkan foto, dan mengatur subkontraktor.
     - **Supervisor / Manajemen:** Akses pemantauan (*read-only dashboard* & laporan analitik progres).

---
*Dokumen ini disusun sebagai acuan resmi arsitektur, fungsionalitas, dan panduan pengujian prototype sistem MATRIX Project Controlling.*
