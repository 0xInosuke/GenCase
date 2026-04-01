-- Keep seed data deterministic so local testing and automated tests stay predictable.
TRUNCATE TABLE tb_audit, tb_comments, tb_case, tb_user_group, tb_group, tb_user, tb_workflow RESTART IDENTITY CASCADE;

INSERT INTO tb_user (user_name, display_name, user_password, status_code)
VALUES
    ('alice', 'Alice Chen', 'alice_password_123', 'ACT'),
    ('bob', 'Bob Tan', 'bob_password_123', 'ACT'),
    ('charlie', 'Charlie Lim', 'charlie_password_123', 'ACT'),
    ('diana', 'Diana Koh', 'diana_password_123', 'ACT'),
    ('ethan', 'Ethan Ng', 'ethan_password_123', 'ACT'),
    ('fiona', 'Fiona Lee', 'fiona_password_123', 'ACT'),
    ('george', 'George Yeo', 'george_password_123', 'ACT'),
    ('helen', 'Helen Goh', 'helen_password_123', 'ACT'),
    ('ian', 'Ian Ong', 'ian_password_123', 'ACT'),
    ('julia', 'Julia Tay', 'julia_password_123', 'ACT');

INSERT INTO tb_group (group_name, status_code)
VALUES
    ('admin', 'ACT'),
    ('editor', 'ACT'),
    ('viewer', 'ACT'),
    ('compliance', 'ACT'),
    ('operations', 'ACT');

INSERT INTO tb_user_group (user_id, group_id, status_code)
VALUES
    (1, 1, 'ACT'),
    (1, 2, 'ACT'),
    (2, 2, 'ACT'),
    (3, 3, 'ACT'),
    (4, 4, 'ACT'),
    (5, 5, 'ACT'),
    (6, 2, 'ACT'),
    (6, 5, 'ACT'),
    (7, 4, 'ACT'),
    (7, 5, 'ACT'),
    (8, 1, 'ACT'),
    (9, 2, 'ACT'),
    (9, 4, 'ACT'),
    (10, 5, 'ACT');

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
                'hr_review', jsonb_build_array('admin', 'compliance'),
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
            'stages', jsonb_build_array('reported', 'triage', 'containment', 'resolved'),
            'access', jsonb_build_object(
                'reported', jsonb_build_array('admin', 'editor', 'system1_api_key'),
                'triage', jsonb_build_array('admin', 'editor'),
                'containment', jsonb_build_array('admin', 'operations', 'system2_api_key'),
                'resolved', jsonb_build_array('admin')
            )
        )
    ),
    (
        'vendor_risk_review',
        'ACT',
        jsonb_build_object(
            'name', 'Vendor Risk Review',
            'description', 'Assess supplier risk, security posture, and approvals.',
            'stages', jsonb_build_array('intake', 'assessment', 'approval', 'closed'),
            'access', jsonb_build_object(
                'intake', jsonb_build_array('admin', 'compliance', 'system1_api_key'),
                'assessment', jsonb_build_array('admin', 'compliance'),
                'approval', jsonb_build_array('admin'),
                'closed', jsonb_build_array('admin')
            )
        )
    ),
    (
        'customer_escalation',
        'ACT',
        jsonb_build_object(
            'name', 'Customer Escalation',
            'description', 'Track escalated customer issues through assignment and closure.',
            'stages', jsonb_build_array('new', 'assigned', 'waiting_customer', 'closed'),
            'access', jsonb_build_object(
                'new', jsonb_build_array('admin', 'editor', 'system2_api_key'),
                'assigned', jsonb_build_array('admin', 'editor', 'operations'),
                'waiting_customer', jsonb_build_array('admin', 'editor'),
                'closed', jsonb_build_array('admin')
            )
        )
    ),
    (
        'contract_review',
        'ACT',
        jsonb_build_object(
            'name', 'Contract Review',
            'description', 'Review commercial contracts across legal and finance teams.',
            'stages', jsonb_build_array('intake', 'legal_review', 'finance_review', 'signed'),
            'access', jsonb_build_object(
                'intake', jsonb_build_array('admin', 'compliance', 'system1_api_key'),
                'legal_review', jsonb_build_array('admin', 'compliance'),
                'finance_review', jsonb_build_array('admin', 'operations'),
                'signed', jsonb_build_array('admin')
            )
        )
    );

