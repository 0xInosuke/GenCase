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
TRUNCATE TABLE tb_audit, tb_comments, tb_case, tb_user_group, tb_group, tb_user, tb_workflow RESTART IDENTITY CASCADE;

INSERT INTO tb_user (user_name, display_name, user_password, status_code)
VALUES
    ('alice', 'Alice Chen', 'alice_password_123', 'ACT'),
    ('bob', 'Bob Tan', 'bob_password_123', 'ACT'),
    ('charlie', 'Charlie Lim', 'charlie_password_123', 'ACT');

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
    (3, 3, 'ACT');

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
                'draft', jsonb_build_array('admin', 'editor', 'system1_api_key'),
                'manager_review', jsonb_build_array('admin', 'system2_api_key'),
                'hr_review', jsonb_build_array('admin'),
                'completed', jsonb_build_array('admin')
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
                'reported', jsonb_build_array('admin', 'editor', 'system1_api_key'),
                'triage', jsonb_build_array('admin', 'editor'),
                'resolved', jsonb_build_array('admin')
            )
        )
    );

INSERT INTO tb_case (workflow_id, case_title, case_data, stage_code)
VALUES
    (
        1,
        'Candidate A Onboarding',
        jsonb_build_object(
            'case_name', 'Onboard - Candidate A',
            'owner', 'alice',
            'priority', 'high',
            'notes', 'Draft stage. Admin/editor can access.'
        ),
        'draft'
    ),
    (
        1,
        'Candidate B Manager Review',
        jsonb_build_object(
            'case_name', 'Onboard - Candidate B',
            'owner', 'bob',
            'priority', 'normal',
            'notes', 'Manager review stage. Admin only.'
        ),
        'manager_review'
    ),
    (
        2,
        'Region A Incident Intake',
        jsonb_build_object(
            'case_name', 'Incident - Region A',
            'owner', 'bob',
            'priority', 'high',
            'notes', 'Reported stage. Admin/editor can access.'
        ),
        'reported'
    ),
    (
        2,
        'Region B Incident Resolution',
        jsonb_build_object(
            'case_name', 'Incident - Region B',
            'owner', 'alice',
            'priority', 'critical',
            'notes', 'Resolved stage. Admin only.'
        ),
        'resolved'
    );

INSERT INTO tb_comments (case_id, user_id, content, status_code)
VALUES
    (1, 1, 'Initial onboarding case created and reviewed.', 'ACT'),
    (1, 2, 'Added supporting documents for editor review.', 'ACT'),
    (2, 1, 'Manager review requested updates to checklist.', 'ACT'),
    (3, 2, 'Incident triage started and escalation noted.', 'ACT'),
    (4, 1, 'Final resolution confirmed by admin.', 'ACT');

INSERT INTO tb_audit (user_id, target_id, target_type, timestamp, change_type, old_value, new_value)
VALUES
    ('1', 3, 'user', CURRENT_TIMESTAMP - INTERVAL '6 day', 'STATUS_CHANGE', 'PEND', 'ACT'),
    ('1', 2, 'workflow', CURRENT_TIMESTAMP - INTERVAL '5 day', 'STATUS_CHANGE', 'ACT', 'PEND'),
    ('2', 1, 'case', CURRENT_TIMESTAMP - INTERVAL '4 day', 'DATA_CHANGE', 'md5:5dfae3f94d0f8d6507ecda95e761f19b', 'md5:bf62922f1f37af76d4d22dd53f3407aa'),
    ('1', 1, 'case', CURRENT_TIMESTAMP - INTERVAL '3 day', 'ADD_COMMENTS', '0', '1'),
    ('2', 1, 'case', CURRENT_TIMESTAMP - INTERVAL '2 day', 'ADD_COMMENTS', '0', '2'),
    ('1', 2, 'case', CURRENT_TIMESTAMP - INTERVAL '36 hour', 'ADD_COMMENTS', '0', '3'),
    ('2', 3, 'case', CURRENT_TIMESTAMP - INTERVAL '24 hour', 'ADD_COMMENTS', '0', '4'),
    ('1', 4, 'case', CURRENT_TIMESTAMP - INTERVAL '12 hour', 'ADD_COMMENTS', '0', '5');
"@

Invoke-Psql `
    -Config $config `
    -Database $config["DB_NAME"] `
    -UserName $config["DB_ADMIN_USER"] `
    -Password $config["DB_ADMIN_PASSWORD"] `
    -Sql $seedSql

Write-Host "Test data inserted into '$($config["DB_NAME"])'."
