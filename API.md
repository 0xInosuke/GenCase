# External Case API

This project provides a separate external API for case integration.

External API routes are independent from the logged-in user routes and use API key authentication instead of session cookies.

## Authentication

Send the API key in the `x-api-key` header.

Configured keys are loaded from `api_keys.env`.

Example:

```http
x-api-key: key1243456756756
```

The system resolves the key to its configured name such as `system1_api_key`.

Workflow access rules may contain:

- group names for logged-in user access
- API key names for external API access

## Permission Model Summary

The system has two independent case-access paths:

- Session user path (`/api/cases`): access is determined by active user groups.
- External API path (`/external-api/cases`): access is determined by API key name.

For stage transitions, behavior is different by path:

- Session user update (`PUT /api/cases/:id`): user must access the case at its current stage; destination stage must be valid in the workflow; destination stage access is not required for that updater.
- External API update (`PUT /external-api/cases/:id`): API key must access the case at its current stage and must also be allowed in the destination stage access list.

In both paths, a caller may lose visibility immediately after moving a case to a stage they cannot access.

## Base Path

All external case routes are under:

```text
/external-api/cases
```

## Supported Operations

### 1. List Cases

`GET /external-api/cases`

Query parameters:

- `search`
- `sort_by`
- `sort_dir`
- `page`
- `page_size`

Search supports:

- plain text search
- JSON condition search against `case_data`

Example:

```text
/external-api/cases?search={"owner":"integration"}&sort_by=id&sort_dir=asc&page=1&page_size=20
```

Only cases visible to the current API key are returned.

### 2. Get One Case

`GET /external-api/cases/:id`

Returns `403` when the API key does not have access to the case.

### 3. Create Case

`POST /external-api/cases`

Required JSON body:

```json
{
  "workflow_id": 1,
  "case_title": "External API Case",
  "stage_code": "draft",
  "case_data": {
    "source": "system1",
    "owner": "integration",
    "severity": "medium"
  }
}
```

Rules:

- the workflow must exist
- the workflow must be active
- the stage must exist in the workflow definition
- the API key name must be listed in `wf_data.access[stage_code]`

### 4. Update Case

`PUT /external-api/cases/:id`

Required JSON body:

```json
{
  "case_title": "External API Case Updated",
  "stage_code": "security_review",
  "case_data": {
    "source": "system1",
    "owner": "integration",
    "severity": "high"
  }
}
```

Rules:

- the API key must already have access to the target case
- the target stage must exist in the workflow definition
- the API key name must be allowed in the destination stage access list

## Audit Behavior

External API case create and update operations generate audit records automatically.

Audit rules:

- `user_id` stores the API key name such as `system1_api_key`
- stage changes create `STATUS_CHANGE`
- case content changes create `DATA_CHANGE`
- sensitive or structured values are stored as MD5-based audit payloads
