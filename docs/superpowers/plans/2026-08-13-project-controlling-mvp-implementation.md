# Project Controlling MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

## Goal

Build the first usable Project Controlling MVP from the approved design in `docs/superpowers/specs/2026-08-13-project-controlling-design.md`.

The MVP will let Engineering Staff manually create and maintain Projects, JOs, one Die per JO, Parts, Components, process statuses, Problem notes, and status history. Supervisors will have read-only access to the dashboard and JO details.

The approved navigation is:

```text
Dashboard
   ↓
Project
   ↓
Daftar JO
   ↓
Detail JO
   └── Die
       ├── Part
       └── Komponen
```

OCR/import of GstarCAD images, dates, PICs, attachments, customer access, separate Finish/Delivery milestones, and Project-level aggregate progress are outside this plan.

## Current Repository Baseline

- `backend/` is a Laravel 13.8 starter application.
- Laravel currently has only the default web route; `backend/routes/api.php` does not exist.
- `backend/app/Models/User.php` is the only domain model.
- No Sanctum authentication is installed yet.
- The backend defaults to SQLite locally and in tests; PostgreSQL configuration already exists and remains the target runtime database.
- The backend has starter Vite/Tailwind assets, but no Next.js frontend exists.
- The frontend will be created as a separate `frontend/` Next.js application so it consumes Laravel through HTTP/REST and never connects to PostgreSQL directly.
- The workspace currently has no `.git` directory at the root or in `backend`; commit checkpoints below should be executed once repository metadata is available.

## Technical Decisions

### Backend

- Laravel remains responsible for validation, authorization, business rules, progress calculation, history creation, and database access.
- Use Laravel Sanctum with HTTP-only session cookies for the separate Next.js SPA. Do not store auth tokens in `localStorage`.
- Expose JSON REST endpoints under `/api`.
- Use PHP backed enums for user roles, control statuses, and process keys.
- Store one row per process control rather than a JSON status blob so Problems, history, and progress remain queryable.
- A `process_controls` row belongs to exactly one Part or one Component. Enforce this with nullable foreign keys plus a database check constraint.
- Use a database transaction and row lock when changing a control so the current value and history entry cannot diverge.
- Compute JO progress on the server; the frontend only renders the returned result.

### Frontend

- Use Next.js App Router, React, TypeScript, and Tailwind CSS.
- Use a small typed API client instead of duplicating fetch logic in pages.
- Keep authenticated pages behind a client/server auth guard appropriate to the chosen Sanctum cookie setup.
- Use a modern control-center layout: summary cards, progress bars, filters, status badges, compact application tables, drawers/modals, and responsive layouts. Do not reproduce the Excel grid.
- Keep supervisor controls read-only in the UI, but enforce the same restriction in Laravel.

### Status and Progress Contract

The only status values are:

| Stored value | Meaning | Progress weight |
|---|---|---:|
| `-` | Not applicable; excluded from denominator | excluded |
| `Not Started` | Required process has not started | 0.0 |
| `In Progress` | Process is underway | 0.5 |
| `Done` | Process is complete | 1.0 |
| `Problem` | Process has an active problem; notes required | 0.0 |

Part process keys:

```text
material, arrival, machining, hardening, grinding, wirecut, assembly
```

Component process keys:

```text
po, arrival
```

For a JO, progress is the sum of weights for all controls whose status is not `-`, divided by the count of those controls, multiplied by 100. If there are no applicable controls, return a null progress value and render `-` in the UI. `Qty` does not affect the result.

## File and Responsibility Map

### Backend files to create or modify

