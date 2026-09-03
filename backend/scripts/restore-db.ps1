# MATRIX - Windows PowerShell PostgreSQL Restore Script
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$HostName = "127.0.0.1",
    [int]$Port = 5432,
    [string]$Database = "matrix",
    [string]$User = "postgres",
    [string]$Password = "marsx"
)

if (!(Test-Path $BackupFile)) {
    Write-Host "Error: Backup file '$BackupFile' not found!" -ForegroundColor Red
    exit 1
}

$env:PGPASSWORD = $Password

# Locate psql in Laragon or PATH
$Psql = "psql"
if (Test-Path "C:\laragon\bin\postgresql\bin\psql.exe") {
    $Psql = "C:\laragon\bin\postgresql\bin\psql.exe"
}

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restoring '$BackupFile' into database '$Database'..." -ForegroundColor Cyan

& $Psql -h $HostName -p $Port -U $User -d $Database -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restore succeeded!" -ForegroundColor Green
} else {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restore failed with code $LASTEXITCODE" -ForegroundColor Red
}
