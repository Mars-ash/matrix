[CmdletBinding()]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingPlainTextForPassword', '')]
param(
    [string]$HostName = $(if ($env:DB_HOST) { $env:DB_HOST } else { "127.0.0.1" }),
    [int]$Port = $(if ($env:DB_PORT) { [int]$env:DB_PORT } else { 5432 }),
    [string]$Database = $(if ($env:DB_DATABASE) { $env:DB_DATABASE } else { "matrix" }),
    [string]$User = $(if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "postgres" }),
    [Parameter()]
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingPlainTextForPassword', '')]
    [Alias('Password', 'Pwd')]
    [object]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" })
)

$BackupDir = Join-Path $PSScriptRoot "..\storage\backups"
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "matrix_backup_$Timestamp.sql"

$PlainPassword = if ($DbPassword -is [System.Security.SecureString]) {
    [System.Net.NetworkCredential]::new('', $DbPassword).Password
} else {
    [string]$DbPassword
}

$env:PGPASSWORD = $PlainPassword

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting backup for database '$Database' on port $Port..." -ForegroundColor Cyan

# Locate pg_dump in Laragon or PATH
$PgDump = "pg_dump"
if (Test-Path "C:\laragon\bin\postgresql\bin\pg_dump.exe") {
    $PgDump = "C:\laragon\bin\postgresql\bin\pg_dump.exe"
} elseif (Test-Path "C:\laragon\bin\postgresql\postgresql-x64-18\bin\pg_dump.exe") {
    $PgDump = "C:\laragon\bin\postgresql\postgresql-x64-18\bin\pg_dump.exe"
}

& $PgDump -h $HostName -p $Port -U $User -d $Database --clean --if-exists --no-owner -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    $FileSize = (Get-Item $BackupFile).Length / 1KB
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup succeeded: $BackupFile ($([math]::Round($FileSize, 2)) KB)" -ForegroundColor Green
    
    # Retention: remove files older than 7 days
    Get-ChildItem -Path $BackupDir -Filter "matrix_backup_*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item -Force
} else {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
