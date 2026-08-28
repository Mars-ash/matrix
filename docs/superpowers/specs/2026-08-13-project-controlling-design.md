# Project Controlling Design

> Status: Draft for user review
> Date: 2026-08-13

## 1. Purpose

Membangun sistem internal untuk membantu Staff Engineering mengendalikan progres pembuatan dies dan membantu Supervisor memantau progres serta masalah pada setiap JO.

Sumber pemahaman proses saat ini:

- `GUIDANCE/CONTROL AS IS.xlsx`
- `GUIDANCE/Flow Chart.jpeg`

Workbook AS-IS dipakai sebagai referensi proses dan data, bukan sebagai target tampilan aplikasi. UI baru akan dibuat sebagai project control center yang lebih mudah dipantau dan digunakan.

## 2. Keputusan Utama

- Satu Project memiliki banyak JO.
- Satu JO hanya memiliki satu Die.
- Satu produk dapat memiliki beberapa Die; setiap Die dibuat sebagai JO yang berbeda.
- Satu JO memiliki satu produk dan satu Die.
- Satu Die memiliki banyak Part dan Komponen.
- Progress utama dihitung per JO.
- Project berfungsi mengelompokkan JO dan belum memiliki progress agregat pada MVP.
- Input MVP dilakukan manual.
- Import gambar tabel GstarCAD/OCR berada di fase lanjutan.

## 3. Hierarki Data dan Navigasi

```text
Dashboard
   ↓
Project
   ↓
Daftar JO
   ↓
Detail JO
   └── Die
       ├── Part
       └── Komponen
```

### Project

Data minimum:

- nama Project
- customer
- daftar JO

### JO

Data minimum yang mengikuti workbook:

- nomor JO
- nomor/nama produk atau Part No
- nama produk atau Part Name
- satu Die terkait

Beberapa JO dapat memiliki identitas produk yang sama ketika satu produk membutuhkan beberapa Die.

### Die

Die menjadi konteks kontrol untuk satu JO. Die memiliki:

- daftar Part
- daftar Komponen

Field Part dan Komponen mengikuti kebutuhan AS-IS: No, Description, Dimension, Material, Qty, dan HRc jika relevan.

## 4. Status Kontrol

Setiap kontrol menggunakan satu dropdown dengan lima pilihan:

- `-`: proses tidak diperlukan dan tidak dihitung.
- `Not Started`: proses diperlukan tetapi belum dimulai.
- `In Progress`: proses sedang berjalan.
- `Done`: proses selesai.
- `Problem`: terdapat masalah dan wajib memiliki notes.

### Kontrol Part

Setiap Part memiliki tujuh kontrol:

1. PO/Material
2. Kedatangan
3. Machining
4. Hardening
5. Grinding
6. Wirecut
7. Assembly

### Kontrol Komponen

Setiap Komponen hanya memiliki dua kontrol:

1. PO
2. Kedatangan

Kontrol proses lain tidak ditampilkan untuk Komponen.

## 5. Perhitungan Progress

Bobot status:

| Status | Nilai |
|---|---:|
| Done | 1.0 |
| In Progress | 0.5 |
| Not Started | 0.0 |
| Problem | 0.0 |
| - | Tidak dihitung |

Rumus konseptual:

```text
progress JO =
  total nilai seluruh kontrol yang bukan '-'
  ÷ jumlah seluruh kontrol yang bukan '-'
  × 100%
```

Ketentuan:

- Part dan Komponen sama-sama masuk perhitungan progress JO.
- Semua kontrol memiliki bobot yang sama.
- Qty tidak memengaruhi bobot progress.
- Status Problem tetap masuk denominator dengan nilai 0 agar masalah menurunkan progress.
- Jika seluruh kontrol `-`, progress ditampilkan sebagai `-`, bukan 0%.

## 6. Histori dan Notes

Setiap perubahan status dicatat sebagai histori minimal dengan:

- status sebelumnya
- status baru
- notes saat perubahan
- pengguna yang melakukan perubahan
- waktu perubahan

Notes wajib ketika status baru adalah `Problem`. Histori bersifat append-only untuk menjaga jejak perubahan.

## 7. Peran Pengguna

### Staff Engineering

- membuat dan mengubah Project
- membuat dan mengubah JO
- mengisi data Die, Part, dan Komponen
- mengubah status kontrol
- menambahkan notes Problem
- melihat histori

### Supervisor

- melihat Dashboard
- melihat Project dan daftar JO
- melihat detail Die, Part, Komponen, dan histori
- melihat daftar Problem
- tidak dapat mengubah data atau status

## 8. Desain UI/UX

UI menggunakan gaya modern, ringkas, dan berorientasi pada exception. UI tidak menyalin layout Excel.

### Dashboard

Menampilkan:

- daftar Project
- daftar JO terkait
- progress setiap JO
- jumlah Problem per JO
- filter JO bermasalah atau belum selesai

Dashboard tidak menampilkan progress Project agregat pada MVP.

### Halaman Project

