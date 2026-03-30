param(
    [string]$EnvPath = ".env",
    [string]$SeedSqlPath = "db/sql/init_testdata.sql"
)

$ErrorActionPreference = "Stop"

function Get-EnvMap {
    param([string]$Path)

    $values = @{}
    foreach ($line in Get-Content $Path) {
        if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith("#")) {
            continue
        }

        $parts = $line -split "=", 2
        if ($parts.Count -eq 2) {
            $values[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $values
}

function Resolve-PsqlPath {
    if ($env:PSQL_BIN -and -not [string]::IsNullOrWhiteSpace($env:PSQL_BIN)) {
        return $env:PSQL_BIN
    }

    $fromPath = Get-Command psql -ErrorAction SilentlyContinue
    if ($fromPath) {
        return $fromPath.Source
    }

    $windowsDefault = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
    if (Test-Path $windowsDefault) {
        return $windowsDefault
    }

    throw "psql not found. Set PSQL_BIN or add psql to PATH."
}

function Invoke-Psql {
    param(
        [string]$PsqlPath,
        [hashtable]$Config,
        [string]$Database,
        [string]$UserName,
        [string]$Password,
        [string]$SqlFile
    )

    if (-not (Test-Path $SqlFile)) {
        throw "Seed SQL file not found: $SqlFile"
    }

    $env:PGPASSWORD = $Password
    & $PsqlPath `
        -v "ON_ERROR_STOP=1" `
        -h $Config["DB_HOST"] `
        -p $Config["DB_PORT"] `
        -U $UserName `
        -d $Database `
        -f $SqlFile

    if ($LASTEXITCODE -ne 0) {
        throw "psql command failed."
    }
}

$config = Get-EnvMap -Path $EnvPath
$psqlPath = Resolve-PsqlPath

Invoke-Psql `
    -PsqlPath $psqlPath `
    -Config $config `
    -Database $config["DB_NAME"] `
    -UserName $config["DB_ADMIN_USER"] `
    -Password $config["DB_ADMIN_PASSWORD"] `
    -SqlFile $SeedSqlPath

Write-Host "Test data inserted into '$($config["DB_NAME"])'."