| Path | Responsibility |
|---|---|
| `backend/database/migrations/*_add_role_to_users_table.php` | Store `engineering` or `supervisor` role. |
| `backend/database/migrations/*_create_projects_table.php` | Project name and customer. |
| `backend/database/migrations/*_create_jos_table.php` | JO identity, product identity, and Project ownership. |
| `backend/database/migrations/*_create_dies_table.php` | One Die record per JO. |
| `backend/database/migrations/*_create_parts_table.php` | Part master data belonging to a Die. |
| `backend/database/migrations/*_create_components_table.php` | Component master data belonging to a Die. |
| `backend/database/migrations/*_create_process_controls_table.php` | Status and current notes for Part/Component processes. |
| `backend/database/migrations/*_create_status_histories_table.php` | Append-only status and notes audit trail. |
| `backend/app/Enums/UserRole.php` | Role values and role labels. |
| `backend/app/Enums/ControlStatus.php` | The five allowed status values and weights. |
| `backend/app/Enums/PartProcess.php` | The seven Part process keys and labels. |
| `backend/app/Enums/ComponentProcess.php` | The two Component process keys and labels. |
| `backend/app/Models/Project.php` | Project relationships and fillable/casts. |
| `backend/app/Models/Jo.php` | JO relationships and identity. |
| `backend/app/Models/Die.php` | One-to-one JO Die relationship. |
| `backend/app/Models/Part.php` | Part data and control relationship. |
| `backend/app/Models/Component.php` | Component data and control relationship. |
| `backend/app/Models/ProcessControl.php` | Current status, notes, subject relationships, and history. |
| `backend/app/Models/StatusHistory.php` | Immutable history record and changed-by relationship. |
| `backend/app/Models/User.php` | Role cast/helper and history relationship. |
| `backend/app/Services/JoProgressService.php` | Server-side progress and summary calculation. |
| `backend/app/Services/ProcessControlUpdater.php` | Transactional status update and history creation. |
| `backend/app/Http/Middleware/EnsureRole.php` | Engineering mutation guard. |
| `backend/app/Http/Controllers/Api/AuthController.php` | Login, logout, and current-user endpoints. |
| `backend/app/Http/Controllers/Api/DashboardController.php` | Dashboard summaries and Problem exceptions. |
| `backend/app/Http/Controllers/Api/ProjectController.php` | Project list, create, show, and update. |
| `backend/app/Http/Controllers/Api/JoController.php` | JO list, create, show, and update. |
| `backend/app/Http/Controllers/Api/DieController.php` | Die create/show/update for a JO. |
| `backend/app/Http/Controllers/Api/PartController.php` | Part create/update/delete. |
| `backend/app/Http/Controllers/Api/ComponentController.php` | Component create/update/delete. |
| `backend/app/Http/Controllers/Api/ProcessControlController.php` | Read and update process controls. |
| `backend/app/Http/Controllers/Api/StatusHistoryController.php` | Read history for a JO/control. |
| `backend/app/Http/Requests/Api/*` | Request validation for each write operation. |
| `backend/app/Http/Resources/Api/*` | Stable JSON response shapes and nested summaries. |
| `backend/routes/api.php` | REST route definitions and middleware. |
| `backend/bootstrap/app.php` | API routing and Sanctum stateful middleware configuration. |
| `backend/config/cors.php` | Restrict API credentials to configured frontend origins. |
| `backend/.env.example` | Document API/frontend URL and cookie/CORS configuration without secrets. |
| `backend/database/factories/*` | Factories for domain records and test fixtures. |
| `backend/database/seeders/DatabaseSeeder.php` | Safe local demo users and optional sample project data. |
| `backend/tests/Unit/Services/JoProgressServiceTest.php` | Exact progress rules and edge cases. |
| `backend/tests/Unit/Enums/*Test.php` | Status/process/role contract tests if needed. |
| `backend/tests/Feature/Api/AuthTest.php` | Authentication and session behavior. |
| `backend/tests/Feature/Api/AuthorizationTest.php` | Supervisor read-only and Engineering mutation rules. |
| `backend/tests/Feature/Api/ProjectAndJoTest.php` | Project/JO/Die ownership and CRUD. |
| `backend/tests/Feature/Api/ControlStatusTest.php` | Status validation, Problem notes, and history. |
| `backend/tests/Feature/Api/DashboardTest.php` | Dashboard summaries, Problem counts, and eager-loaded detail data. |

### Frontend files to create

