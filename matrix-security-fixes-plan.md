# MATRIX — Auth & Config Fix Plan (for the executing agent)

You are fixing four verified issues in the MATRIX monorepo. This document is your full brief. Follow it literally. Where it says "stop and report", do that instead of improvising.

## Ground rules

1. **Scope.** Change only what a step names. No refactors, renames, formatting sweeps, dependency changes, or "while I'm here" cleanups.
2. **Do not touch** `backend/database/seeders/*` (seeded logins are used by the e2e tests), any migration, or `backend/app/Services/OcrService.php`.
3. **Read before editing.** Open every file a step names and confirm the "current code" matches what is described. If it does not match, stop and report the difference.
4. **Run the checks** listed at the end of each fix. Report only what you actually ran and what it actually printed. If you could not run something (no database, no Docker, no running server), say so explicitly. Never write "tests pass" without running them.
5. **Commits** (only if the directory is a git repo): one commit per fix group, in the order below.
6. **Nothing here has been executed yet.** The facts below come from reading the source. Anything marked *Assumption* must be verified by you.

## Repo layout (only the parts you need)

```
backend/   Laravel (PHP 8.3), PostgreSQL, Sanctum tokens
  routes/api.php
  bootstrap/app.php
  app/Http/Middleware/{AuthenticateTokenOrDemo,EnsureControllerRole}.php
  app/Http/Controllers/Api/OcrController.php
  app/Providers/AppServiceProvider.php
  tests/Feature/{AuthTest,OcrTest,ApiTest}.php
frontend/  Next.js 16 (App Router), React 19, TypeScript, Vitest, Playwright
  lib/{auth.tsx, api-client.ts, store.tsx}
  app/providers.tsx          (AuthProvider wraps StoreProvider)
docker/, docker-compose.yml
scripts/testing/             (perf scripts that use the demo token)
```

Backend test command: `cd backend && php artisan test`
Frontend commands: `cd frontend && npm run typecheck && npm run lint && npm test`

## Execution order

| Order | Fix | Why this order |
|---|---|---|
| 1 | Fix 1: remove demo tokens (backend) | Root cause. Everything else builds on real auth being the only auth. |
| 2 | Fix 3: protect the OCR extract route (backend) | Same files as Fix 1 (`routes/api.php`), so do it right after. |
| 3 | Fixes 2 and 4 together (frontend, plus Docker) | Both edit `auth.tsx` and `api-client.ts` and share new helper files. Doing them separately causes conflicts. |

**Deployment note for the human:** ship backend and frontend together. After Fix 1, any browser still holding an old bundle will get 401s, and users must log in again.

---

# Fix 1 — Demo tokens bypass authentication (backend)

## Problem

`AuthenticateTokenOrDemo` accepts the bearer strings `demo-prototype-token`, `demo-controller-token`, `demo-viewer-token` and authenticates them as the first user with role `controller` or `viewer`. There is no environment check, so this works in production. Anyone who knows the string is a controller.

## Decision

Use Laravel's built-in `auth:sanctum` middleware and delete the custom class. This is safe because `/auth/me` and `/auth/logout` in the same routes file already use `auth:sanctum`, and `bootstrap/app.php` already forces JSON responses for `api/*`, so an unauthenticated call returns the same `401 {"message":"Unauthenticated."}` as before. `EnsureControllerRole` uses `$request->user()`, which `auth:sanctum` populates.

## Changes

### 1a. `backend/routes/api.php`

Find:

```php
Route::middleware('auth.token')->group(function () {
```

Replace with:

```php
Route::middleware('auth:sanctum')->group(function () {
```

That is the only change to this group's line. Do not touch the routes inside it (Fix 3 handles one route separately).

### 1b. `backend/bootstrap/app.php`

In the `$middleware->alias([...])` array, delete this one line:

```php
'auth.token' => \App\Http\Middleware\AuthenticateTokenOrDemo::class,
```

Keep the `'role.controller' => ...` line exactly as it is.

### 1c. Delete the class

Delete `backend/app/Http/Middleware/AuthenticateTokenOrDemo.php`.

### 1d. Confirm nothing else references it

Run:

```bash
grep -rn "auth\.token\|AuthenticateTokenOrDemo" backend --include=*.php | grep -v vendor
```

Expected: no output. If anything shows up, stop and report it.

### 1e. Tests: add to `backend/tests/Feature/AuthTest.php`

Add these three methods inside the existing `AuthTest` class. Use the imports the file already has (`User`, `Hash`, `RefreshDatabase`).

