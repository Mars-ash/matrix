# AGENT_WORKFLOW.md

## Purpose

Define how AI coding agents should work on this project after the required Agent Skills have been installed.

Project stack:

```text
Next.js + React + Tailwind CSS
          │
          │ REST API
          ▼
Laravel + PHP
          │
          │ Eloquent
          ▼
PostgreSQL

Deployment:
Docker + CI/CD
```

This file describes skill usage and development workflow.

Skill installation and maintenance belong in:

```text
AGENT_SKILLS.md
```

---

# 1. General Development Principle

Do not immediately start writing code.

For non-trivial work:

```text
Understand
   ↓
Plan
   ↓
Implement
   ↓
Test
   ↓
Review
   ↓
Verify
```

Use the smallest relevant set of installed skills.

Do not invoke every skill for every task.

---

# 2. Skill Selection

## Laravel Backend

Prefer:

```text
Laravel Boost
```

Use additional Laravel best-practice skills only when useful.

---

## Next.js / React

Use:

```tex
React/Next.js best practices
```

---

## UI/UX

Use:

```text
frontend-design
web-design-guidelines
```

---

## Planning

Use:

```text
brainstorming
writing-plans
```

---

## Debugging

Use:

```text
systematic-debugging
```

---

## Testing

Use:

```text
test-driven-development
```

plus the project's existing testing framework.

---

## Code Review

Use:

```text
requesting-code-review
```

and `code-reviewer` when installed and appropriate.

---

## API

Use:

```text
api-tester
```

when installed.

---

## Docker

Use:

```text
docker-helper
```

when installed.

---

## CI/CD

Use:

```text
cicd-pipeline
```

when installed.

---

## OCR Lab / Python

Use:

```text
python-testing-patterns
python-performance-optimization
python-packaging
fastapi
```

when developing, testing, profiling, packaging, or serving the local OCR Lab.

---

## E2E Testing

Use:

```text
playwright-best-practices
```

when developing and maintaining browser-level end-to-end integration tests.

---

# 3. New Feature Workflow

For a non-trivial feature:

```text
1. Understand requirements
2. Identify affected systems
3. Plan architecture
4. Define API contract
5. Implement Laravel backend
6. Test backend
7. Implement Next.js frontend
8. Test frontend/integration
9. Review
10. Verify
```

Use:

```text
brainstorming
writing-plans
```

before implementation when the feature has meaningful architectural decisions.

---

# 4. Full-Stack Feature

For a feature involving both Laravel and Next.js:

```text
Requirement
    ↓
Architecture
    ↓
API contract
    ↓
Laravel
    ↓
API tests
    ↓
Next.js
    ↓
Integration tests
    ↓
Code review
    ↓
Verification
```

Do not duplicate business logic unnecessarily between frontend and backend.

Laravel remains responsible for:

- validation
- authorization
- business rules
- database operations
- sensitive operations

Next.js remains responsible for:

- presentation
- client interaction
- UI state
- consuming backend APIs

---

# 5. Laravel Workflow

For backend changes:

1. Inspect existing Laravel conventions.
2. Use Laravel-native solutions.
3. Check routes.
4. Check models/relationships.
5. Check migrations.
6. Check Form Requests.
7. Check Resources.
8. Check Policies/Middleware.
9. Implement.
10. Test.
11. Review.
12. Verify.

Prefer:

```text
Controllers
Form Requests
Resources
Policies
Middleware
Eloquent
Migrations
Factories
Seeders
Jobs
Events
Services/Actions when justified
```

Avoid unnecessary abstractions.

---

# 6. PostgreSQL Workflow

For database changes:

```text
Requirement
    ↓
Schema design
    ↓
Migration
    ↓
Indexes / constraints
    ↓
Model / relationship
    ↓
Tests
    ↓
Verification
```

Consider:

- indexes
- foreign keys
- constraints
- transactions
- query performance
- N+1 queries
- eager loading
- pagination

Never perform destructive production database changes without explicit authorization.

---

# 7. API Workflow

For a new API endpoint:

```text
API contract
    ↓
Route
    ↓
Controller
    ↓
Validation
    ↓
Authorization
    ↓
Business logic
    ↓
Resource / response
    ↓
API tests
```

Test:

- success
- validation errors
- authentication failures
- authorization failures
- edge cases
- response format
- database effects

---

# 8. Authentication Workflow

Before changing authentication:

1. inspect the existing authentication system,
2. identify Sanctum/session/token/OAuth usage,
3. inspect frontend/backend communication,
4. preserve the existing architecture unless there is a reason to change it,
5. test authentication and authorization flows.

Test:

```text
Login
Logout
Session/token expiration
Unauthorized access
Forbidden access
Protected routes
```

Never expose secrets in Next.js client code.