INSERT INTO tb_workflow (id, wf_name, status_code, wf_data, created_at, updated_at)
VALUES
    (
        10,
        'PFMC Workflow',
        'ACT',
        $${
  "name": "Problematic FMC Assessment Workflow",
  "access": {
    "concluded": ["assessment_officer", "supervisor", "inspection_team", "admin"],
    "esv_in_progress": ["inspection_team", "admin"],
    "under_assessment": ["assessment_officer", "supervisor", "admin", "system1_api_key"],
    "initial_assessment": ["assessment_officer", "supervisor", "admin"],
    "post_esv_assessment": ["assessment_officer", "supervisor", "admin"],
    "esv_inspection_queue": ["inspection_team", "supervisor", "admin"],
    "supervisor_review_esv": ["supervisor", "admin"],
    "supervisor_review_final": ["supervisor", "admin"],
    "supervisor_review_initial": ["supervisor", "admin"]
  },
  "stages": [
    "under_assessment",
    "initial_assessment",
    "supervisor_review_initial",
    "supervisor_review_esv",
    "esv_inspection_queue",
    "esv_in_progress",
    "post_esv_assessment",
    "supervisor_review_final",
    "concluded"
  ],
  "description": "Downstream officer assessment workflow for flagged FMCs requiring individual assessment, with paths for direct conclusion or ESV/inspection referral"
}$$::jsonb,
        '2026-04-01 07:01:32.511069',
        '2026-04-01 07:27:32.509203'
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
            'applicant', jsonb_build_object(
                'name', 'Candidate A',
                'region', 'APAC',
                'contacts', jsonb_build_object('email', 'candidate.a@example.com', 'phone', '+65-6000-0001')
            ),
            'checklist', jsonb_build_object(
                'documents', jsonb_build_object('passport', true, 'tax_form', false),
                'tasks', jsonb_build_array('collect_docs', 'manager_intro')
            )
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
            'applicant', jsonb_build_object(
                'name', 'Candidate B',
                'region', 'EMEA',
                'contacts', jsonb_build_object('email', 'candidate.b@example.com', 'phone', '+44-7000-0002')
            ),
            'review', jsonb_build_object('manager', 'helen', 'notes', 'Awaiting budget sign-off')
        ),
        'manager_review'
    ),
    (
        1,
        'Candidate C HR Review',
        jsonb_build_object(
            'case_name', 'Onboard - Candidate C',
            'owner', 'diana',
            'priority', 'high',
            'applicant', jsonb_build_object('name', 'Candidate C', 'region', 'NA'),
            'hr_pack', jsonb_build_object(
                'benefits', jsonb_build_array('medical', 'dental'),
                'equipment', jsonb_build_object('laptop', true, 'access_card', true)
            )
        ),
        'hr_review'
    ),
    (
        1,
        'Candidate D Completion',
        jsonb_build_object(
            'case_name', 'Onboard - Candidate D',
            'owner', 'helen',
            'priority', 'low',
            'completion', jsonb_build_object(
                'orientation', true,
                'accounts', jsonb_build_object('email', true, 'vpn', true)
            )
        ),
        'completed'
    ),
    (
        2,
        'Region A Incident Intake',
        jsonb_build_object(
            'case_name', 'Incident - Region A',
            'owner', 'bob',
            'priority', 'high',
            'incident', jsonb_build_object(
                'region', 'APAC',
                'systems', jsonb_build_object('primary', 'payments', 'impacted', jsonb_build_array('portal', 'notifications'))
            ),
            'triage', jsonb_build_object('severity', 'sev2', 'commander', 'alice')
        ),
        'reported'
    ),
    (
        2,
        'Region B Incident Triage',
        jsonb_build_object(
            'case_name', 'Incident - Region B',
            'owner', 'alice',
            'priority', 'critical',
            'incident', jsonb_build_object(
                'region', 'EU',
                'systems', jsonb_build_object('primary', 'identity', 'impacted', jsonb_build_array('sso'))
            ),
            'triage', jsonb_build_object('severity', 'sev1', 'commander', 'fiona')
        ),
        'triage'
    ),
    (
        2,
        'Region C Containment',
        jsonb_build_object(
            'case_name', 'Incident - Region C',
            'owner', 'ethan',
            'priority', 'critical',
            'incident', jsonb_build_object('region', 'US', 'systems', jsonb_build_object('primary', 'api_gateway')),
            'containment', jsonb_build_object('actions', jsonb_build_array('block_ip', 'rotate_keys'))
        ),
        'containment'
    ),
    (
        2,
        'Region D Resolution',
        jsonb_build_object(
            'case_name', 'Incident - Region D',
            'owner', 'helen',
            'priority', 'medium',
            'resolution', jsonb_build_object('root_cause', 'cache_misconfig', 'downtime_minutes', 14)
        ),
        'resolved'
    ),
    (
        3,
        'Vendor One Intake',
        jsonb_build_object(
            'case_name', 'Vendor Review - One',
            'owner', 'diana',
            'priority', 'high',
            'vendor', jsonb_build_object(
                'name', 'Vendor One',
                'country', 'SG',
                'contacts', jsonb_build_array(
                    jsonb_build_object('name', 'Lina', 'role', 'Sales'),
                    jsonb_build_object('name', 'Omar', 'role', 'Security')
                )
            ),
            'assessment', jsonb_build_object('security', jsonb_build_object('score', 74))
        ),
        'intake'
    ),
    (
        3,
        'Vendor Two Assessment',
        jsonb_build_object(
            'case_name', 'Vendor Review - Two',
            'owner', 'george',
            'priority', 'medium',
            'vendor', jsonb_build_object('name', 'Vendor Two', 'country', 'JP'),
            'assessment', jsonb_build_object('security', jsonb_build_object('score', 82, 'open_items', jsonb_build_array('mfa_policy')))
        ),
        'assessment'
    ),
    (
        3,
        'Vendor Three Approval',
        jsonb_build_object(
            'case_name', 'Vendor Review - Three',
            'owner', 'alice',
            'priority', 'medium',
            'vendor', jsonb_build_object('name', 'Vendor Three', 'country', 'US'),
            'approval', jsonb_build_object('risk_owner', 'helen', 'decision', 'pending')
        ),
        'approval'
    ),
    (
        3,
        'Vendor Four Closed',
        jsonb_build_object(
            'case_name', 'Vendor Review - Four',
            'owner', 'helen',
            'priority', 'low',
            'closure', jsonb_build_object('decision', 'accepted', 'review_cycle_months', 12)
        ),
        'closed'
    ),
    (
        4,
        'Customer Escalation New',
        jsonb_build_object(
            'case_name', 'Escalation - New',
            'owner', 'bob',
            'priority', 'high',
            'customer', jsonb_build_object(
                'name', 'Northwind',
                'tier', 'gold',
                'contact', jsonb_build_object('email', 'ops@northwind.example')
            ),
            'issue', jsonb_build_object('category', 'billing', 'opened_hours', 6)
        ),
        'new'
    ),
    (
        4,
        'Customer Escalation Assigned',
        jsonb_build_object(
            'case_name', 'Escalation - Assigned',
            'owner', 'fiona',
            'priority', 'high',
            'assignment', jsonb_build_object('queue', 'ops-l2', 'sla_minutes', 45)
        ),
        'assigned'
    ),
    (
        4,
        'Customer Waiting Response',
        jsonb_build_object(
            'case_name', 'Escalation - Waiting',
            'owner', 'alice',
            'priority', 'normal',
            'waiting', jsonb_build_object('last_contact', '2026-03-24T09:00:00Z', 'expected_reply_hours', 24)
        ),
        'waiting_customer'
    ),
    (
        4,
        'Customer Escalation Closed',
        jsonb_build_object(
            'case_name', 'Escalation - Closed',
            'owner', 'helen',
            'priority', 'low',
            'closure', jsonb_build_object('result', 'refund_issued', 'customer_satisfaction', 5)
        ),
        'closed'
    ),
    (
        5,
        'Contract Intake APAC',
        jsonb_build_object(
            'case_name', 'Contract - APAC',
            'owner', 'ian',
            'priority', 'high',
            'contract', jsonb_build_object(
                'value', 125000,
                'currency', 'USD',
                'parties', jsonb_build_object('internal', 'GenCase', 'external', 'Contoso')
            ),
            'review', jsonb_build_object(
                'risks', jsonb_build_array('liability_cap', 'data_transfer'),
                'approvers', jsonb_build_array('diana', 'ethan')
            )
        ),
        'intake'
    ),
    (
        5,
        'Contract Legal Review EU',
        jsonb_build_object(
            'case_name', 'Contract - EU',
            'owner', 'diana',
            'priority', 'high',
            'legal', jsonb_build_object('jurisdiction', 'DE', 'clauses', jsonb_build_array('dpa', 'scc'))
        ),
        'legal_review'
    ),
    (
        5,
        'Contract Finance Review US',
        jsonb_build_object(
            'case_name', 'Contract - US',
            'owner', 'ethan',
            'priority', 'medium',
            'finance', jsonb_build_object('annual_value', 78000, 'billing_model', 'subscription')
        ),
        'finance_review'
    ),
    (
        5,
        'Contract Signed LATAM',
        jsonb_build_object(
            'case_name', 'Contract - LATAM',
            'owner', 'alice',
            'priority', 'low',
            'signature', jsonb_build_object('signed_by', 'helen', 'signed_date', '2026-03-20')
        ),
        'signed'
    );