```php
public function test_demo_tokens_are_rejected(): void
{
    User::create([
        'name' => 'Controller',
        'email' => 'ctl@test.com',
        'password' => Hash::make('secret'),
        'role' => 'controller',
    ]);
    User::create([
        'name' => 'Viewer',
        'email' => 'vwr@test.com',
        'password' => Hash::make('secret'),
        'role' => 'viewer',
    ]);

    foreach (['demo-prototype-token', 'demo-controller-token', 'demo-viewer-token'] as $token) {
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/projects')
            ->assertStatus(401);
    }
}

public function test_request_without_token_is_rejected(): void
{
    $this->getJson('/api/projects')->assertStatus(401);
}

public function test_real_sanctum_token_is_accepted(): void
{
    $user = User::create([
        'name' => 'Controller',
        'email' => 'real@test.com',
        'password' => Hash::make('secret'),
        'role' => 'controller',
    ]);
    $token = $user->createToken('test')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/projects')
        ->assertStatus(200);
}
```

### 1f. Update the two perf scripts that use the demo token

Files: `scripts/testing/run-performance-audit.php` (line ~47) and `scripts/testing/run-performance-benchmark.php` (line ~43, default argument of `measureRequest`).

Read each script first. Make the smallest change that removes the hardcoded demo string:

- Read a real token from the environment variable `MATRIX_PERF_TOKEN`.
- If it is missing or empty, print `Set MATRIX_PERF_TOKEN to a valid Sanctum token (php artisan tinker: User::where('role','controller')->first()->createToken('perf')->plainTextToken)` and exit with a non-zero status.
- Add a one-line comment at the top of each script naming the variable.

Do not change anything else in those scripts.

## Verify Fix 1

```bash
cd backend && php artisan test
grep -rn "demo-prototype-token\|demo-controller-token\|demo-viewer-token" backend scripts --include=*.php | grep -v vendor
```

Expected from the grep: hits **only** in `backend/tests/Feature/AuthTest.php` (the new negative test). Anything else means a step was missed.

If a server is running, also confirm manually:

```bash
curl -i -H "Authorization: Bearer demo-controller-token" http://localhost:8000/api/projects   # expect 401
curl -i http://localhost:8000/api/projects                                                   # expect 401
```

## Done when

- All existing backend tests still pass, plus the three new ones.
- The three demo strings appear nowhere in `backend/app`, `backend/routes`, `backend/bootstrap`, or `scripts`.

---

# Fix 3 — `POST /api/ocr/extract` is unauthenticated (backend)

## Problem

In `routes/api.php`, this route is registered outside every auth group:

```php
// OCR Vision AI Standalone Extraction
Route::post('/ocr/extract', [\App\Http\Controllers\Api\OcrController::class, 'extract']);
```

Anyone on the internet can upload up to 30 MB per call, and each call can spend Gemini quota. The frontend does **not** call this route (it only calls `/categories/{id}/ocr-upload`, which is already inside the controller-only group), so protecting it cannot break the UI.

## Decision

1. Move the route into the existing `role.controller` group, matching `ocr-upload`.
2. Add a rate limit to both OCR routes. `docs/TASK_LIST.md` claims OCR rate-limiting was implemented, but no limiter exists in the code.

*The limit of 10 requests per minute per user is a proposal, not a measured number. Leave it as written and mention it in your report so the human can adjust it.*

## Changes

### 3a. `backend/routes/api.php`

1. Delete the comment line and the standalone route at the top (the two lines shown above).
2. Add this import with the other `use` lines at the top of the file:

```php
use App\Http\Controllers\Api\OcrController;
```

3. Inside the `Route::middleware('role.controller')->group(function () { ... });` block, find the existing line:

```php
Route::post('/categories/{category}/ocr-upload', [\App\Http\Controllers\Api\OcrController::class, 'upload']);
```

Replace it with these two lines:

```php
Route::post('/categories/{category}/ocr-upload', [OcrController::class, 'upload'])->middleware('throttle:ocr');
Route::post('/ocr/extract', [OcrController::class, 'extract'])->middleware('throttle:ocr');
```

### 3b. Define the limiter: `backend/app/Providers/AppServiceProvider.php`

