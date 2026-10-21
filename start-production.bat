@echo off
title MATRIX - Production Server & Cloudflare Tunnel
color 0A

echo ====================================================
echo        MATRIX - PRODUCTION STARTUP
echo ====================================================
echo.

:: 1. Pindah ke direktori project
cd /d C:\laragon\www\matrix

:: 2. Cek apakah Docker Desktop sudah jalan
echo [1/3] Memeriksa Docker Desktop...
:CHECK_DOCKER
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker belum siap, menunggu 5 detik...
    timeout /t 5 /nobreak >nul
    goto CHECK_DOCKER
)
echo [OK] Docker siap!
echo.

:: 3. Jalankan Docker Containers (Postgres, Laravel, Next.js)
echo [2/3] Menjalankan Docker Containers...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Gagal menjalankan Docker containers!
    pause
    exit /b %errorlevel%
)
echo [OK] Containers berhasil dinyalakan!
echo.

:: 3b. Pastikan foto bukti (storage) tersinkronisasi ke container
if exist "backend\storage\app\public\process-photos" (
    docker cp backend\storage\app\public\. matrix-backend:/var/www/html/storage/app/public/ >nul 2>&1
    docker exec matrix-backend chown -R www-data:www-data /var/www/html/storage/app/public >nul 2>&1
)

:: 4. Jalankan Cloudflare Tunnel
echo [3/3] Menghubungkan Cloudflare Tunnel (matrixbmi.shop)...
echo ====================================================
echo  Website Live: https://matrixbmi.shop
echo  JANGAN TUTUP JENDELA INI SELAMA SERVER DIGUNAKAN!
echo  (Tekan Ctrl + C jika ingin mematikan tunnel)
echo ====================================================
echo.

cloudflared tunnel run matrix
pause
