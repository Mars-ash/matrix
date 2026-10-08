# Panduan Lengkap Perhitungan Progress MATRIX

Dokumen ini menjelaskan alur, logika, bobot, dan rumus perhitungan persentase kemajuan (*progress*) pada sistem MATRIX Project Controlling.

---

## 1. Konsep Dasar & Hirarki Data

Perhitungan kemajuan di sistem MATRIX dihitung dari level terbawah (proses kontrol) hingga level teratas (Job Order):

```text
Job Order (JO) — Level 4: Total Keseluruhan
 ├── Kategori 1 (PART) — Level 3: Subtotal Kategori Part
 │    ├── Item 1 (Punch Holder) — Level 2: Item Part ──> [7 Proses Kontrol] — Level 1
 │    └── Item 2 (Die Plate)    — Level 2: Item Part ──> [7 Proses Kontrol] — Level 1
 └── Kategori 2 (COMPONENT) — Level 3: Subtotal Kategori Component
      ├── Item 3 (Guide Pin)    — Level 2: Item Component ──> [2 Proses Kontrol: PO, Arrival]
      └── Item 4 (Coil Spring)  — Level 2: Item Component ──> [2 Proses Kontrol: PO, Arrival]
```

### Penjelasan Hirarki:
1. **Level 1 — Sel Proses Kontrol (*Control Cell*)**: Unit terkecil yang mencatat status pekerjaan (misal: Machining, Hardening, PO, Arrival).
2. **Level 2 — Item (Part / Component)**: Satu baris fisik pada tabel kontrol (misal: 1 baris Punch, 1 baris Baut).
3. **Level 3 — Kategori (*Category*)**: Tabel pengelompokan item sejenis (Kategori PART, Kategori COMPONENT).
4. **Level 4 — Job Order (*JO / Total Keseluruhan*)**: Akumulasi dari seluruh kategori yang ada di dalam satu JO.

---

## 2. Nilai Bobot Status (*Weight System*)

Setiap status pada proses kontrol memiliki nilai angka tetap:

| Status | Nilai Bobot | Keterangan |
| :--- | :---: | :--- |
| **Done** | **1.0** | Proses telah selesai 100% |
| **In Progress** | **0.5** | Sedang dikerjakan internal (50%) |
| **In Progress SC** | **0.5** | Sedang dikerjakan subkontraktor/maklun (50%) |
| **Not Started** | **0.0** | Pekerjaan belum dimulai (0%) |
| **Problem** | **0.0** | Mengalami masalah/kendala teknis (0%) |
| **Tanda Strip (-)** | **Diabaikan (Excluded)** | Tidak dibutuhkan; tidak dihitung sebagai poin maupun pembagi |

> **Catatan Penting untuk Tanda Strip (-):**
> Jika suatu part tidak memerlukan proses tertentu (diberi tanda `-`), proses tersebut **tidak dimasukkan ke pembagi**. Hal ini mencegah persentase turun akibat proses yang memang tidak perlu dilakukan.

---

## 3. Perbedaan Tahapan Proses: Part vs Component

* **Kategori PART** memiliki hingga **7 tahapan proses**:
  1. Material
  2. Arrival
  3. Machining
  4. Hardening
  5. Grinding
  6. Wirecut
  7. Assembly

* **Kategori COMPONENT / Standard Part** hanya memiliki **2 tahapan proses**:
  1. **PO** (Penerbitan Purchase Order ke supplier)
  2. **Arrival** (Kedatangan barang dari supplier)

Karena jumlah prosesnya berbeda:
* 1 item Part menyumbang hingga **7 poin pembagi**.
* 1 item Component menyumbang **2 poin pembagi**.

---

## 4. Rumus Utama Perhitungan

Perhitungan progress menggunakan rumus akumulasi langsung:

```text
Progress (%) = (Total Poin Bobot yang Didapat / Total Seluruh Proses Aktif) * 100%
```

### Mengapa TIDAK Menggunakan Rata-Rata Persentase Kategori?
Sistem **tidak** menggunakan rata-rata sederhana `(Progress Part + Progress Component) / 2`. 

Alasannya: Kategori Part memiliki proses pekerjaan yang jauh lebih panjang (7 proses per item) dibanding Component (2 proses per item). Dengan menjumlahkan seluruh poin lalu membaginya dengan seluruh proses aktif, kontribusi setiap pekerjaan dihitung secara adil dan proporsional.

---

## 5. Studi Kasus Lengkap: 2 Item Part & 2 Item Component

Berikut simulasi riil Job Order dengan total **4 Item** (2 Part dan 2 Component).

---

### A. Kategori PART (2 Item)

#### **1. Item Part 1: Punch Holder** (7 proses aktif)
* Material: Done = **1.0**
* Arrival: Done = **1.0**
* Machining: Done = **1.0**
* Hardening: Done = **1.0**
* Grinding: In Progress = **0.5**
* Wirecut: Not Started = **0.0**
* Assembly: Not Started = **0.0**
* **Subtotal Part 1:**
  * Poin = 1.0 + 1.0 + 1.0 + 1.0 + 0.5 + 0.0 + 0.0 = **4.5**
  * Jumlah proses aktif = **7 proses**

