param(
    [string]$EnvPath = ".env"
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

function Invoke-Psql {
    param(
        [hashtable]$Config,
        [string]$Database,
        [string]$UserName,
        [string]$Password,
        [string]$Sql
    )

    $env:PGPASSWORD = $Password
    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
        -v "ON_ERROR_STOP=1" `
        -h $Config["DB_HOST"] `
        -p $Config["DB_PORT"] `
        -U $UserName `
        -d $Database `
        -c $Sql

    if ($LASTEXITCODE -ne 0) {
        throw "psql command failed."
    }
}

$config = Get-EnvMap -Path $EnvPath

# Keep seed data deterministic so local testing and automated tests stay predictable.
$seedSql = @"
TRUNCATE TABLE tb_user_group, tb_group, tb_user RESTART IDENTITY CASCADE;
TRUNCATE TABLE tb_workflow RESTART IDENTITY CASCADE;

INSERT INTO tb_user (user_name, display_name, user_password, status_code)
VALUES
    ('alice', 'Alice Chen', 'alice_password_123', 'ACT'),
    ('bob', 'Bob Tan', 'bob_password_123', 'ACT'),
    ('charlie', 'Charlie Lim', 'charlie_password_123', 'INACT');

INSERT INTO tb_group (group_name, status_code)
VALUES
    ('admin', 'ACT'),
    ('editor', 'ACT'),
    ('viewer', 'PEND');

INSERT INTO tb_user_group (user_id, group_id, status_code)
VALUES
    (1, 1, 'ACT'),
    (1, 2, 'ACT'),
    (2, 2, 'ACT'),
    (3, 3, 'INACT');

INSERT INTO tb_workflow (wf_name, status_code, wf_data)
VALUES
    (
        'employee_onboarding',
        'ACT',
        jsonb_build_object(
            'name', 'Employee Onboarding',
            'description', 'Standard onboarding approval workflow for new joiners.',
            'stages', jsonb_build_array('draft', 'manager_review', 'hr_review', 'completed'),
            'access', jsonb_build_object(
                'draft', jsonb_build_array('admin', 'editor'),
                'manager_review', jsonb_build_array('admin', 'editor'),
                'hr_review', jsonb_build_array('admin'),
                'completed', jsonb_build_array('admin', 'viewer')
            )
        )
    ),
    (
        'incident_response',
        'PEND',
        jsonb_build_object(
            'name', 'Incident Response',
            'description', 'Incident triage and escalation workflow.',
            'stages', jsonb_build_array('reported', 'triage', 'resolved'),
            'access', jsonb_build_object(
                'reported', jsonb_build_array('viewer', 'editor'),
                'triage', jsonb_build_array('admin', 'editor'),
                'resolved', jsonb_build_array('admin', 'viewer')
            )
        )
    );
"@

Invoke-Psql `
    -Config $config `
    -Database $config["DB_NAME"] `
    -UserName $config["DB_ADMIN_USER"] `
    -Password $config["DB_ADMIN_PASSWORD"] `
    -Sql $seedSql

Write-Host "Test data inserted into '$($config["DB_NAME"])'."
