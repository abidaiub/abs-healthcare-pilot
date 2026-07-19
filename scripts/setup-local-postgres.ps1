#Requires -RunAsAdministrator
# One-time local PostgreSQL setup for ABSHealthcareLite Pilot (Windows)
$ErrorActionPreference = 'Stop'

$pgData = 'C:\Program Files\PostgreSQL\18\data'
$pgHba = Join-Path $pgData 'pg_hba.conf'
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$serviceName = 'postgresql-x64-18'
$backup = "$pgHba.backup-abshealthcare-setup"

$dbUser = 'abshealthcare'
$dbPass = 'abshealthcare_dev'
$dbName = 'abs_healthcare_pilot'

Write-Host "=== ABSHealthcareLite local PostgreSQL setup ==="

if (-not (Test-Path $pgHba)) {
    Write-Error "PostgreSQL pg_hba.conf not found at $pgHba"
}

if (-not (Test-Path $backup)) {
    Copy-Item $pgHba $backup -Force
    Write-Host "Backed up pg_hba.conf"
}

$content = Get-Content $pgHba -Raw
$trustContent = $content -replace 'scram-sha-256', 'trust'
[System.IO.File]::WriteAllText($pgHba, $trustContent)

Restart-Service $serviceName -Force
Start-Sleep -Seconds 4
Write-Host "PostgreSQL restarted with temporary trust auth"

$psql = Join-Path $pgBin 'psql.exe'
$psqlArgs = @('-h', '127.0.0.1', '-p', '5432', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1')

$userExists = & $psql @psqlArgs '-tAc' "SELECT 1 FROM pg_roles WHERE rolname = '$dbUser'"
if ($userExists -ne '1') {
    & $psql @psqlArgs '-c' "CREATE USER $dbUser WITH PASSWORD '$dbPass';"
    Write-Host "Created user $dbUser"
} else {
    & $psql @psqlArgs '-c' "ALTER USER $dbUser WITH PASSWORD '$dbPass';"
    Write-Host "Updated password for $dbUser"
}

$dbExists = & $psql @psqlArgs '-tAc' "SELECT 1 FROM pg_database WHERE datname = '$dbName'"
if ($dbExists -ne '1') {
    & $psql @psqlArgs '-c' "CREATE DATABASE $dbName OWNER $dbUser;"
    Write-Host "Created database $dbName"
} else {
    Write-Host "Database $dbName already exists"
}

& $psql @psqlArgs '-c' "GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;"
& $psql -h 127.0.0.1 -p 5432 -U postgres -d $dbName -v ON_ERROR_STOP=1 -c "GRANT ALL ON SCHEMA public TO $dbUser; ALTER SCHEMA public OWNER TO $dbUser;"

Copy-Item $backup $pgHba -Force
Restart-Service $serviceName -Force
Start-Sleep -Seconds 4
Write-Host "Restored pg_hba.conf and restarted PostgreSQL"

$env:PGPASSWORD = $dbPass
& $psql -h 127.0.0.1 -p 5432 -U $dbUser -d $dbName -c "SELECT current_user, current_database();"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Verification failed for $dbUser@$dbName"
}

Write-Host "=== Setup complete ==="
