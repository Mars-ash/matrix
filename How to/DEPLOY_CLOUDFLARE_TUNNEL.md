# Deploy Matrix dengan Cloudflare Tunnel

Panduan lengkap deploy project Matrix ke domain **matrixbmi.shop** menggunakan Cloudflare Tunnel.

## Arsitektur

```
Internet (HTTPS)
  │
  matrixbmi.shop ──► Cloudflare Edge ──► Cloudflare Tunnel (cloudflared)
                                              │
                                              ▼
                                        localhost:3000 (Next.js Frontend)
                                              │
                                              │ /api/backend/* (internal rewrite)
                                              ▼
                                        localhost:8000 (Laravel Backend)
                                              │
                                              ▼
                                        PostgreSQL (Docker container)
```

- Satu domain `matrixbmi.shop` mengarah ke frontend (port 3000)
- Frontend Next.js mem-proxy semua API call `/api/backend/*` ke backend Laravel via Docker network
- HTTPS ditangani otomatis oleh Cloudflare — tidak perlu SSL certificate manual

## Prasyarat

- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) terinstall
- Docker Desktop terinstall dan running
- Domain sudah terdaftar di Cloudflare (nameserver sudah pointing ke Cloudflare)

## Informasi Tunnel

| Key | Value |
|-----|-------|
| Tunnel Name | `matrix` |
| Tunnel ID | `f9736024-5bc8-41d1-a9c2-93844780eb1b` |
| Domain | `matrixbmi.shop` |
| Credentials | `C:\Users\USER\.cloudflared\f9736024-5bc8-41d1-a9c2-93844780eb1b.json` |
| Config | `C:\Users\USER\.cloudflared\config.yml` |

---

## Setup Pertama Kali (Sudah Selesai)

> Langkah-langkah ini hanya perlu dilakukan sekali. Dicatat di sini untuk referensi jika perlu setup ulang.

### 1. Login cloudflared

```powershell
cloudflared tunnel login
```

- Browser terbuka, pilih domain `matrixbmi.shop`, klik **Authorize**
- Certificate tersimpan di `C:\Users\USER\.cloudflared\cert.pem`

### 2. Buat Tunnel

```powershell
cloudflared tunnel create matrix
```

Output: Tunnel ID dan credentials file `.json`

### 3. Route DNS

```powershell
cloudflared tunnel route dns matrix matrixbmi.shop
```

Ini membuat CNAME record `matrixbmi.shop → <tunnel-id>.cfargotunnel.com` di Cloudflare DNS.