| Path | Responsibility |
|---|---|
| `frontend/package.json` | Next.js, React, TypeScript, Tailwind, and test scripts. |
| `frontend/tsconfig.json` | Strict TypeScript configuration. |
| `frontend/next.config.*` | Next configuration and API/runtime settings. |
| `frontend/app/layout.tsx` | Global shell, metadata, and app providers. |
| `frontend/app/page.tsx` | Redirect authenticated users to Dashboard or unauthenticated users to Login. |
| `frontend/app/login/page.tsx` | Login form and error state. |
| `frontend/app/dashboard/page.tsx` | Project/JO overview and Problem exceptions. |
| `frontend/app/projects/[projectId]/page.tsx` | Project summary and grouped JO list. |
| `frontend/app/projects/[projectId]/jos/[joId]/page.tsx` | JO header, Die, Part, Component, and History sections. |
| `frontend/components/app-shell.tsx` | Navigation, user role display, and logout. |
| `frontend/components/project-card.tsx` | Project summary card. |
| `frontend/components/jo-card.tsx` | JO progress/problem summary card or list row. |
| `frontend/components/progress-bar.tsx` | Accessible progress display including null/`-` state. |
| `frontend/components/status-badge.tsx` | Semantic colors and labels for all statuses. |
| `frontend/components/status-select.tsx` | Status dropdown with disabled/read-only mode. |
| `frontend/components/problem-notes-dialog.tsx` | Required notes flow when selecting `Problem`. |
| `frontend/components/part-control-table.tsx` | Responsive Part data and seven process controls. |
| `frontend/components/component-control-table.tsx` | Component data and PO/Kedatangan controls. |
| `frontend/components/history-panel.tsx` | Timeline/drawer for status history and notes. |
| `frontend/components/empty-state.tsx` | Empty, loading, and error states. |
| `frontend/lib/api.ts` | Typed HTTP client with credentials and JSON error handling. |
| `frontend/lib/auth.ts` | Current-user/session helpers. |
| `frontend/lib/types.ts` | API/domain types. |
| `frontend/lib/status.ts` | UI labels, colors, and status option metadata. |
| `frontend/lib/format.ts` | Progress and date/number formatting helpers. |
| `frontend/tests/*` | Component and API-client tests for key interactions. |
| `frontend/.env.example` | Frontend API base URL and non-secret configuration. |

## API Contract

All endpoints return JSON. Validation failures use HTTP 422, unauthenticated requests use 401, and supervisor mutation attempts use 403. Resources should expose stable `data` objects and list metadata where pagination is used.

### Authentication

```text
GET  /sanctum/csrf-cookie
POST /api/login       { email, password }
POST /api/logout
GET  /api/me
```

The frontend API client must request the CSRF cookie before login and send credentials on every subsequent request. Login returns the authenticated user and role; the browser retains only the HTTP-only session cookie.

### Read endpoints

```text
GET /api/dashboard
GET /api/projects
GET /api/projects/{project}
GET /api/projects/{project}/jos
GET /api/jos/{jo}
GET /api/jos/{jo}/history
GET /api/process-controls/{processControl}/history
```

The JO detail response must include the single Die, its Parts and Components, each control, current progress, status counts, Problem count, and last activity. Controllers must eager-load these relationships to avoid N+1 queries.

### Engineering write endpoints

```text
POST  /api/projects
PATCH /api/projects/{project}
POST  /api/projects/{project}/jos
PATCH /api/jos/{jo}
POST  /api/jos/{jo}/die
PATCH /api/dies/{die}
POST  /api/dies/{die}/parts
PATCH /api/parts/{part}
DELETE /api/parts/{part}
POST  /api/dies/{die}/components
PATCH /api/components/{component}
DELETE /api/components/{component}
PATCH /api/process-controls/{processControl}
```

The control update payload is:

```json
{
  "status": "Problem",
  "notes": "Ukuran belum sesuai drawing dan perlu die repair."
}
```

The backend must reject `Problem` without non-empty notes, reject a Part process key on a Component control and vice versa, and reject any status not in the five-value enum.

## Data Model

Use explicit foreign keys and cascading deletes where a child cannot exist without its parent. Do not store progress as a database column.

### `users`

Add `role` as a string-backed enum with values `engineering` and `supervisor`. Existing users should receive the safe default `engineering` during migration; production user provisioning must still set the intended role explicitly.

### `projects`

- `id`
- `name`
- `customer`
- timestamps

### `jos`

- `id`
- `project_id` foreign key
- `jo_number` unique across the system
- `product_no` nullable
- `product_name`
- timestamps

### `dies`

- `id`
- `jo_id` unique foreign key, enforcing one Die per JO
- `code` nullable
- `name`
- timestamps

The `code`/`name` fields are intentionally minimal and manually entered; they can later be expanded if the real GstarCAD/drawing identifiers require it.

### `parts` and `components`

Both tables contain:

- `id`
- `die_id` foreign key
- `item_no` string, because AS-IS values include `2A`, `12B`, and numeric values
- `description`
- `dimension` nullable
- `material` nullable
- `qty` nullable integer
- `hrc` nullable string
- `sort_order` integer
- timestamps

### `process_controls`

- `id`
- nullable `part_id` foreign key
- nullable `component_id` foreign key
- `process_key`
- `status`, default `-`
- nullable `notes`
- timestamps
- unique `(part_id, process_key)` and unique `(component_id, process_key)`
- check constraint: exactly one of `part_id` and `component_id` is non-null

Create seven controls when a Part is created and two controls when a Component is created. All start as `-`, allowing Engineering to mark only the processes that are actually needed.

### `status_histories`

