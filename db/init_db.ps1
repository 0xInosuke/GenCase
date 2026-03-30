param(
    [string]$EnvPath = ".env",
    [string]$SchemaSqlPath = "db/sql/init_db_schema.sql"
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
        [string]$Sql,
        [string]$SqlFile,
        [hashtable]$Variables
    )

    if ([string]::IsNullOrWhiteSpace($Sql) -and [string]::IsNullOrWhiteSpace($SqlFile)) {
        throw "Either Sql or SqlFile must be provided."
    }

    $env:PGPASSWORD = $Password
    $args = @(
        "-v", "ON_ERROR_STOP=1",
        "-h", $Config["DB_HOST"],
        "-p", $Config["DB_PORT"],
        "-U", $UserName,
        "-d", $Database
    )

    if ($Variables) {
        foreach ($entry in $Variables.GetEnumerator()) {
            $args += @("-v", "$($entry.Key)=$($entry.Value)")
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($Sql)) {
        $args += @("-c", $Sql)
    } else {
        $args += @("-f", $SqlFile)
    }

    & $PsqlPath @args

    if ($LASTEXITCODE -ne 0) {
        throw "psql command failed."
    }
}

function Quote-Literal {
    param([string]$Value)

    return "'" + $Value.Replace("'", "''") + "'"
}

$config = Get-EnvMap -Path $EnvPath
$psqlPath = Resolve-PsqlPath

$dbName = $config["DB_NAME"]
$bootstrapDb = $config["DB_BOOTSTRAP_NAME"]
$bootstrapUser = $config["DB_BOOTSTRAP_USER"]
$bootstrapPassword = $config["DB_BOOTSTRAP_PASSWORD"]
$adminUser = $config["DB_ADMIN_USER"]
$adminPassword = $config["DB_ADMIN_PASSWORD"]
$appUser = $config["DB_APP_USER"]
$appPassword = $config["DB_APP_PASSWORD"]

$adminPasswordSql = Quote-Literal $adminPassword
$appPasswordSql = Quote-Literal $appPassword

if (-not (Test-Path $SchemaSqlPath)) {
    throw "Schema SQL file not found: $SchemaSqlPath"
}

Write-Host "Resetting database '$dbName' and recreating roles..."

# Terminate active sessions so DROP DATABASE can succeed consistently.
$terminateSql = @"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$dbName' AND pid <> pg_backend_pid();
"@

Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql $terminateSql
Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql "DROP DATABASE IF EXISTS $dbName;"
Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql "DROP ROLE IF EXISTS $appUser;"
Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql "DROP ROLE IF EXISTS $adminUser;"
Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql "CREATE ROLE $adminUser LOGIN PASSWORD $adminPasswordSql;"
Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql "CREATE ROLE $appUser LOGIN PASSWORD $appPasswordSql;"
Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql "CREATE DATABASE $dbName OWNER $adminUser;"
Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql "REVOKE ALL ON DATABASE $dbName FROM PUBLIC;"
Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql "GRANT CONNECT, TEMPORARY ON DATABASE $dbName TO $adminUser;"
Invoke-Psql -PsqlPath $psqlPath -Config $config -Database $bootstrapDb -UserName $bootstrapUser -Password $bootstrapPassword -Sql "GRANT CONNECT ON DATABASE $dbName TO $appUser;"

Invoke-Psql `
    -PsqlPath $psqlPath `
    -Config $config `
    -Database $dbName `
    -UserName $adminUser `
    -Password $adminPassword `
    -SqlFile $SchemaSqlPath `
    -Variables @{
        admin_user = $adminUser
        app_user = $appUser
    }

Write-Host "Database '$dbName' is ready."
