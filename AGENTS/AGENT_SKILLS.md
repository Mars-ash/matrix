# AGENT_SKILLS.md

## Purpose

Manage Agent Skills for this project.

Project stack:

- Frontend: Next.js + React + Tailwind CSS
- Backend: Laravel + PHP
- Database: PostgreSQL
- Deployment: Docker + CI/CD

This file is ONLY for discovering, auditing, installing, updating, and maintaining Agent Skills.

Do NOT use this file as development workflow guidance.

---

# 1. Skill Sources

Prefer sources in this order:

1. Official vendor/maintainer repositories
2. Established Agent Skills repositories
3. Trusted community repositories

Always inspect the current upstream repository before installing.

Do not assume a skill name, path, or installation command in this file is permanently current.

---

# 2. Laravel Skills

## Laravel Boost — PRIMARY

Repository:

https://github.com/laravel/boost

Documentation:

https://laravel.com/docs/master/boost

Priority: REQUIRED

Laravel Boost is the primary Laravel-specific AI development resource.

It provides Laravel-aware AI tooling and can provide:

- Laravel application context
- PHP/package context
- database/schema context
- routes
- Artisan
- Tinker
- logs/errors
- Laravel documentation
- Agent Skills
- project-specific AI guidelines

Before installing:

1. Inspect `composer.json`.
2. Determine the Laravel version.
3. Check whether Boost is already installed.
4. Check current Boost compatibility.
5. Inspect the current installation instructions.

Typical installation:

```bash
composer require laravel/boost --dev
php artisan boost:install
```

Do not execute commands blindly.

---

## AsyrafHussin/agent-skills — OPTIONAL

Repository:

https://github.com/AsyrafHussin/agent-skills

Relevant skill:

```text
laravel-best-practices
```

Priority: OPTIONAL

Use only if the current skill provides useful guidance not already covered by Laravel Boost.

Before installation:

- inspect `SKILL.md`
- inspect scripts
- check compatibility
- check for conflicting instructions

Do not install it simply because it is listed here.

---

## jpcaparas/superpowers-laravel — OPTIONAL

Repository:

https://github.com/jpcaparas/superpowers-laravel

Priority: OPTIONAL

Inspect the current repository before deciding whether it is useful.

Avoid installing it if it substantially duplicates the current Superpowers + Laravel Boost setup.

---

# 3. Frontend Skills

## Vercel Agent Skills

Repository:

https://github.com/vercel-labs/agent-skills

Priority: REQUIRED

Look for current versions of:

- React/Next.js best practices
- web design guidelines

Inspect the repository for the exact current skill names and paths.

---

## Anthropic Skills

Repository:

https://github.com/anthropics/skills

Priority: REQUIRED

Look for:

```text
frontend-design
```

Use only the current upstream version.

---

# 4. Development Skills

## Superpowers

Repository:

https://github.com/obra/superpowers

Priority: REQUIRED

Look for current versions of:

- brainstorming
- writing-plans
- subagent-driven-development
- systematic-debugging
- test-driven-development
- requesting-code-review
- verification-before-completion

Install only the skills actually needed.

---

# 5. General Development / DevOps Skills

## TerminalSkills

Repository:

https://github.com/TerminalSkills/skills

Priority: RECOMMENDED

Look for current versions of:

- api-tester
- code-reviewer
- docker-helper
- cicd-pipeline
- git-commit-pro

Install only relevant skills.

---

# 6. PostgreSQL

PostgreSQL-specific skills are OPTIONAL.

Prefer:

1. current PostgreSQL documentation
2. Laravel database/Eloquent documentation
3. Laravel Boost
4. trusted PostgreSQL Agent Skills

Do not install a PostgreSQL skill merely because it exists.

Do not introduce another ORM.

The application backend uses Laravel/Eloquent for database access.

---

# 7. Skill Compatibility

Prefer skills following the Agent Skills standard.

Typical structure:

