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

- Update `db/init_db.ps1`
- Update `db/init_testdata.ps1`
- Update any affected list/detail views and APIs
- Update tests and documentation
- Update audit generation if the changed model or feature should be auditable

`db/init_db.ps1` must always be able to rebuild the full local project database from scratch.

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

Do not introduce new top-level folders unless there is a clear need.

--------------------------------------------------

# 6. COMMIT RULES

Commits should follow this format:

feat: new feature  
fix: bug fix  
refactor: code refactor  
docs: documentation updates  

Agents should group related changes into a single commit.

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
- When adding future models or modification flows, decide whether they require audit and wire them in during the same task

--------------------------------------------------

# 10. DOCUMENTATION RULES

When business logic changes, review all repository Markdown files and update any stale content so docs match the implemented behavior.

Currently authoritative Markdown files in this repo:

- `README.md`
- `AGENTS.md`

Dependency documentation inside `node_modules/` is not project documentation and should be ignored.

--------------------------------------------------

# 11. FILE PRIORITY

When conflicts occur, follow this priority:

User request  
AGENTS.md  
README.md  
Current code and database scripts

--------------------------------------------------

# END
