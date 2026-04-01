# AGENTS.md

This repository is designed for AI-assisted development.

All agents must follow the rules below before writing or modifying code.

--------------------------------------------------

# 1. REQUIRED READING ORDER

Before making any changes, agents MUST read the following files in order when they exist:

1. `README.md`  
   Understand current project scope, setup steps, and seeded business rules.

2. `AGENTS.md`  
   Follow repository-specific implementation rules and UI conventions.

3. `db/init_db.ps1`  
   Understand the current authoritative database schema.

4. `db/init_testdata.ps1`  
   Understand the expected deterministic seed data.

Agents must also inspect the relevant existing code before implementation.

--------------------------------------------------

# 2. TASK EXECUTION RULES

Rules:

- Work from the user's latest request and current repository state
- Prefer updating the existing implementation instead of rebuilding working features from scratch
- When business logic changes, update all affected layers together:
  database schema, seed data, backend, frontend, tests, and documentation
- Keep initialization scripts runnable at all times

--------------------------------------------------

# 3. DATABASE RULES

Key requirements:

- Database: PostgreSQL
- Dynamic data must use JSONB
- Table names must follow defined prefix rules
- Never create tables that violate naming conventions

If database changes are required:

- Update canonical SQL files first:
  - `db/sql/init_db_schema.sql`
  - `db/sql/init_testdata.sql`
- Keep all runners synchronized:
  - `db/init_db.ps1`
  - `db/init_testdata.ps1`
  - `db/init_db.sh`
  - `db/init_testdata.sh`
- Update any affected list/detail views and APIs
- Update tests and documentation
- Update audit generation if the changed model or feature should be auditable

`db/init_db.ps1` must always be able to rebuild the full local project database from scratch.
`db/init_db.sh` must provide equivalent behavior on Linux/macOS.

--------------------------------------------------

# 4. CODE MODIFICATION POLICY

Agents must follow these principles:

1. Always read existing code before writing new code.
2. Prefer modifying existing files rather than creating new ones.
3. Avoid duplicate functionality.
4. Keep code changes minimal and focused.

Large refactors should only happen if explicitly required by a task.

--------------------------------------------------

# 5. PROJECT STRUCTURE

Agents must follow the current repository structure:

- `src/` for backend application code
- `public/` for frontend assets
- `db/` for database initialization and seed scripts
- `tests/` for automated verification

Frontend module standards:

- Keep `public/app.js` focused on orchestration (state flow and event wiring), not large rendering blocks.
- Keep shared frontend helpers in `public/core/`.
- Keep model-specific frontend config in `public/models/`.
- Keep reusable view/render/edit logic in `public/components/`.
- For new UI features, extend these module boundaries instead of adding large single-file logic.

Do not introduce new top-level folders unless there is a clear need.

--------------------------------------------------

# 6. COMMIT RULES

Commits should follow this format:

feat: new feature  
fix: bug fix  
refactor: code refactor  
docs: documentation updates  

Agents should group related changes into a single commit.

Additional required workflow:

- After any code modification, run the relevant tests before committing.
- If tests pass, commit the latest related changes and push to GitHub in the same task.
- If tests fail, do not push; fix failures first, then commit and push.

--------------------------------------------------

# 7. AI BEHAVIOR GUIDELINES

Agents should behave as careful collaborators:

- Always reason about the existing system
- Avoid unnecessary file rewrites
- Avoid breaking existing APIs
- Ensure consistency with project conventions

If uncertainty exists, consult documentation files before proceeding.

--------------------------------------------------

# 8. CRUD UI STANDARDS

All future business models must follow the same CRUD interface pattern unless a task explicitly overrides it.

Required UI pattern for each model:

- A dedicated `list view`
- A dedicated `detail view`
- An `edit` flow launched from detail view
- A `delete` action launched from detail view with a second confirmation step

Required `list view` behavior:

- Show records in table form
- Include search at the top of the list
- Support sortable column headers with ascending and descending order
- Support pagination
- Default page size is 20 and must be adjustable

Required `detail view` behavior:

- Show full record details
- Not every field should be editable
- Immutable fields such as primary keys must remain read-only