> **Jika error "record already exists":** Buka [Cloudflare Dashboard](https://dash.cloudflare.com) → DNS → Records, hapus record A/AAAA/CNAME untuk `matrixbmi.shop`, lalu ulangi command di atas.

### 4. Buat Config File

File: `C:\Users\USER\.cloudflared\config.yml`

```yaml
tunnel: f9736024-5bc8-41d1-a9c2-93844780eb1b
credentials-file: C:/Users/USER/.cloudflared/f9736024-5bc8-41d1-a9c2-93844780eb1b.json

ingress:
  - hostname: matrixbmi.shop
    service: http://localhost:3000
  - service: http_status:404
```

> **Penting:** File YAML harus disimpan **tanpa BOM (Byte Order Mark)**. Jangan pakai Notepad Windows — gunakan VS Code, atau buat lewat PowerShell / terminal.

Validasi:

```powershell
cloudflared tunnel ingress validate
```

### 5. Update `docker-compose.yml`

Pastikan bagian `backend > environment` mengandung:

```yaml
APP_URL: https://matrixbmi.shop
ASSET_URL: https://matrixbmi.shop
SANCTUM_STATEFUL_DOMAINS: matrixbmi.shop
SESSION_DOMAIN: matrixbmi.shop
TRUSTED_PROXIES: "*"
```

---

## Cara Menyalakan Server (1-Click / Otomatis Startup)

Tersedia file **`start-production.bat`** di root folder project.

### Opsi A: Double Click Manual
Cukup **double-click** file `start-production.bat`. File ini otomatis:
1. Memeriksa apakah Docker Desktop sudah siap (menunggu sampai aktif jika baru booting)
2. Menjalankan semua container (`docker compose up -d`)
3. Menjalankan Cloudflare Tunnel (`matrixbmi.shop`)

### Opsi B: Otomatis Nyala Pas Komputer Dinyalakan (Auto-Start)
1. Tekan tombol **`Windows + R`** di keyboard.
2. Ketik **`shell:startup`** lalu tekan **Enter** (folder Startup Windows akan terbuka).
3. Buat **Shortcut** dari file `C:\laragon\www\matrix\start-production.bat` ke dalam folder tersebut (Klik kanan `start-production.bat` > *Show more options* > *Create shortcut*, lalu pindahkan shortcut-nya ke folder Startup).
4. Setiap kali kamu menyalakan komputer dan login ke Windows, server dan tunnel akan otomatis hidup sendiri!

---

## Deploy (Sehari-hari)

Setiap kali mau deploy / nyalain server:

### 1. Nonaktifkan Override Dev

```powershell
# Pastikan override dev tidak aktif (kalau belum di-rename)
Rename-Item docker-compose.override.yml docker-compose.override.yml.bak
```

### 2. Build Docker Images

```powershell
# Build fresh (pakai --no-cache kalau ada perubahan Dockerfile/dependencies)
docker compose build

# Atau kalau mau force rebuild total:
docker compose build --no-cache
```

### 3. Start Containers

```powershell
docker compose up -d
```

### 4. Cek Semua Container Healthy

```powershell
docker compose ps
```

Tunggu sampai status semua container **healthy**:
- `matrix-postgres` — healthy
- `matrix-backend` — healthy
- `matrix-frontend` — healthy

### 5. Jalankan Tunnel

```powershell
cloudflared tunnel run matrix
```

Biarkan terminal ini terbuka. Site live di **https://matrixbmi.shop**

### 6. Test

- Buka https://matrixbmi.shop — pastikan frontend load
- Coba login — pastikan API call berjalan
- Cek health endpoint: https://matrixbmi.shop/api/backend/health

---

## Stop / Shutdown

```powershell
# Stop tunnel: Ctrl+C di terminal cloudflared

# Stop semua container
docker compose down

# Kalau mau kembali ke dev mode:
Rename-Item docker-compose.override.yml.bak docker-compose.override.yml
```

---

## Update Deployment (Ada Perubahan Code)

```powershell
# 1. Pastikan override dev tidak aktif
#    (skip kalau sudah di-rename)

# 2. Rebuild images
docker compose build

# 3. Restart containers dengan image baru
docker compose up -d

# 4. Tunnel biasanya masih jalan, kalau tidak:
cloudflared tunnel run matrix
```

---

## Troubleshooting

### Site tidak bisa diakses

```powershell
# Cek containers running
docker compose ps

# Cek frontend lokal
curl http://localhost:3000

# Cek backend lokal
curl http://localhost:8000/api/health

# Cek tunnel status
cloudflared tunnel info matrix
```

### API calls gagal (401 / CORS error)

- Pastikan `TRUSTED_PROXIES: "*"` ada di docker-compose.yml
- Pastikan `APP_URL` = `https://matrixbmi.shop` (pakai `https`)
- Pastikan `SANCTUM_STATEFUL_DOMAINS` = `matrixbmi.shop`

### Mixed content warning

- `APP_URL` harus `https://matrixbmi.shop`, bukan `http://`

### "Tunnel already exists" saat create

```powershell
cloudflared tunnel list          # lihat tunnel yang ada
cloudflared tunnel delete matrix # hapus kalau perlu
cloudflared tunnel create matrix # buat ulang
```

### Config YAML error

- Pastikan file `config.yml` **tidak ada BOM** (buat via VS Code / terminal, bukan Notepad)
- Pastikan indentasi pakai **spasi, bukan tab**
- Validasi: `cloudflared tunnel ingress validate`

---

## Optional: Install Sebagai Windows Service

Agar tunnel jalan otomatis saat Windows startup tanpa perlu buka terminal:

```powershell
# Jalankan sebagai Administrator
cloudflared service install
```

Untuk uninstall:

```powershell
cloudflared service uninstall
```
