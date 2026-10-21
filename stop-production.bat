@echo off
title MATRIX - Stop Production Server
color 0C

echo ====================================================
echo        MATRIX SYSTEM - SHUTDOWN
echo ====================================================
echo.

cd /d C:\laragon\www\matrix

:: Backup storage foto dari container ke Windows host
echo Menyinkronkan file foto bukti ke direktori lokal...
docker cp matrix-backend:/var/www/html/storage/app/public/. backend\storage\app\public/ >nul 2>&1

echo Mematikan Docker Containers...
docker compose stop

echo.
echo ====================================================
echo [OK] Server Matrix berhasil dimatikan dengan aman.
echo ====================================================
timeout /t 3
exit