Required backend support for list views:

- Search
- Sorting
- Pagination

If a new data model is added later, agents must implement the same list/detail/edit/delete structure and update database init scripts and seed scripts if schema changes are involved.

--------------------------------------------------

# 9. AUDIT RULES

Auditable business changes must be recorded in `tb_audit`.

Rules:

- Audit records are system-generated only
- Do not add UI flows that create, edit, or delete audit records directly
- Show audit records in the target object's detail page
- Order audit records by timestamp descending
- For comments, do not create audit records under a separate comment target
- Comment creation must create an `ADD_COMMENTS` audit record on the related case
- For sensitive or structured values such as JSON and long text, store MD5 hashes instead of raw values
- For simple status changes such as `status_code`, store the real old and new values
- Use `STATUS_CHANGE` for status-like state transitions such as `status_code` and case `stage_code`
- Use `DATA_CHANGE` for ordinary non-status field changes
- Use `PASSWORD_CHANGE` for password updates and do not store raw or hashed old/new password values in `old_value` or `new_value`
- Use `ADD_COMMENTS` when a user adds a comment to a case; store `old_value = 0` and `new_value = <comment_id>`
- When external API actions create audit records, store the API key name in `tb_audit.user_id`
- When adding future models or modification flows, decide whether they require audit and wire them in during the same task

--------------------------------------------------

# 10. EXTERNAL API RULES

External API integrations must stay separate from logged-in user routes.

Rules:

- External API routes must use API key authentication
- API keys must be loaded from a separate `api_keys.env` file
- Logged-in user case listing logic and external API case listing logic must remain separate code paths
- Workflow access lists may include both group names and API key names
- External API access checks must use API key names only
- External API changes that modify cases must also create audit records
- Document external API usage in `API.md`
- Add or update example scripts when external API behavior changes

--------------------------------------------------

# 11. DOCUMENTATION RULES

When business logic changes, review all repository Markdown files and update any stale content so docs match the implemented behavior.

Currently authoritative Markdown files in this repo:

- `README.md`
- `AGENTS.md`
- `API.md`

Dependency documentation inside `node_modules/` is not project documentation and should be ignored.

--------------------------------------------------

# 12. FILE PRIORITY

When conflicts occur, follow this priority:

User request  
AGENTS.md  
README.md  
Current code and database scripts

--------------------------------------------------

# 13. ENVIRONMENT AND DEPLOYMENT OPERATIONS

Agents must follow these cross-platform and cloud-operation rules to avoid repeated trial-and-error.

Shell rules:

- Use PowerShell-native syntax for local Windows commands.
- Use Bash-native syntax only inside Linux/macOS scripts or explicit remote `bash` execution.
- Do not mix Bash operators or quoting assumptions directly into PowerShell commands.
- Do not rely on `&&` in local PowerShell command lines in this repo; use sequential commands or explicit conditional handling instead.

Database reset rules:

- Never run database rebuild and seed commands in parallel.
- Always run schema reset first, then seed load second.
- Local Windows order:
  - `powershell -ExecutionPolicy Bypass -File .\db\init_db.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\db\init_testdata.ps1`
- Linux/macOS or remote Linux order:
  - `bash ./db/init_db.sh ./.env`
  - `bash ./db/init_testdata.sh ./.env`

Cloud VM rules:

- Assume the deployed app lives under `/opt/GenCase` unless current service configuration proves otherwise.
- Inspect the systemd service before changing deployment assumptions.
- When reading app env or running app-owned scripts on the VM, prefer `sudo -u gencase` so file permissions and runtime context match the service user.
- When copying updated files into `/opt/GenCase`, use `sudo install` or another ownership-preserving move so deployed files remain owned by the service account.
- If temporary export or diagnostic files are created by the service user under `/tmp` or other shared paths, clean them up with `sudo` when required.

Remote command safety rules:

- Keep remote `gcloud compute ssh --command` payloads simple.
- For complex remote workflows, copy a small script to the VM and run that script instead of embedding large nested quoting into one command.
- Verify remote results after rebuilds with an explicit readback query or exported summary instead of assuming the refresh succeeded.

--------------------------------------------------

# END
