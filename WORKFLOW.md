# Workflow JSON Instruction

This document defines the exact `workflow` JSON format accepted by this project.

If you provide this instruction to an AI and ask it to generate workflow JSON, the result should be directly usable in the workflow create API.

## 1. API Payload Shape

Use this payload when creating or updating a workflow:

```json
{
  "wf_name": "string",
  "status_code": "ACT",
  "wf_data": {
    "name": "string",
    "description": "string",
    "stages": ["stage_one", "stage_two"],
    "access": {
      "stage_one": ["group_a", "group_b"],
      "stage_two": ["group_a"]
    }
  }
}
```

## 2. Field Rules

### Top-level fields

- `wf_name`
  - required
  - non-empty string
  - should be unique in database
- `status_code`
  - required
  - must be one of: `ACT`, `INACT`, `DEL`, `PEND`
- `wf_data`
  - required
  - must be a JSON object

### `wf_data` fields

- `name`
  - required
  - non-empty string
- `description`
  - required
  - non-empty string
- `stages`
  - required
  - non-empty array of non-empty strings
  - stage names must be unique
- `access`
  - required
  - object
  - every stage in `stages` must exist as a key in `access`
  - each `access[stage]` must be a non-empty array of non-empty strings (user group names)
  - `access` must not contain keys not listed in `stages`

## 3. Naming Recommendations

- `wf_name`: snake_case, system-friendly identifier (for example `employee_onboarding`)
- `wf_data.name`: human-readable title
- stage names: lowercase snake_case (for example `manager_review`)
- group names in `access`: must match real group names in your system (for example `admin`, `editor`, `viewer`)

## 4. Valid Example

```json
{
  "wf_name": "vendor_approval",
  "status_code": "ACT",
  "wf_data": {
    "name": "Vendor Approval",
    "description": "Review and approve new vendor onboarding.",
    "stages": ["draft", "compliance_review", "finance_review", "approved"],
    "access": {
      "draft": ["editor", "admin"],
      "compliance_review": ["admin"],
      "finance_review": ["admin"],
      "approved": ["admin", "viewer"]
    }
  }
}
```

## 5. Invalid Example (Do Not Use)

```json
{
  "wf_name": "bad_example",
  "status_code": "ACTIVE",
  "wf_data": {
    "name": "Bad",
    "description": "",
    "stages": ["draft", "draft"],
    "access": {
      "draft": []
    }
  }
}
```

Why invalid:

- `status_code` must be `ACT|INACT|DEL|PEND`
- `description` cannot be empty
- `stages` cannot contain duplicates
- `access.draft` cannot be empty
- `access` is missing key for all stages (if more stages exist)

## 6. Prompt Template for AI

Use this prompt when asking an AI to generate workflow JSON:

```text
Generate a valid workflow payload JSON for this system.
Output JSON only, no markdown.
Must follow these strict rules:
- keys: wf_name, status_code, wf_data
- status_code in [ACT, INACT, DEL, PEND]
- wf_data keys: name, description, stages, access
- stages: non-empty unique string array
- access must include exactly all stage keys
- each access[stage] is a non-empty string array of user group names

Business requirement:
<put your requirement here>
```

## 7. Ready-to-save File Format

When saving as a file for direct API use, store exactly one JSON object (the payload above), for example:

- file name: `new_workflow.json`
- content: valid JSON object with `wf_name`, `status_code`, `wf_data`