Menampilkan informasi Project, customer, dan kartu/list JO. JO dengan produk yang sama dapat dikelompokkan secara visual agar beberapa Die untuk satu produk mudah dibandingkan.

### Halaman Daftar JO

Setiap JO ditampilkan sebagai kartu atau baris informatif yang berisi:

- nomor JO
- produk
- Die
- progress
- jumlah Problem
- waktu perubahan terakhir

### Detail JO

Header halaman berisi identitas JO, produk, Die, progress, dan ringkasan Problem.

Isi halaman dibagi menjadi:

- **Part Control:** daftar Part dengan status proses berbentuk badge/dropdown.
- **Komponen Control:** daftar Komponen dengan status PO dan Kedatangan.
- **Activity/History:** histori perubahan status dan notes.

Status badge menggunakan warna semantik:

- abu-abu: -
- biru: Not Started
- kuning: In Progress
- hijau: Done
- merah: Problem

Tabel Part boleh digunakan untuk menampilkan data padat, tetapi harus berupa tabel aplikasi modern dengan sticky identity columns, filter, badge, dan panel ringkasan; bukan grid Excel mentah.

## 9. Pemetaan Flow Chart

Flow chart menjadi referensi urutan kerja, tetapi milestone flow tidak dibuat sebagai status terpisah pada MVP.

- PO Confirmation dan Material Order tercermin pada kontrol PO/Material.
- Kedatangan material tercermin pada kontrol Kedatangan.
- Machining, Harden, Surface Grinding, dan Wirecut tercermin pada kontrol Part.
- Assembling tercermin pada kontrol Assembly.
- Trial dan Check tercermin melalui update status dan notes.
- Jalur NG/Die Repair direpresentasikan oleh status Problem, histori, dan perubahan status berikutnya.
- Finish dan Delivery belum menjadi status terpisah pada MVP.

## 10. Fase Pengembangan

### MVP

- autentikasi internal dan dua peran pengguna
- CRUD Project, JO, Die, Part, dan Komponen
- status dropdown sesuai lima status
- progress per JO
- notes Problem
- histori perubahan
- Dashboard Supervisor
- UI modern sesuai navigation flow
- REST API Laravel dan frontend Next.js/React

### Fase Lanjutan: Import GstarCAD

Alur import yang direncanakan:

```text
Upload gambar tabel
   ↓
Pembacaan kolom tetap
   ↓
Preview hasil pembacaan
   ↓
Koreksi Staff Engineering
   ↓
Konfirmasi simpan
```

Pemetaan kolom:

`No → Description → Dimension → Material → Qty → HRc`

Hasil OCR tidak boleh langsung disimpan tanpa preview dan konfirmasi.

## 11. Arsitektur Teknis

```text
Next.js + React + Tailwind CSS
          ↓ REST API
Laravel + PHP
          ↓ Eloquent
PostgreSQL
```

Next.js tidak terhubung langsung ke PostgreSQL. Validasi, authorization, perhitungan progress, histori, dan operasi database berada di Laravel.

Entitas logis yang diperkirakan:

- `projects`
- `jos`
- `dies`
- `parts`
- `components`
- `process_controls`
- `status_histories`
- `users`

Detail skema, endpoint, dan struktur folder akan dikunci pada implementation plan setelah spesifikasi ini disetujui.

## 12. Temuan AS-IS yang Mendasari Desain

- Formula `P9` hanya memeriksa rentang `I10:O12`, sedangkan data Part berlanjut sampai baris 31; angka Part 75% tidak mewakili seluruh Part.
- Hanya `I7` yang memiliki formula; nilai `J7:O7` tersimpan sebagai nilai manual sehingga dapat tidak sinkron dengan perubahan status.
- Sel `I29` berisi angka `12` di area status, sedangkan status lain menggunakan `O`, `V`, `X`, `-`, atau kosong; data ini perlu validasi saat migrasi atau input.
- Sistem baru akan menghitung progress dari data status terstruktur di backend, bukan dari formula spreadsheet yang dapat terputus atau tertimpa.

## 13. Di Luar Scope MVP

- import Excel langsung
- OCR gambar GstarCAD
- target date dan actual date per proses
- PIC per proses
- attachment/evidence per Problem
- progress agregat Project
- milestone status terpisah untuk Finish dan Delivery
- akses Customer

## 14. Acceptance Criteria Desain

- Staff dapat menemukan JO melalui Dashboard → Project → Daftar JO.
- Staff dapat mengontrol satu Die melalui halaman Detail JO.
- Part memiliki tujuh kontrol proses; Komponen memiliki dua kontrol proses.
- Status hanya dapat dipilih dari lima pilihan yang ditentukan.
- Status Problem tidak dapat disimpan tanpa notes.
- Progress JO mengikuti bobot status yang ditetapkan dan mengecualikan `-`.
- Supervisor dapat membaca seluruh status, Problem, dan histori tetapi tidak dapat mengubahnya.
- Setiap perubahan status menghasilkan histori.
- Flow NG/Die Repair dapat ditelusuri melalui Problem dan histori.
