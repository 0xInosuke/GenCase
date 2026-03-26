# GenCase

GenCase is a PostgreSQL-backed CRUD web application for managing users, groups, user-group relations, and workflows.

## Stack

- Node.js
- Express
- PostgreSQL
- Plain HTML, CSS, and browser JavaScript

## Database Design

Naming rules used in the database:

- table names use the `tb_` prefix
- view names use the `v_` prefix
- column names are lowercase with underscores
- each table uses an auto-increment primary key named `id`

Current schema:

- `tb_user`
- `tb_group`
- `tb_user_group`
- `tb_workflow`
- `tb_case`
- `tb_comments`
- `v_user_group_detail`
- `v_case_detail`

Case visibility rules:

- A logged-in user can only list/view/update/delete cases that are accessible to their active user groups.
- Access is computed from `tb_workflow.wf_data.access` using the case `stage_code`.
- API returns `403` when a user tries to access a case outside their permissions.
- Case comments are shown in case detail page and ordered by `created_time` ascending.
- Each comment shows creator `display_name`.
- Comments can be created but not deleted by users.

Status code values:

- `ACT`: Active
- `INACT`: Inactive
- `DEL`: Deleted
- `PEND`: Pending

## Setup

1. Fill in [`.env`](./.env)
2. Rebuild the database:

```powershell
powershell -ExecutionPolicy Bypass -File .\db\init_db.ps1
powershell -ExecutionPolicy Bypass -File .\db\init_testdata.ps1
```

3. Install dependencies:

```powershell
npm.cmd install
```

4. Start the app:

```powershell
npm.cmd start
```

The app runs at `http://127.0.0.1:3000`.
You must login first at `http://127.0.0.1:3000/login` before accessing the CRUD console.

Default seeded active user for login:

- `user_name`: `alice`
- `user_password`: `alice_password_123`
- `alice` can view all seeded cases (admin + editor groups)
- `bob` can only view part of seeded cases (editor group)
- `charlie` can view zero seeded cases (viewer group, no matching stage access)

## Scripts

- [db/init_db.ps1](./db/init_db.ps1): resets the database, recreates roles, and rebuilds schema
- [db/init_testdata.ps1](./db/init_testdata.ps1): inserts deterministic seed data
- [db/workflow_sample.json](./db/workflow_sample.json): sample `wf_data` JSON for workflow records
- `npm.cmd start`: starts the web server
- `npm.cmd test`: runs integration tests against the local database

## Structure

- [server.js](./server.js): server entry point
- [src/app.js](./src/app.js): Express app setup and error handling
- [src/controllers](./src/controllers): request handlers
- [src/models](./src/models): database access layer
- [src/routes](./src/routes): API routes
- [public](./public): frontend assets
- [tests/run-tests.js](./tests/run-tests.js): integration smoke tests
