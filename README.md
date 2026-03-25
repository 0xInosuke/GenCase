# GenCase

GenCase is a PostgreSQL-backed CRUD web application for managing users, groups, and user-group relations.

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
- `v_user_group_detail`

Status code values:

- `ACT`: Active
- `INACT`: Inactive
- `DEL`: Deleted
- `PEND`: Pending

## Setup

1. Fill in [`.env`](d:/work/09%20creative/GenCase/.env)
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

## Scripts

- [db/init_db.ps1](d:/work/09%20creative/GenCase/db/init_db.ps1): resets the database, recreates roles, and rebuilds schema
- [db/init_testdata.ps1](d:/work/09%20creative/GenCase/db/init_testdata.ps1): inserts deterministic seed data
- `npm.cmd start`: starts the web server
- `npm.cmd test`: runs integration tests against the local database

## Structure

- [server.js](d:/work/09%20creative/GenCase/server.js): server entry point
- [src/app.js](d:/work/09%20creative/GenCase/src/app.js): Express app setup and error handling
- [src/controllers](d:/work/09%20creative/GenCase/src/controllers): request handlers
- [src/models](d:/work/09%20creative/GenCase/src/models): database access layer
- [src/routes](d:/work/09%20creative/GenCase/src/routes): API routes
- [public](d:/work/09%20creative/GenCase/public): frontend assets
- [tests/run-tests.js](d:/work/09%20creative/GenCase/tests/run-tests.js): integration smoke tests