---

# 9. Next.js Workflow

For frontend changes:

1. inspect existing component architecture,
2. identify Server/Client Component boundaries,
3. inspect data fetching,
4. implement UI,
5. check responsive behavior,
6. check accessibility,
7. test,
8. review,
9. verify.

Do not make everything a Client Component without justification.

---

# 10. UI/UX Workflow

For UI work:

```text
Requirements
    ↓
frontend-design
    ↓
Implementation
    ↓
web-design-guidelines
    ↓
Accessibility check
    ↓
Responsive check
    ↓
Verification
```

Check:

- typography
- spacing
- visual hierarchy
- responsive layout
- empty states
- loading states
- error states
- forms
- focus states
- keyboard navigation
- semantic HTML
- accessibility

Avoid generic AI-generated layouts when a more intentional design is appropriate.

---

# 11. OCR Lab / Python Workflow

For changes in `ocr-lab/`:

1. Target the approved Python 3.11 virtual environment (`ocr-lab/.venv/`). Do not use system Python 3.14.
2. Adhere strictly to the gated private benchmark requirements; never commit private images, ground-truth data, or model caches.
3. Apply `python-testing-patterns` for pytest architecture, synthetic image test fixtures, and deterministic unit/pipeline test design.
4. Apply `python-performance-optimization` when analyzing image preprocessing, deskewing, line detection, or CPU model inference latency.
5. Apply `python-packaging` when configuring `pyproject.toml`, console scripts (`bom-ocr`), or optional dependency groups (e.g. `service`, `dev`).
6. Apply `fastapi` when developing or updating the internal HTTP service facade (`bom_ocr.service`), ensuring typed Pydantic contracts and proper error handling.
7. Maintain strict privacy and review-only semantics: extraction failures produce warnings and empty row lists, never invented or hallucinated rows.

---

# 12. Debugging Workflow

When something breaks, do not immediately change random code.

Use:

```text
Reproduce
   ↓
Collect evidence
   ↓
Identify root cause
   ↓
Form hypothesis
   ↓
Test hypothesis
   ↓
Implement minimal fix
   ↓
Run tests
   ↓
Verify
```

Use:

```text
systematic-debugging
```

when available.

Do not hide errors merely to make tests pass.

---

# 13. Testing Workflow

For new behavior:

```text
Define expected behavior
       ↓
Write/update test
       ↓
Implement
       ↓
Run test
       ↓
Refactor
       ↓
Run full relevant suite
```

Do not declare a feature complete solely because the happy path works.

For full-stack features, test both:

```text
Laravel API
+
Next.js integration
```

---

# 14. Code Review Workflow

Before declaring meaningful work complete:

1. inspect the diff,
2. run relevant tests,
3. check security,
4. check architecture,
5. check unnecessary complexity,
6. check error handling,
7. check API contracts,
8. check frontend/backend boundaries.

Use:

```text
requesting-code-review
```

when available.

---

# 15. Docker Workflow

Before changing Docker:

1. inspect existing Dockerfiles,
2. inspect compose configuration,
3. identify services,
4. identify environment variables,
5. preserve existing networking,
6. build/test locally,
7. verify health checks.

Never put secrets into:

```text
Dockerfile
docker-compose.yml
Git
container images
```

unless explicitly designed as non-secret configuration.

---

# 16. CI/CD Workflow

A healthy pipeline should generally perform:

```text
Install
  ↓
Lint
  ↓
Backend tests
  ↓
Frontend tests
  ↓
Build
  ↓
Security checks
  ↓
Docker build
  ↓
Deploy
```

Adapt this to the project's actual CI/CD provider.

Do not assume a hosting provider without project evidence.

---

# 17. Security Workflow

For backend/API/security-sensitive work, check:

- authentication
- authorization
- validation
- mass assignment
- CSRF where applicable
- SQL injection
- XSS
- rate limiting
- file upload validation
- secret handling
- error information leakage
- CORS
- API exposure

For frontend:

- XSS risks
- unsafe HTML rendering
- client-side secrets
- insecure token handling
- sensitive data exposure

---

# 18. Completion Criteria

Do not say a task is complete until appropriate verification has happened.

Minimum:

```text
Code implemented
    ↓
Relevant tests pass
    ↓
No obvious errors
    ↓
Diff reviewed
    ↓
Security considered
    ↓
Final verification
```

Use:

```text
verification-before-completion
```

when available.

Never claim tests/build/deployment succeeded if they were not actually run.

---

# 19. Final Development Principle

Prefer:

```text
Simple
Correct
Tested
Secure
Maintainable
```

over:

```text
Complex
Over-engineered
Untested
Fast-but-fragile
```

Use Agent Skills as specialized expertise, not as a reason to introduce unnecessary complexity.