Add these imports below the existing `use` line:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
```

Replace the empty `boot()` method body with:

```php
public function boot(): void
{
    RateLimiter::for('ocr', function (Request $request) {
        return Limit::perMinute(10)->by($request->user()?->id ?? $request->ip());
    });
}
```

Keep the existing docblocks and the empty `register()` method.

### 3c. Tests: add to `backend/tests/Feature/OcrTest.php`

Add these methods inside the existing class. The class already has `$this->controllerToken`, `$this->viewerToken`, and the `Config`, `UploadedFile` imports.

```php
public function test_extract_requires_authentication(): void
{
    $image = UploadedFile::fake()->image('table.png', 400, 300);

    $this->post('/api/ocr/extract', ['image' => $image], ['Accept' => 'application/json'])
        ->assertStatus(401);
}

public function test_viewer_cannot_use_extract(): void
{
    $image = UploadedFile::fake()->image('table.png', 400, 300);

    $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
        ->post('/api/ocr/extract', ['image' => $image], ['Accept' => 'application/json'])
        ->assertStatus(403);
}

public function test_controller_can_use_extract(): void
{
    Config::set('ocr.gemini_api_key', '');
    $image = UploadedFile::fake()->image('table.png', 400, 300);

    $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
        ->post('/api/ocr/extract', ['image' => $image], ['Accept' => 'application/json'])
        ->assertStatus(200)
        ->assertJsonPath('success', true);
}

public function test_ocr_routes_are_rate_limited(): void
{
    Config::set('ocr.gemini_api_key', '');

    for ($i = 0; $i < 10; $i++) {
        $image = UploadedFile::fake()->image("t{$i}.png", 100, 100);
        $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->post('/api/ocr/extract', ['image' => $image], ['Accept' => 'application/json'])
            ->assertStatus(200);
    }

    $image = UploadedFile::fake()->image('over.png', 100, 100);
    $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
        ->post('/api/ocr/extract', ['image' => $image], ['Accept' => 'application/json'])
        ->assertStatus(429);
}
```

## Verify Fix 3

```bash
cd backend && php artisan test
php artisan route:list --path=ocr
```

Expected: both OCR routes are listed with the `auth:sanctum`, `role.controller`, and `throttle:ocr` middleware. If `route:list` cannot run in your environment, say so.

## Done when

- Unauthenticated call → 401, viewer → 403, controller → 200, eleventh call in a minute → 429.
- The three existing tests in `OcrTest.php` still pass unchanged.

---

# Fixes 2 and 4 — Frontend (do together)

## Problems

**Fix 2.** `frontend/lib/api-client.ts` falls back to `"demo-prototype-token"` in three places (lines ~36, ~483, ~516) whenever nothing is stored in localStorage. `frontend/lib/auth.tsx` also mints demo tokens in two more places.

**Fix 4.** `frontend/lib/auth.tsx` posts login to the literal `http://127.0.0.1:8000/api/auth/login` (line ~47) and builds the logout URL with a `127.0.0.1` fallback (line ~115). These fail in any deployed environment. Every other API call already uses `API_BASE_URL` from `api-client.ts`.

## Important regression to prevent

Today the store loads projects once on mount (`store.tsx`, `useEffect` with `[]` deps). It only works for a logged-out visitor because the demo-token fallback lets that first request succeed. After the fallback is removed, a fresh visitor's first request has no token, gets a 401, and is swallowed. After they log in, `router.push("/")` does not remount `StoreProvider`, so **the dashboard would stay empty until a page reload.** Step 5 fixes this by re-running the load when the token changes. Do not skip it.

There is no circular-import risk as long as you follow the file plan exactly: `auth.tsx` imports only the two new helper files; `store.tsx` imports `auth.tsx`. **`auth.tsx` must never import `store.tsx` or `api-client.ts`.**

## Changes

### Step 1. Create `frontend/lib/config.ts`

```ts
// Single source of truth for the API base URL.
// Browser default is the same-origin Next.js proxy (see rewrites in next.config.ts).
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api/backend" : "http://127.0.0.1:8000/api");
```

This is the exact expression currently at the top of `api-client.ts`, moved so both files can share it.

### Step 2. Create `frontend/lib/auth-storage.ts`

```ts
export const AUTH_TOKEN_KEY = "matrix_auth_token";
export const AUTH_USER_KEY = "matrix_auth_user";

// Must match PROJECTS_CACHE_KEY in store.tsx. Duplicated on purpose to avoid an import cycle.
const PROJECTS_CACHE_KEY = "matrix_projects_cache";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuthStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(PROJECTS_CACHE_KEY);
  } catch {
    // storage unavailable
  }
  document.cookie = "matrix_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
```

### Step 3. Edit `frontend/lib/api-client.ts`

**3a. Imports and base URL.** Replace the existing local definition:

```ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "/api/backend" : "http://127.0.0.1:8000/api");
```

with imports (put them next to the existing `import type {...} from "./types"`):

```ts
import { API_BASE_URL } from "./config";
import { getAuthToken, clearAuthStorage } from "./auth-storage";
```

**3b. Add a 401 handler** just above `async function request<T>`:

```ts
function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return; // avoid a redirect loop
  clearAuthStorage();
  window.location.href = "/login";
}
```

**3c. In `request<T>()`** replace this block:

```ts
let token: string | null = null;
if (typeof window !== "undefined") {
  token = localStorage.getItem("matrix_auth_token") || "demo-prototype-token";
}
```

with:

```ts
const token = getAuthToken();
```

The `headers` object below it already only adds `Authorization` when `token` is truthy. Leave it. Then, immediately after `const response = await fetch(...)` and **before** the `if (!response.ok)` block, add:

```ts
if (response.status === 401) handleUnauthorized();
```

Leave the rest of `request()` (error parsing, `ApiError`) unchanged.

**3d. `uploadControlPhoto` and `uploadOcrImage`.** In each, replace:

```ts
const token =
  (typeof window !== "undefined" && localStorage.getItem("matrix_auth_token")) || "demo-prototype-token";
```

with:

```ts
const token = getAuthToken();
```

and in each, after the `const res = await fetch(...)` call and before `if (!res.ok)`, add:

```ts
if (res.status === 401) handleUnauthorized();
```

### Step 4. Edit `frontend/lib/auth.tsx`

**4a. Imports.** Add below the existing imports:

```ts
import { API_BASE_URL } from "./config";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, clearAuthStorage } from "./auth-storage";
```

**4b. Use the constants for the two storage reads in the mount `useEffect`, and in `login`'s `setItem` calls.** Replace the string literals `"matrix_auth_token"` and `"matrix_auth_user"` with `AUTH_TOKEN_KEY` and `AUTH_USER_KEY`. This is a mechanical rename. Do not change logic.

**4c. Login URL.** Replace:

```ts
const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
```

with:

```ts
const res = await fetch(`${API_BASE_URL}/auth/login`, {
```

**4d. Delete the offline fallback.** In `login`, the `catch { ... }` block currently contains about 40 lines that log the user in locally as a viewer or controller with a demo token when the network fails. Replace the **entire** catch block with:

```ts
} catch {
  return false;
}
```

**4e. Logout.** Replace the body of `logout` with:

```ts
const logout = () => {
  try {
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }).catch(() => {});
    }
  } finally {
    setUser(null);
    setToken(null);
    clearAuthStorage();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
};
```

**4f. Remove `switchRoleDemo` entirely.** It mints demo tokens, and the backend now rejects them. Delete it from:

- the `AuthContextType` interface,
- the `switchRoleDemo` function definition,
- the `value={{ ... }}` object in the provider,
- `FALLBACK_AUTH_CONTEXT`.

Then delete the `switchRoleDemo: vi.fn(),` lines in `frontend/components/trial-report-session-list.test.tsx` (lines ~41 and ~74). Confirm with:

```bash
grep -rn "switchRoleDemo" frontend --include=*.ts --include=*.tsx | grep -v node_modules
```

Expected: no output.

**Leave alone:** the `matrix_token` cookie writes in `login`. Nothing reads that cookie, but removing it is outside this fix. Also leave `FALLBACK_AUTH_CONTEXT.login: async () => true` as is.

### Step 5. Re-load projects when the token changes: `frontend/lib/store.tsx`

**5a.** Add an import near the other `./` imports at the top of the file:

```ts
import { useAuth } from "./auth";
```

**5b.** In `StoreProvider`, add this line right after the `useReducer(...)` call:

```ts
const { token } = useAuth();
```

**5c.** Find the effect commented `// Sync initial state from backend on mount` (around line 1688). Change it to:

```ts
// Sync state from backend once we have a token (mount with a stored token, or right after login)
useEffect(() => {
  if (!token) return;
  let active = true;
  api
    .getProjects()
    .then((res) => {
      if (active && res.data && res.data.length > 0) {
        rawDispatch({ type: "SET_PROJECTS", projects: res.data });
        try {
          localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(res.data));
        } catch {}
      }
    })
    .catch(() => {
      // Keep cached projects if the API is unreachable
    });

  return () => {
    active = false;
  };
}, [token]);
```

The only changes are the `if (!token) return;` guard, the `[token]` dependency, and the comment text. Keep everything else identical.

