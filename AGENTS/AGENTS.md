# [AGENTS.md](http://AGENTS.md)

## Project Agent Instructions

This file is the primary instruction entry point for AI coding agents working on this project.

Before development, read and follow `AGENT_WORKFLOW.md`.
When managing Agent Skills, read and follow `AGENT_SKILLS.md`.

## Required Development Behavior

For every development task:

1. Understand the user's request.
2. Read the relevant instructions in `AGENT_WORKFLOW.md`.
3. Identify the relevant installed skills.
4. Use only the skills needed for the task.
5. Implement the change.
6. Run relevant tests and checks.
7. Review the changes.
8. Perform final verification.
9. Report only what was actually verified.

Do not claim tests, builds, deployments, migrations, or security checks succeeded unless they were actually executed successfully.

## Skill Usage

Use the smallest relevant set of skills.

- Laravel: prefer Laravel Boost.
- Next.js/React: use the relevant React/Next.js best-practices skills.
- UI/UX: use `frontend-design` and `web-design-guidelines`.
- Planning: use `brainstorming` and `writing-plans`.
- Debugging: use `systematic-debugging`.
- Testing: use `test-driven-development`.
- Code review: use `requesting-code-review`.
- API, Docker, and CI/CD skills: use when relevant.



## Project Stack

Frontend:

- Next.js
- React
- Tailwind CSS

Backend:

- Laravel
- PHP
- REST API
- Eloquent ORM

Database:

- PostgreSQL

Infrastructure:

- Docker
- CI/CD

Do not introduce another backend framework or ORM unless explicitly requested.

Do not introduce Prisma for the Laravel backend.

## Architecture

The intended architecture is:

```text
Next.js
    │
    │ HTTP / REST API
    ▼
Laravel
    │
    │ Eloquent
    ▼
PostgreSQL
```

Next.js must not connect directly to PostgreSQL.

Database access belongs to Laravel.

Business logic and sensitive operations belong to the backend unless there is a clear architectural reason otherwise.

## Security

Never expose or commit:

```text
.env
API keys
access tokens
database passwords
SSH private keys
cloud credentials
Docker credentials
Git credentials
```

Do not install or execute untrusted Agent Skills without following the security audit process in `AGENT_SKILLS.md`.

## Existing Project Conventions

Before changing code:

1. Inspect the existing project structure.
2. Follow existing conventions.
3. Reuse existing patterns when appropriate.
4. Avoid unnecessary dependencies.
5. Avoid unnecessary abstractions.
6. Do not rewrite working code without a reason.



## User Instructions

Valid user instructions take priority over project-specific workflow preferences, unless they conflict with higher-priority system or safety requirements.

If the user explicitly asks to deviate from a workflow step, follow that request when appropriate and mention important consequences.

## Instruction Hierarchy

```text
AGENTS.md
    │
    ├── Development
    │      ↓
    │  AGENT_WORKFLOW.md
    │
    └── Skill Management
           ↓
       AGENT_SKILLS.md
```

`AGENTS.md` is the entry point.

`AGENT_WORKFLOW.md` controls development workflow.

`AGENT_SKILLS.md` controls Agent Skill management.

Keep these responsibilities separate.

## Final Instruction

Before starting development:

```text
Read AGENTS.md
        ↓
Read AGENT_WORKFLOW.md
        ↓
Identify relevant skills
        ↓
Use the appropriate skills
        ↓
Implement
        ↓
Test
        ↓
Review
        ↓
Verify
```

Do not require the user to repeat these instructions in every request.

These project instructions are the default working rules for this repository.