INSERT INTO tb_case (id, workflow_id, case_title, case_data, stage_code, created_at, updated_at)
VALUES
    (
        32,
        10,
        'Astralux Asset Management 2024',
        $${
  "Outcome": "",
  "Assessment": "",
  "Case owner": "Andrew Teo",
  "Action-taker": "Andrew Teo",
  "Overall risk score": 3.25
}$$::jsonb,
        'under_assessment',
        '2026-04-01 07:36:25.458334',
        '2026-04-01 07:36:25.458334'
    ),
    (
        33,
        10,
        'Quantex Investment Holdings 2025',
        $${
  "Outcome": "No further action",
  "Assessment": "No issues found. To close case.",
  "Case owner": "Bob Tan",
  "Action-taker": "Alice Chen",
  "Overall risk score": 6.75
}$$::jsonb,
        'concluded',
        '2026-04-01 07:36:25.891971',
        '2026-04-01 07:56:07.981365'
    );

INSERT INTO tb_comments (case_id, user_id, content, status_code)
VALUES
    (1, 1, 'Initial onboarding package has been prepared.', 'ACT'),
    (1, 2, 'Manager review checklist added for candidate A.', 'ACT'),
    (2, 8, 'Budget owner requested one more business justification item.', 'ACT'),
    (5, 2, 'Incident commander assigned and communications drafted.', 'ACT'),
    (6, 1, 'Triage notes updated with impact and severity details.', 'ACT'),
    (9, 4, 'Vendor intake questionnaire attached to record.', 'ACT'),
    (13, 2, 'Escalation acknowledged by support operations.', 'ACT'),
    (14, 6, 'Assigned queue accepted the escalation.', 'ACT'),
    (17, 9, 'Contract intake package submitted for review.', 'ACT'),
    (18, 4, 'Legal review highlighted two data transfer clauses.', 'ACT');