*Why this is safe with the existing tests:* no test file mounts `StoreProvider` directly, and outside an `AuthProvider`, `useAuth()` returns a fallback context with `token: null`, so the effect is simply skipped.

### Step 6. Docker / deployment: make the proxy work in containers

*Assumption to verify:* the browser now defaults to the same-origin proxy `/api/backend`. Next.js evaluates `rewrites()` at **build time**, and `docker-compose.yml` never gives the frontend build a backend URL, so in the containers the proxy target would default to `http://127.0.0.1:8000`, which is wrong inside the frontend container. Without this step, Fix 4 works locally but still breaks in Docker.

**6a. `docker/Dockerfile.frontend`,** in the `builder` stage, add these two lines **before** `RUN npm run build`:

```dockerfile
ARG BACKEND_INTERNAL_URL=http://backend:80
ENV BACKEND_INTERNAL_URL=$BACKEND_INTERNAL_URL
```

**6b. `docker-compose.yml`,** in the `frontend` service:

- Add build args under the existing `build:` block:

```yaml
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
      args:
        BACKEND_INTERNAL_URL: http://backend:80
```

- Delete the line `NEXT_PUBLIC_API_URL: http://localhost:8000/api` from `environment:`. It is set at runtime, but `NEXT_PUBLIC_*` values are inlined at build time, so it has no effect on the browser bundle and is misleading. Removing it means the browser uses the same-origin proxy, which also avoids CORS. Keep `NODE_ENV: production`.

**6c. Verify if Docker is available:** after `docker compose build frontend`, check that the proxy target was baked in:

```bash
docker compose run --rm --entrypoint sh frontend -c "grep -o 'backend:80' .next/routes-manifest.json | head -1"
```

If you cannot run Docker, state that Step 6 is **unverified** in your report. Do not claim it works.

## Verify Fixes 2 and 4

```bash
cd frontend
npm run typecheck
npm run lint
npm test
grep -rn "demo-prototype-token\|demo-controller-token\|demo-viewer-token" lib components app
grep -rn "127.0.0.1:8000" lib components app
```

Expected:

- typecheck, lint, and unit tests pass. If a test fails, capture the exact failure text and decide whether it comes from your change. Do not edit assertions to make it pass without reporting.
- First grep: **no output**.
- Second grep: only `lib/config.ts` (the server-side fallback) and the two fixture lines in `lib/store.test.ts` (~877 and ~887).

**Optional, only if both servers are running and the database is seeded:** `npm run test:e2e`. The e2e tests log in through the real form with seeded accounts, so they should still pass. The login request now goes through the `/api/backend` proxy instead of directly to port 8000, so a failure here is informative. Report it, don't work around it.

**Manual check if you can run the app:** open `/login` in a fresh browser profile, log in with a seeded account, and confirm the dashboard populates **without a page reload**. That is the regression Step 5 guards against.

## Done when

- No demo-token strings or `127.0.0.1:8000` remain in `frontend/lib`, `frontend/components`, `frontend/app` except as listed above.
- Logging in as a fresh visitor populates the dashboard without a reload.
- Logging out clears the token, the user, and the cached projects.

---

# Final report format

Send back exactly this structure:

1. **Changed files**: a list of paths, grouped by fix.
2. **Commands run and results**: each command with its real pass/fail output (tail it if long).
3. **Not run / unverified**: anything you could not execute (Docker, e2e, curl checks), plus any *Assumption* above you could not confirm.
4. **Deviations**: any place the code did not match this document and what you did about it.
5. **Rate limit**: state that `throttle:ocr` is set to 10 per minute as a proposal.

# Noticed but deliberately out of scope

Do not fix these. They are listed so they are not lost.

- `backend/database/seeders/DemoSeeder.php` creates accounts with weak known passwords (`eng#1`, `matrix#1`, `password123`). Check that the seeder does not run in production.
- `OcrService::fallbackParse` returns fabricated demo rows with `success: true` when Gemini is unavailable. The `provider` field says `offline_fallback`, but a user could save fake parts.
- `bulkSendPo` and the other bulk actions look items up with `whereIn('id', $itemIds)` without checking they belong to the `{jo}` in the URL.
- Uploaded photo URLs come from `Storage::url()`, which uses `APP_URL`. In a real deployment `APP_URL` must be the public URL or photos will point at `localhost`.
- The `Policies/` classes are defined but never invoked; access control is the `role.controller` middleware only.
- CI (`.github/workflows/ci.yml`) runs backend tests only, with no frontend, Playwright, or Python jobs.
