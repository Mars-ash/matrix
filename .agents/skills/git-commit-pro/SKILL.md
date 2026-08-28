---
name: git-commit-pro
description: >-
  Write well-structured git commit messages following the Conventional Commits
  standard. Use when a user asks to commit changes, write a commit message,
  stage and commit, improve a commit message, or follow commit conventions.
  Analyzes diffs to produce accurate, meaningful commit messages.
license: Apache-2.0
compatibility: "Requires git installed"
metadata:
  author: terminal-skills
  version: "1.0.0"
  category: development
  tags: ["git", "commits", "conventional-commits", "version-control"]
---

# Git Commit Pro

## Overview

Generate well-structured git commit messages by analyzing staged changes. Follows Conventional Commits format and produces messages that explain what changed and why.

## Instructions

When a user asks you to commit, write a commit message, or improve an existing commit message, follow these steps:

### Step 1: Inspect the changes

```bash
# See what is staged
git diff --cached --stat

# See full staged diff
git diff --cached

# See unstaged changes (in case user wants to stage first)
git status
```

If nothing is staged, help the user stage the right files first. Never use `git add .` unless the user explicitly asks -- prefer adding specific files.

### Step 2: Analyze the diff

Categorize what changed:
- **New files**: What functionality do they add?
- **Modified files**: What behavior changed? Why?
- **Deleted files**: What was removed and why?
- **Renamed/moved files**: What restructuring happened?

Look at the actual code changes, not just file names. Understand the intent behind the changes.

### Step 3: Write the commit message

Use Conventional Commits format:

```
type(scope): short description

Longer explanation of what changed and why. Wrap at 72 characters.
Reference any issues or tickets.

Co-Authored-By: if applicable
```

**Types:**
- `feat`: New feature or capability
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, semicolons, whitespace (no logic change)
- `refactor`: Code restructuring without behavior change
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Maintenance tasks, tooling updates

**Rules for the subject line:**
- Use imperative mood ("add" not "added" or "adds")
- Do not capitalize the first word