- `id`
- `process_control_id` foreign key
- nullable `previous_status`
- `new_status`
- nullable `notes_snapshot`
- `changed_by` foreign key to users
- `created_at`

Do not update or delete history rows through the application.

## Implementation Tasks

### Phase 0 — Baseline and application setup

1. Confirm the approved design file is present and unchanged before implementation.
2. Run the existing backend test suite from `backend/` and record the baseline result.
3. Install/publish Laravel Sanctum in the backend without committing secrets.
4. Add `routes/api.php` and register API routing in `bootstrap/app.php`.
5. Add frontend origin/API URL placeholders to `backend/.env.example` and `frontend/.env.example`.
6. Create the `frontend/` Next.js TypeScript/Tailwind application with strict type checking.
7. Add scripts for frontend development, type checking, tests, and production build.
8. Run backend tests and the initial frontend typecheck/build to verify the skeleton before domain work.

### Phase 1 — Database schema and domain model

1. Write migration tests or schema-focused feature tests for Project → JO → Die ownership.
2. Create the users role migration and `UserRole` enum/cast.
3. Create Projects, JOs, and Dies migrations with foreign keys and the one-Die-per-JO unique constraint.
4. Create Parts and Components migrations with the AS-IS fields and stable ordering fields.
5. Create the process controls migration with nullable foreign keys, uniqueness, and the exactly-one-subject check constraint.
6. Create the append-only status histories migration.
7. Create model factories for every domain entity and role-specific users.
8. Add model relationships, casts, fillable definitions, and query scopes.
9. Run migrations against the test SQLite database and the configured PostgreSQL database when available.
10. Run the model relationship tests before continuing.

### Phase 2 — Status enums, control creation, and progress rules

1. Write failing unit tests for the five `ControlStatus` values and their weights.
2. Implement `ControlStatus`, `PartProcess`, and `ComponentProcess` enums with API labels.
3. Write failing tests that a new Part creates exactly seven default `-` controls.
4. Write failing tests that a new Component creates exactly two default `-` controls.
5. Implement the control creation service used by Part and Component creation.
6. Write failing progress tests for Done, In Progress, Not Started, Problem, and `-` combinations.
7. Add edge-case tests for all controls being `-` and for Parts plus Components contributing to the same JO.
8. Implement `JoProgressService` with denominator exclusion for `-` and null progress for zero applicable controls.
9. Add tests for the returned Problem count and status counts.
10. Run the focused unit suite and then the full backend suite.

### Phase 3 — Authentication and authorization

1. Write failing feature tests for login success, invalid credentials, logout, and `/api/me`.
2. Configure Sanctum stateful API middleware, session cookies, CSRF, and restricted CORS.
3. Implement `AuthController` and the authentication routes.
4. Write failing tests that unauthenticated API requests return JSON 401.
5. Implement `EnsureRole` and role helpers on `User`.
6. Write failing tests that Engineering can mutate and Supervisor receives 403 for mutations.
7. Apply read authentication to all dashboard/detail routes and Engineering authorization to all write routes.
8. Run the authentication and authorization feature tests.

### Phase 4 — REST API and validation

1. Write failing feature tests for creating/updating Projects and enforcing required fields.
2. Implement Project requests, resource, controller, and routes.
3. Write failing feature tests for creating/updating JOs and rejecting a JO reassignment that violates ownership.
4. Implement JO requests, resource, controller, and nested Project routes.
5. Write failing tests that a JO can have only one Die.
6. Implement Die requests, resource, controller, and one-to-one creation/update route.
7. Write failing tests for Part and Component input validation, including string `item_no` values such as `2A` and nullable `hrc`.
8. Implement Part and Component requests, resources, controllers, and control seeding.
9. Write failing tests for invalid process/status combinations and duplicate control rows.
10. Implement `ProcessControlUpdater` with transaction, lock, current-row update, and history insert.
11. Write failing tests that Problem requires notes and that changing notes without changing status still creates history.
12. Implement ProcessControl and StatusHistory controllers/resources.
13. Add JO detail and history responses with eager loading and progress summary.
14. Add the Dashboard endpoint with Project/JO summaries and Problem exceptions.
15. Run the complete API feature suite and inspect JSON responses for stable shape.

### Phase 5 — Seed data and API documentation

1. Add factory states for a complete JO with Parts, Components, controls, and mixed statuses.
2. Update `DatabaseSeeder` with clearly labeled local demo Engineering and Supervisor users.
3. Add a small sample Project with at least two JOs and one Problem for local UI verification.
4. Document local API/frontend URLs and demo credentials in a developer-only project note that is not production secret material.
5. Verify seeded data through read-only API requests and rerun the backend tests.