#### **2. Item Part 2: Die Plate** (6 proses aktif, 1 proses tanda strip `-`)
* Material: Done = **1.0**
* Arrival: Done = **1.0**
* Machining: In Progress SC = **0.5** *(dikerjakan maklun)*
* Hardening: Not Started = **0.0**
* Grinding: Not Started = **0.0**
* Wirecut: **-** *(tidak perlu wirecut, diabaikan dari hitungan)*
* Assembly: Not Started = **0.0**
* **Subtotal Part 2:**
  * Poin = 1.0 + 1.0 + 0.5 + 0.0 + 0.0 + 0.0 = **2.5**
  * Jumlah proses aktif = **6 proses**

#### **Rekap Kategori PART:**
* Total Poin Part = 4.5 + 2.5 = **7.0**
* Total Proses Part = 7 + 6 = **13 proses**
* **Progress Kategori PART** = (7.0 / 13) * 100% = **53.8%** (tampil di header kategori: **54%**)

---

### B. Kategori COMPONENT (2 Item)

#### **1. Item Component 1: Guide Pin** (2 proses aktif)
* PO: Done = **1.0**
* Arrival: Done = **1.0** *(barang sudah datang di pabrik)*
* **Subtotal Component 1:**
  * Poin = 1.0 + 1.0 = **2.0**
  * Jumlah proses aktif = **2 proses** (Progress item = 100%)

#### **2. Item Component 2: Coil Spring** (2 proses aktif)
* PO: Done = **1.0** *(PO sudah terbit)*
* Arrival: Not Started = **0.0** *(barang masih dalam pengiriman)*
* **Subtotal Component 2:**
  * Poin = 1.0 + 0.0 = **1.0**
  * Jumlah proses aktif = **2 proses** (Progress item = 50%)

#### **Rekap Kategori COMPONENT:**
* Total Poin Component = 2.0 + 1.0 = **3.0**
* Total Proses Component = 2 + 2 = **4 proses**
* **Progress Kategori COMPONENT** = (3.0 / 4) * 100% = **75.0%** (tampil di header kategori: **75%**)

---

### C. Perhitungan PROGRESS TOTAL JO (Seluruh Kategori)

Seluruh poin bobot dan seluruh proses aktif dari Kategori Part dan Component dijumlahkan:

1. **Total Poin Bobot Seluruh JO:**
   ```text
   7.0 (dari Part) + 3.0 (dari Component) = 10.0 poin
   ```

2. **Total Seluruh Proses Aktif Seluruh JO:**
   ```text
   13 proses (dari Part) + 4 proses (dari Component) = 17 proses
   ```

3. **Perhitungan Akhir Progress JO:**
   ```text
   Progress Total JO = (10.0 / 17) * 100%
   Progress Total JO = 0.5882 * 100%
   Progress Total JO = 58.82%
   ```

Pada kartu dashboard dan header halaman detail JO, nilai ini dibulatkan menjadi:
```text
59%
```

---

## 6. Tabel Rangkuman Akumulasi

| Kategori | Nama Item | Status Poin per Proses | Poin Didapat | Jumlah Proses | Progress Subtotal |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **PART** | Item 1: Punch Holder | 1.0 + 1.0 + 1.0 + 1.0 + 0.5 + 0.0 + 0.0 | **4.5** | 7 | - |
| **PART** | Item 2: Die Plate | 1.0 + 1.0 + 0.5 + 0.0 + 0.0 + [strip] + 0.0 | **2.5** | 6 | - |
| *Subtotal PART* | *2 Item* | *Akumulasi Part* | **7.0** | **13** | **54%** (53.8%) |
| **COMPONENT** | Item 3: Guide Pin | 1.0 + 1.0 | **2.0** | 2 | - |
| **COMPONENT** | Item 4: Coil Spring | 1.0 + 0.0 | **1.0** | 2 | - |
| *Subtotal COMPONENT* | *2 Item* | *Akumulasi Component* | **3.0** | **4** | **75%** (75.0%) |
| **TOTAL JO** | **Total 4 Item** | **Akumulasi Semua Kategori** | **10.0** | **17** | **59%** (58.8%) |

---

## 7. Rujukan Kode Program

Seluruh implementasi logika di atas tertulis murni pada kode sumber:
* File kalkulasi logika: [`frontend/lib/progress.ts`](frontend/lib/progress.ts)
* File definisi jenis proses & kategori: [`frontend/lib/types.ts`](frontend/lib/types.ts)
* File pemetaan proses: [`frontend/lib/category.ts`](frontend/lib/category.ts)
* Unit test kalkulasi: [`frontend/lib/progress.test.ts`](frontend/lib/progress.test.ts)
