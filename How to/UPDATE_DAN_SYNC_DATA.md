# Panduan Update Aplikasi & Sinkronisasi Data (Device 1 & Device 2)

Dokumen ini adalah panduan praktis untuk:
1. **Memperbarui kode aplikasi** dari Developer (Device 1) ke User (Device 2) tanpa menghapus data.
2. **Menyamakan / memindahkan data** database dan file foto antar Device 1 dan Device 2.

> 💡 *Jika baru pertama kali ingin menyiapkan Device 2 dari nol (fresh install), silakan lihat panduan lengkap di [SETUP_DEVICE_2.md](SETUP_DEVICE_2.md).*

---

## 1. Cara Update Kode Aplikasi (Device 1 ➔ Device 2)

Gunakan cara ini ketika developer telah menambah fitur baru, memperbaiki bug, atau mengubah tampilan, dan ingin mengirim update tersebut ke laptop user.

### Di Device 1 (Developer):
Simpan dan kirim kode terbaru ke repository Git:
```bash
git add .
git commit -m "Update fitur atau perbaikan bug"
git push origin main
```

---

### Di Device 2 (User):
Jalankan langkah berikut di terminal folder project MATRIX:

```powershell
# 1. Ambil update kode terbaru
git pull

# 2. Build ulang container aplikasi
docker compose up --build -d

# 3. Jalankan migrasi database jika ada perubahan struktur tabel baru
docker compose exec backend php artisan migrate --force
```

> **Apakah data user akan hilang saat di-update?**  
> **TIDAK.** Data database tersimpan aman di dalam *Docker Named Volume* (`matrix-pgdata`) dan foto tersimpan di (`matrix-storage`). Perintah `docker compose up --build -d` hanya mengganti file kode aplikasi tanpa menghapus volume data.

---

## 2. Cara Menyamakan Data Antar Device

Gunakan cara ini ketika Device 2 (User) sudah aktif dipakai menginput data baru, dan kamu ingin data di Device 1 (Developer) sama persis dengan yang ada di Device 2.

### Langkah A: Export Data dari Device 2 (Pengirim Data)

1. Pastikan Docker di Device 2 sedang berjalan.
2. Buka terminal di folder project, jalankan:
   ```powershell
   docker compose exec -T postgres pg_dump -U postgres matrix > backup_matrix.sql
   ```
3. File `backup_matrix.sql` akan muncul di folder project.
4. *(Jika ada foto/gambar baru)* Salin juga folder:
   `backend/storage/app/public/`
5. Kirim file `backup_matrix.sql` (dan folder foto) ke Device 1.

---

### Langkah B: Import Data ke Device 1 (Penerima Data)

1. Pastikan Docker di Device 1 sedang berjalan (`docker compose up -d`).
2. Letakkan file `backup_matrix.sql` di folder project Device 1.
3. Buka terminal di Device 1 dan jalankan:
   ```powershell
   docker compose exec -i postgres psql -U postgres -d matrix < backup_matrix.sql
   ```
4. *(Jika menyalin foto)* Timpa isi folder `backend/storage/app/public/` di Device 1, lalu hubungkan storage jika diperlukan:
   ```powershell
   docker compose exec backend php artisan storage:link
   ```

*Selesai! Seketika database Device 1 akan sama persis 100% dengan data terbaru dari Device 2.*

---

## 3. Cheatsheet Perintah Penting

| Kebutuhan | Perintah Terminal |
| :--- | :--- |
| **Nyalakan Aplikasi** | `docker compose up -d` |
| **Matikan Aplikasi (Aman)** | `docker compose down` |
| **Update Kode Baru** | `git pull` dilanjutkan `docker compose up --build -d` |
| **Backup / Export DB** | `docker compose exec -T postgres pg_dump -U postgres matrix > backup_matrix.sql` |
| **Restore / Import DB** | `docker compose exec -i postgres psql -U postgres -d matrix < backup_matrix.sql` |
| **Cek Status Container** | `docker compose ps` |

---

## ⚠️ PERINGATAN PENTING (ATURAN EMAS)

**JANGAN PERNAH** menjalankan perintah berikut di laptop yang ada data aslinya:
```powershell
docker compose down -v   # <-- JANGAN PAKAI FLAG -v
```
Flag `-v` (*volumes*) akan menghapus seluruh data database secara permanen. Selalu gunakan `docker compose down` biasa (tanpa `-v`).