### Phase 6 — Frontend foundation and authentication UI

1. Create the shared TypeScript API/domain types matching the Laravel resources.
2. Implement the credentialed API client with CSRF initialization, JSON parsing, and typed 401/403/422 errors.
3. Implement session/current-user helpers and loading/error states.
4. Build the Login page with accessible labels, validation, submit state, and error feedback.
5. Build the shared App Shell with navigation, active route, role label, and logout action.
6. Add route handling for unauthenticated and authenticated states.
7. Add frontend tests for login success/error rendering, logout, and supervisor read-only capability flags.
8. Run frontend tests, typecheck, and build.

### Phase 7 — Dashboard and Project/JO navigation

1. Write component tests for progress cards, Problem counts, empty states, and loading states.
2. Build reusable ProgressBar, StatusBadge, JoCard, ProjectCard, and EmptyState components.
3. Build the Dashboard page using the dashboard API response.
4. Add Problem-focused filtering and clear visual distinction for affected JOs.
5. Build the Project page with customer information and grouped JO list.
6. Make grouping by product display-only; do not add a new product aggregate entity to the MVP.
7. Add responsive behavior for narrow screens and keyboard-visible focus states.
8. Run frontend component tests and production build.

### Phase 8 — JO detail control center

1. Write component tests for the Part control table and Component control table.
2. Build the JO detail header with JO, product, Die, progress, and Problem summary.
3. Build the Part table with identity columns, seven labeled process controls, filters, and status badges.
4. Build the Component table with only PO and Kedatangan controls.
5. Implement StatusSelect with exactly five options: `-`, `Not Started`, `In Progress`, `Done`, and `Problem`.
6. Implement the Problem notes dialog and block submission when notes are empty.
7. Connect status updates to `PATCH /api/process-controls/{id}` and update affected summary data after success.
8. Disable all mutation controls for Supervisor while still rendering current values and notes.
9. Add loading, optimistic/pending, validation, authorization, and network error states.
10. Run frontend component tests and a local authenticated browser smoke test for Engineering and Supervisor flows.

### Phase 9 — History and final UX hardening

1. Write component tests for history ordering and current/previous status labels.
2. Build the History panel/timeline for a JO and individual control.
3. Display Problem notes and history without exposing implementation/database details.
4. Add accessible dialog behavior, keyboard navigation, focus management, and responsive table fallback.
5. Check status colors for contrast and do not rely on color alone; render text labels and icons where useful.
6. Review all empty, loading, error, and zero-applicable-control states.
7. Run frontend tests, typecheck, and production build.

### Phase 10 — Integration verification and handoff

1. Run the full Laravel test suite with the test-only SQLite configuration.
2. Run migrations and seed data against a PostgreSQL development database when available.
3. Start Laravel and Next.js locally and verify the complete path Dashboard → Project → Daftar JO → Detail JO.
4. Verify Engineering can create/edit all MVP entities and update controls.
5. Verify Supervisor can view the same data but receives server-side 403 for every mutation route.
6. Verify Problem notes are mandatory and every status/note change appears in history.
7. Verify progress with a hand-calculated fixture containing all five statuses and excluded `-` controls.
8. Verify no frontend code imports database/configuration internals and no secrets are committed.
9. Review the final diff against the approved design and this plan.
10. Record only commands that actually passed in the handoff report.

## Verification Commands

Run from `backend/`:

```powershell
composer test --no-interaction
php artisan migrate:fresh --env=testing --force
php artisan route:list --path=api
```

Run from `frontend/`:

```powershell
npm run test
npm run typecheck
npm run build
```

For integration verification, start the backend and frontend with the project-approved local commands, then exercise the authenticated flows using the seeded local accounts. Do not run destructive migrations against a production database.

## Completion Criteria

- The approved data hierarchy is represented in PostgreSQL-compatible Laravel migrations.
- A JO has exactly one Die; a Project can have many JOs; Parts and Components belong to that Die.
- Part controls expose seven processes, Component controls expose only PO and Kedatangan.
- The five statuses and their progress weights are enforced server-side.
- `-` is excluded from the progress denominator and a JO with no applicable controls renders `-`.
- Problem requires notes and every status/notes change creates immutable history.
- Engineering can mutate through the UI and API; Supervisor is read-only through both layers.
- Dashboard, Project, JO list, and JO detail follow the approved navigation and modern UI direction.
- Backend tests, frontend tests, typecheck, build, and relevant integration checks have actually run successfully before claiming completion.
- OCR/GstarCAD import remains unimplemented and clearly outside the MVP boundary.

