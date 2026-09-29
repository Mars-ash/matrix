[CmdletBinding()]
[Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingPlainTextForPassword', '')]
param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$HostName = $(if ($env:DB_HOST) { $env:DB_HOST } else { "127.0.0.1" }),
    [int]$Port = $(if ($env:DB_PORT) { [int]$env:DB_PORT } else { 5432 }),
    [string]$Database = $(if ($env:DB_DATABASE) { $env:DB_DATABASE } else { "matrix" }),
    [string]$User = $(if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "postgres" }),
    [Parameter()]
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSAvoidUsingPlainTextForPassword', '')]
    [Alias('Password', 'Pwd')]
    [object]$DbPassword = $(if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "" })
)

if (!(Test-Path $BackupFile)) {
    Write-Host "Error: Backup file '$BackupFile' not found!" -ForegroundColor Red
    exit 1
}

$PlainPassword = if ($DbPassword -is [System.Security.SecureString]) {
    [System.Net.NetworkCredential]::new('', $DbPassword).Password
} else {
    [string]$DbPassword
}

$env:PGPASSWORD = $PlainPassword

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
