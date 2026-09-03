# MATRIX — Build Task List

Dokumen pelacakan progress per fase implementasi. Setiap item harus dicentang setelah lulus uji dan verifikasi.

---

## Progress Overview

| Fase | Deskripsi | Status | Progress |
| :--- | :--- | :---: | :---: |
| **Fase 1** | Database Schema & Eloquent Models (PostgreSQL) | ✅ Completed | 7/7 |
| **Fase 2** | Authentication & Role Authorization (Sanctum) | ✅ Completed | 6/6 |
| **Fase 3** | REST API Core CRUD & Data Synchronization | ✅ Completed | 10/10 |
| **Fase 4** | Trial Reports & Photo Storage Management | ✅ Completed | 6/6 |
| **Fase 5** | OCR Vision AI (Gemini 2.0 Flash) | ✅ Completed | 6/6 |
| **Fase 6** | Role-Based UI (Controller vs Viewer) | ✅ Completed | 5/5 |
| **Fase 7** | DevOps, CI/CD, E2E Testing & Backup Strategy | ⏳ Pending | 0/7 |

---

## Detail Task per Fase

### Fase 1: Database Schema & Eloquent Models (PostgreSQL)
- [x] **1.1** Setup koneksi PostgreSQL di `backend/.env` & validasi via `php artisan db:show`
- [x] **1.2** Buat migration core tabel: `projects`, `jos`, `categories`, `items`, `controls`
- [x] **1.3** Buat migration tracking & activity: `po_trackings`, `process_photos`, `activities`
- [x] **1.4** Buat migration trial module: `trial_sessions`, `trial_findings`, `trial_entries`, `trial_entry_photos`
- [x] **1.5** Implementasi Eloquent Models dengan UUID trait, casts, dan relasi berjenjang
- [x] **1.6** Buat Model Factories & `DemoSeeder` (data JO 126.110 realistis)
- [x] **1.7** **Verification Gate 1**: `php artisan migrate:fresh --seed` & validasi query relasi tanpa N+1

---

### Fase 2: Authentication & Role Authorization
- [x] **2.1** Tambah kolom `role` (`controller`, `viewer`) pada migrasi `users`
- [x] **2.2** Buat Artisan command `php artisan user:create` untuk manajemen admin manual
- [x] **2.3** Konfigurasi Laravel Sanctum SPA & login/logout/me controller
- [x] **2.4** Buat Laravel Policies & Gates untuk role `controller` (write) vs `viewer` (read)
- [x] **2.5** Implementasi Frontend Auth Provider (`useAuth`), login page (`/login`), & Next.js middleware
- [x] **2.6** **Verification Gate 2**: Test login flow, token validation, & role access rejection (403)

---

### Fase 3: REST API Core CRUD & Data Synchronization
- [x] **3.1** Buat API endpoints & Form Requests untuk `ProjectController` & `JOController`
- [x] **3.2** Buat API endpoints untuk `CategoryController` & `ItemController` (single + batch)
- [x] **3.3** Buat API endpoints untuk `ControlController` (status, target date, PO tracking)
- [x] **3.4** Buat API endpoints untuk `BulkActionController` (bulk PO, bulk status, bulk subcont)
- [x] **3.5** Buat API query optimized untuk `SubcontTrackerController` & `PoTrackerController`
- [x] **3.6** Buat API Resource transformers untuk format response JSON yang konsisten
- [x] **3.7** Buat centralized `frontend/lib/api-client.ts`
- [x] **3.8** Refactor `frontend/lib/store.tsx` & komponen untuk sync dengan REST API backend
- [x] **3.9** Implementasi handling loading, error state, & toast notification di frontend
- [x] **3.10** **Verification Gate 3**: Backend feature tests pass & verifikasi UI data persist setelah refresh

---

### Fase 4: Trial Reports & Photo Storage Management
- [x] **4.1** Buat REST API untuk Trial Sessions (CRUD, Duplicate, Reorder Findings & Entries)
- [x] **4.2** Implementasi `PhotoUploadService` dengan validasi magic-bytes & kompresi gambar
- [x] **4.3** Konfigurasi storage disk untuk Process Photos & Trial Photos
- [x] **4.4** Hubungkan `trial-report-editor.tsx` & `trial-photo-uploader.tsx` ke backend API
- [x] **4.5** Pastikan `trial-report-print-view.tsx` memuat gambar dan data secara presisi
- [x] **4.6** **Verification Gate 4**: End-to-end trial report creation, photo upload, duplicate session, & print view

---

### Fase 5: OCR Vision AI (Gemini 2.0 Flash)
- [x] **5.1** Setup `backend/config/ocr.php` & simpan Google Gemini API key di `.env`
- [x] **5.2** Implementasi `OcrService.php` dengan prompt Gemini 2.0 Flash + Structured JSON output schema
- [x] **5.3** Buat API endpoint `POST /api/ocr/extract` dengan rate-limiting & validasi gambar
- [x] **5.4** Modifikasi `add-data-dialog.tsx` untuk menangkap paste clipboard / drag-drop gambar asli
- [x] **5.5** Tampilkan hasil ekstraksi BOM ke tabel editable preview sebelum konfirmasi import
- [x] **5.6** **Verification Gate 5**: Upload contoh gambar BOM aktual → data terisi otomatis dan tersimpan ke JO

---

### Fase 6: Role-Based UI (Controller vs Viewer)
- [x] **6.1** Modifikasi `app-shell.tsx` (hide tombol 'New Item' & 'New Project' untuk Viewer)
- [x] **6.2** Modifikasi `control-table.tsx` (disable status click & hide checkbox column untuk Viewer)
- [x] **6.3** Modifikasi `subcont/page.tsx` & `po-tracker/page.tsx` ke mode read-only untuk Viewer
- [x] **6.4** Modifikasi `trial-report-editor.tsx` ke mode view-only untuk Viewer
- [x] **6.5** **Verification Gate 6**: Switch akun Controller & Viewer, verifikasi tidak ada kebocoran aksi pada Viewer

---

### Fase 7: DevOps, CI/CD, E2E Testing & Backup Strategy
- [ ] **7.1** Buat `docker/Dockerfile.backend` (PHP 8.3 FPM + Nginx multi-stage)
- [ ] **7.2** Buat `docker/Dockerfile.frontend` (Next.js 16 standalone build)
- [ ] **7.3** Buat `docker-compose.yml` (backend, frontend, postgres, healthchecks)
- [ ] **7.4** Buat automated Playwright E2E test suite (`testing/e2e/`)
- [ ] **7.5** Setup script backup otomatis database PostgreSQL (`pg_dump` command/cron)
- [ ] **7.6** Buat pipeline CI/CD (`.github/workflows/ci.yml` atau `.gitlab-ci.yml`)
- [ ] **7.7** **Verification Gate 7**: `docker compose up -d --build` sukses & Playwright E2E suite hijau 100%
