---
name: code-reviewer
description: >-
  Perform thorough code reviews with actionable, prioritized feedback. Use when
  a user asks to review code, check code quality, find bugs, review a pull
  request, audit code for issues, or get feedback on implementation. Covers
  correctness, security, performance, readability, and best practices across
  languages.
license: Apache-2.0
compatibility: "Works with any programming language"
metadata:
  author: terminal-skills
  version: "1.0.0"
  category: development
  tags: ["code-review", "quality", "bugs", "security", "best-practices"]
---

# Code Reviewer

## Overview

Perform structured code reviews that identify bugs, security issues, performance problems, and maintainability concerns. Provides prioritized, actionable feedback with specific fix suggestions.

## Instructions

When a user asks you to review code, a file, a diff, or a pull request, follow this process:

### Step 1: Understand the context

Before reviewing, determine:
- What does this code do? (feature, bugfix, refactor)
- What language and framework is it using?
- Are there tests included?
- Is this a full file or a diff/patch?

Read surrounding files if needed to understand the broader codebase context.

### Step 2: Review using this checklist

Evaluate the code against each category in order of severity:

**Correctness (Critical)**
- Logic errors, off-by-one mistakes, wrong conditions
- Unhandled null/undefined/empty cases
- Race conditions or concurrency issues
- Incorrect error handling (swallowed exceptions, wrong error types)
- Missing input validation

**Security (Critical)**
- SQL injection, XSS, command injection
- Hardcoded secrets, API keys, passwords
- Improper authentication/authorization checks
- Unsafe deserialization, path traversal
- Missing rate limiting on public endpoints

**Performance (High)**
- N+1 queries in database loops
- Unnecessary re-renders in UI components
- Missing indexes for frequent queries
- Unbounded memory growth (loading entire datasets)
- Blocking operations on the main thread