INSERT INTO tb_audit (user_id, target_id, target_type, timestamp, change_type, old_value, new_value)
VALUES
    ('1', 3, 'user', CURRENT_TIMESTAMP - INTERVAL '9 day', 'STATUS_CHANGE', 'PEND', 'ACT'),
    ('8', 2, 'workflow', CURRENT_TIMESTAMP - INTERVAL '8 day', 'STATUS_CHANGE', 'ACT', 'PEND'),
    ('2', 1, 'case', CURRENT_TIMESTAMP - INTERVAL '7 day', 'DATA_CHANGE', 'md5:5dfae3f94d0f8d6507ecda95e761f19b', 'md5:bf62922f1f37af76d4d22dd53f3407aa'),
    ('1', 1, 'case', CURRENT_TIMESTAMP - INTERVAL '6 day', 'ADD_COMMENTS', '0', '1'),
    ('2', 1, 'case', CURRENT_TIMESTAMP - INTERVAL '5 day', 'ADD_COMMENTS', '0', '2'),
    ('8', 2, 'case', CURRENT_TIMESTAMP - INTERVAL '4 day', 'ADD_COMMENTS', '0', '3'),
    ('2', 5, 'case', CURRENT_TIMESTAMP - INTERVAL '72 hour', 'ADD_COMMENTS', '0', '4'),
    ('1', 6, 'case', CURRENT_TIMESTAMP - INTERVAL '60 hour', 'ADD_COMMENTS', '0', '5'),
    ('4', 9, 'case', CURRENT_TIMESTAMP - INTERVAL '48 hour', 'ADD_COMMENTS', '0', '6'),
    ('2', 13, 'case', CURRENT_TIMESTAMP - INTERVAL '36 hour', 'ADD_COMMENTS', '0', '7'),
    ('6', 14, 'case', CURRENT_TIMESTAMP - INTERVAL '24 hour', 'ADD_COMMENTS', '0', '8'),
    ('9', 17, 'case', CURRENT_TIMESTAMP - INTERVAL '18 hour', 'ADD_COMMENTS', '0', '9'),
    ('4', 18, 'case', CURRENT_TIMESTAMP - INTERVAL '12 hour', 'ADD_COMMENTS', '0', '10');

SELECT pg_catalog.setval('public.tb_workflow_id_seq', (SELECT MAX(id) FROM tb_workflow), true);
SELECT pg_catalog.setval('public.tb_case_id_seq', (SELECT MAX(id) FROM tb_case), true);
