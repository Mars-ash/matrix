# Panduan Setup Awal MATRIX di Device 2 (Fresh Install)

Dokumen ini berisi panduan langkah demi langkah untuk menyiapkan dan menjalankan aplikasi **MATRIX Production Controlling** di **Device 2 (Laptop User/Klien)** dari nol menggunakan Docker.

---

## A. Software yang Wajib Diinstall di Device 2

Di Device 2, Anda **TIDAK PERLU** menginstall PHP, Node.js, PostgreSQL, Laragon, Composer, atau npm. Seluruh aplikasi sudah terisolasi dan berjalan otomatis di dalam Docker.

Cukup pastikan 2 software berikut terinstall:
1. **[Git for Windows](https://git-scm.com/download/win)** (untuk clone & update kode dari repository).
2. **[Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)**  
   *(Saat proses instalasi, pastikan opsi **"Use WSL 2 instead of Hyper-V"** dicentang)*.

> 💡 **Penting:** Setelah install Docker Desktop, buka aplikasinya dan tunggu hingga ikon paus di pojok kiri bawah atau taskbar Windows menyala hijau (**Running**).

---

## B. Langkah Setup Awal (Hanya Dilakukan 1 Kali)

### 1. Clone Repository Project
Buka **PowerShell** atau **Terminal** di Device 2, masuk ke direktori kerja Anda (misal `C:\Projects`):
```powershell
# Buat atau masuk ke folder kerja
mkdir C:\Projects -ErrorAction SilentlyContinue
cd C:\Projects

# Clone repository Matrix
git clone <URL_REPOSITORY_GIT_ANDA> matrix
cd matrix
```

---

### 2. Nyalakan dan Build Container Docker
Di dalam folder `matrix`, jalankan perintah berikut untuk mengunduh base image dan mem-build aplikasi:
```powershell
docker compose up --build -d
```
> ⏳ **Catatan:** Proses build pertama kali membutuhkan waktu beberapa menit tergantung kecepatan koneksi internet dan spesifikasi laptop karena Docker sedang meng-compile frontend Next.js dan backend Laravel.

Setelah selesai, periksa status ketiga container:
```powershell
docker compose ps
```
Pastikan seluruh container berstatus **`Up (healthy)`**:
- `matrix-backend` (Up - healthy)
- `matrix-frontend` (Up - healthy)
- `matrix-postgres` (Up - healthy)

---

### 3. Setup Struktur Database & Storage Link
Jalankan migrasi tabel database dan sambungkan folder penyimpanan file/foto:
```powershell
# 1. Jalankan migrasi tabel database
docker compose exec backend php artisan migrate --force

# 2. Hubungkan storage publik untuk foto/gambar
docker compose exec backend php artisan storage:link
```

---

### 4. Mengisi DATA ASLI (Bukan Dummy)

> ⚠️ **Catatan Penting:** **JANGAN** jalankan `php artisan db:seed`, karena perintah tersebut akan mengisi database dengan data dummy/testing (seperti HB24 dll).

Gunakan salah satu cara berikut untuk memasukkan **DATA ASLI**:

#### CARA 1: Gunakan File Backup Data Asli Bawaan (Kawasaki DA4)
Kita sudah menyimpan cadangan data asli Anda (Project Kawasaki DA4, JO 126.144, 126.151, 126.153, seluruh part & riwayat aktivitas) di dalam folder project:
`backend/database/backups/real_data_kawasaki_da4.sql`

Di terminal Device 2, jalankan perintah ini:
```powershell
docker compose exec -i postgres psql -U postgres -d matrix < backend/database/backups/real_data_kawasaki_da4.sql
```
*(Data asli akan langsung masuk ke database dalam hitungan detik).*

---

#### CARA 2: Export Data Terbaru dari Device 1 (Jika ada input baru di Device 1)
Jika saat ini di Device 1 ada data asli terbaru yang ingin dipindahkan ke Device 2:
1. Di **Device 1**, export database:
   ```powershell
   docker compose exec -T postgres pg_dump -U postgres matrix > backup_matrix.sql
   ```
2. Kirim file `backup_matrix.sql` (dan folder `backend/storage/app/public/` jika ada foto) ke Device 2.
3. Di **Device 2**, jalankan:
   ```powershell
   docker compose exec -i postgres psql -U postgres -d matrix < backup_matrix.sql
   ```

---

### 5. Akses Aplikasi di Browser
Buka browser (Google Chrome, Microsoft Edge, dll) di Device 2 dan buka alamat:
👉 **`http://localhost:3000`**

Gunakan akun login:
* **Staff Engineering (Akses Penuh: Tambah, Edit, Hapus)**:
  * **Username**: `matrix`
  * **Password**: `eng#1`
* **Viewer (Hanya Melihat Data / Read-Only)**:
  * **Username**: `matrix#1`
  * **Password**: `matrix#1`

---

## C. Cara Menjalankan Sehari-hari di Device 2

Setelah setup awal selesai, untuk hari-hari berikutnya sangat praktis:

### 1. Menyalakan Aplikasi (Misal setelah laptop dinyalakan ulang)
1. Buka aplikasi **Docker Desktop**.
2. Buka terminal di folder project `matrix`:
   ```powershell
   docker compose up -d
   ```
3. Buka browser di `http://localhost:3000`.

### 2. Mematikan Aplikasi secara Aman
```powershell
docker compose down
```

### 3. Mengakses dari HP / Perangkat Lain (Cloudflare Tunnel)
Jika ingin mengakses aplikasi dari HP atau gadget lain di jaringan luar:
1. Jalankan Cloudflared di terminal:
   ```powershell
   cloudflared tunnel --url http://localhost:3000
   ```
2. Salin dan buka URL publik yang muncul (contoh: `https://xxxx.trycloudflare.com`) di HP Anda.

---

## D. Cara Menerima Update Kode Terbaru dari Developer

Jika developer (Device 1) telah memperbarui kode atau menambah fitur baru di Git:
```powershell
# 1. Tarik kode terbaru
git pull

# 2. Build ulang container
docker compose up --build -d

# 3. Jalankan migrasi jika ada perubahan struktur tabel baru
docker compose exec backend php artisan migrate --force
```

---

## ⚠️ PERINGATAN PENTING (ATURAN EMAS DATA)

**JANGAN PERNAH** menjalankan perintah dengan flag `-v`:
```powershell
docker compose down -v   # ❌ JANGAN DIGUNAKAN!
```
Flag `-v` (*volume*) akan **menghapus database PostgreSQL secara permanen**.  
Selalu gunakan `docker compose down` biasa (tanpa `-v`) agar seluruh data tetap aman.
