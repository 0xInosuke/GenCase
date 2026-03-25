# AGENTS.md

This repository is designed for AI-assisted development.

All agents must follow the rules below before writing or modifying code.

--------------------------------------------------

# 1. REQUIRED READING ORDER

Before making any changes, agents MUST read the following files in order:

1. TASKS.md  
   Understand the current task and its requirements.

2. ARCHITECTURE.md  
   Understand the system design and component relationships.

3. DATABASE.md  
   Follow database naming conventions and schema rules.

4. README.md  
   Understand project goals and overall context.

Agents must not begin implementation without reading these files.

--------------------------------------------------

# 2. TASK EXECUTION RULES

Agents must work strictly according to TASKS.md.

Rules:

- Only work on tasks marked as `status: pending`
- Do not modify tasks assigned to other agents
- When a task is completed, update its status to:

status: done

- If a task cannot be completed, update:

status: blocked

and explain the reason.

--------------------------------------------------

# 3. DATABASE RULES

All database design must follow DATABASE.md.

Key requirements:

- Database: PostgreSQL
- Dynamic data must use JSONB
- Table names must follow defined prefix rules
- Never create tables that violate naming conventions

If database changes are required, update DATABASE.md accordingly.
If database changes are required, update init_db.ps1 accordingly. Ensure init_db.ps1 script can always re-initiate project database.

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

Agents must follow the repository structure:

backend/    backend services  
frontend/   frontend application  
scripts/    automation scripts  

Do not create new top-level folders unless necessary.

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

# 8. FILE PRIORITY

When conflicts occur, follow this priority:

TASKS.md  
ARCHITECTURE.md  
DATABASE.md  
AGENTS.md  
README.md

--------------------------------------------------

# END