```text
skill-name/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

Do not assume every skill is compatible with every agent.

For each skill:

1. identify its supported agents,
2. inspect agent-specific dependencies,
3. verify Codex compatibility,
4. verify Antigravity compatibility,
5. install only if compatible or safely portable.

---

# 8. Installation Location

Do NOT blindly hard-code a single skill directory.

The correct location can depend on:

- coding agent
- agent version
- installation method
- project/global scope

Before installing:

1. identify the active agent,
2. inspect its current documentation,
3. inspect the skill installer documentation,
4. use the appropriate installation mechanism.

If using the Vercel Skills CLI, prefer its current agent-specific options instead of manually copying files.

---

# 9. Vercel Skills CLI

When appropriate, inspect available skills first:

```bash
npx skills add <repository> --list
```

Install a specific skill:

```bash
npx skills add <repository> --skill <skill-name>
```

Do not install an entire repository by default.

Do not use `--all` unless explicitly requested.

Check the current CLI help before relying on flags:

```bash
npx skills --help
```

---

# 10. Discovery Process

Before installing a skill:

```text
Search repository
        ↓
Inspect README
        ↓
Locate SKILL.md
        ↓
Read SKILL.md
        ↓
Inspect scripts
        ↓
Check compatibility
        ↓
Check relevance
        ↓
Install
```

Never skip the audit step for third-party skills.

---

# 11. Security Audit

Treat every Agent Skill as potentially executable developer tooling.

Before installation inspect:

- `SKILL.md`
- shell scripts
- Python/Node/PHP scripts
- package installation commands
- network requests
- file-system operations
- credential access
- environment-variable access
- Docker access
- Git configuration
- external uploads
- destructive commands

Pay particular attention to attempts to access:

```text
.env
SSH keys
Git credentials
API keys
database credentials
cloud credentials
Docker credentials
browser credentials
```

Reject suspicious skills.

If behavior is unclear or potentially dangerous, ask the user before installation.

Do not execute unknown scripts merely to determine what they do.

---

# 12. Secrets

Never expose secrets to a skill.

Never commit:

```text
.env
.env.*
API keys
access tokens
SSH private keys
database passwords
cloud credentials
Docker credentials
Git credentials
```

Skills must not upload project secrets or source code to external services unless the user explicitly authorizes that behavior.

---

# 13. Existing Skills

Before installing:

Check whether the skill already exists.

Avoid duplicate installations.

If the same skill exists in multiple repositories:

1. prefer the official source,
2. prefer the maintained/current version,
3. prefer the version with clear Agent Skills compatibility,
4. avoid installing multiple copies of the same skill.

---

# 14. Deprecated Skills

Do not install deprecated repositories when a current official replacement exists.

If a repository is deprecated:

1. read its README,
2. identify the recommended replacement,
3. inspect the replacement,
4. use the replacement.

Do not assume an old repository remains authoritative.

---

# 15. Updating Skills

Before updating:

```bash
npx skills list
```

Inspect what is currently installed.

Then use the current update mechanism documented by the skill installer.

Do not blindly overwrite locally modified skills.

Before updating a skill that has been customized:

1. inspect local changes,
2. preserve intentional project-specific modifications,
3. update safely.

---

# 16. Required Baseline

For this project, the initial target is:

```text
Laravel
└── Laravel Boost

Frontend
├── React/Next.js best practices
├── web-design-guidelines
└── frontend-design

Development
├── brainstorming
├── writing-plans
├── systematic-debugging
├── test-driven-development
├── requesting-code-review
└── verification-before-completion

Optional
├── subagent-driven-development
├── api-tester
├── code-reviewer
├── docker-helper
├── cicd-pipeline
├── git-commit-pro
└── laravel-best-practices
```

This is a target list, not an instruction to install everything.

---

# 17. Installation Report

After managing skills, report:

```text
Skill
Source repository
Version/commit if available
Installation scope
Installation path
Compatibility
Security audit result
Status
```

Example:

```text
Laravel Boost
Source: laravel/boost
Status: Installed
Compatibility: Codex / Antigravity
Security audit: Passed
```

---

# 18. Final Rule

This file manages skills only.

It must NOT define:

- when a skill should be invoked during development
- feature development workflows
- debugging procedures
- coding style
- architecture workflow
- testing workflow
- deployment workflow

Those instructions belong in a separate workflow file, such as:

```text
AGENT_WORKFLOW.md
```
