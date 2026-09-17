# MATRIX Local BOM OCR Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Workspace: C:\laragon\www\MATRIX

Approved design: docs/superpowers/specs/2026-09-15-local-bom-ocr-lab-design.md

Prerequisite plan: docs/superpowers/plans/2026-09-15-local-bom-ocr-lab.md

Status: GATED. Do not execute any task in this document until the standalone OCR
Lab has passed every benchmark gate and the user explicitly authorizes
integration.

## 1. Hard Start Conditions

Before starting this plan, obtain all of the following:

1. The private benchmark report from the OCR Lab.
2. Evidence that the report meets the approved thresholds:
   - table detection at least 98 percent;
   - data-row recall at least 98 percent;
   - normalized non-empty cell exact match at least 95 percent;
   - No and Qty each at least 99 percent;
   - repeatable output;
   - p95 one-image latency at most 20 seconds on the target device, unless the
     user approved a measured exception.
3. User sign-off on the report and on starting MATRIX integration.
4. A fresh root and frontend git status review.
5. A safe plan for the existing dirty worktree. The following are planned OCR
   touchpoints; inspect their live status and preserve any actual user diff
   rather than assuming a file is clean or dirty:
   - backend/app/Services/OcrService.php
   - backend/app/Http/Controllers/Api/OcrController.php
   - backend/routes/api.php
   - backend/tests/Feature/ApiTest.php
   - frontend/components/add-data-dialog.tsx
   - frontend/lib/api-client.ts
   - frontend/next.config.ts

If any condition is missing, stop at the Lab. Do not change the app merely to
make the UI look finished.

## 2. Integration Outcome

After this plan, the Controller Image Conversion flow works as follows:

~~~text
PNG/JPG upload or image paste
    ->
Laravel category OCR endpoint, Controller only
    ->
private local OCR service
    ->
local review result, warnings, and editable item rows
    ->
user manually confirms item creation

If local OCR fails or yields warnings:
    ->
show clear local OCR outcome
    ->
Controller may press Coba dengan Gemini
    ->
explicit privacy confirmation
    ->
same in-memory image is sent to Gemini only after confirmation
    ->
editable review result
~~~

No PDF upload, automatic Gemini retry, fake sample rows, direct browser-to-OCR
service call, database schema change, or item auto-save is introduced.

## 3. Current Application Touchpoints

| Current path | Integration responsibility |
| --- | --- |
| backend/app/Services/OcrService.php | Refactor from Gemini-first/static-fallback behavior to an orchestrator with local default and manually invoked Gemini fallback. |
| backend/app/Http/Controllers/Api/OcrController.php | Validate image-only uploads, return local result/warnings, expose controller-only Gemini fallback action. |
| backend/app/Http/Requests/OcrImageUploadRequest.php | New shared server-side image validation for both local and Gemini routes, including decoded image safety limits. |
| backend/config/ocr.php | Define server-only local OCR URL/timeouts and retain Gemini credentials/configuration. |
| backend/routes/api.php | Preserve protected category upload route, add protected fallback route, remove the unprotected generic OCR route when compatibility check confirms no client uses it. |
| backend/tests/Feature/OcrTest.php | Replace Gemini-first/static-fallback assumptions with local-default, failure, authorization, and explicit-fallback tests. |
| backend/.env.example | Document local OCR URL/timeouts and optional Gemini values without putting values in real env files. |
| frontend/lib/ocr.ts | New typed API/result adapters for provider, warnings, review state, and mapping to current item fields. |
| frontend/lib/ocr.test.ts | Pure tests for mapping remote OCR rows into review rows and for warning/fallback eligibility. |
| frontend/lib/api-client.ts | Typed local extraction and explicit Gemini-fallback upload methods. |
| frontend/components/add-data-dialog.tsx | Image-only picker/paste validation, local extraction state, warning display, no fake rows, and confirmation dialog. |
| frontend/components/add-data-dialog.test.tsx | New UI behavior tests. |
| ocr-lab/src/bom_ocr/service.py | Optional HTTP facade around the benchmarked Lab core. |
| ocr-lab/tests/test_service.py | Service contract/health/input tests. |
| docker/Dockerfile.ocr | CPU-only production image for the proven OCR service. |
| docker-compose.yml | Internal OCR service and persistent model cache, no public OCR port. |
| docs/IMPLEMENTATION_PLAN.md | Update outdated Gemini-first architecture text after integration passes. |
| docs/TASK_LIST.md | Replace completed Gemini-only OCR wording with the local-default/explicit-fallback design. |

No migration, model, resource, or database table is needed.

## 4. Task 0: Revalidate the Gate and Isolate Work Safely

1. Read the Lab benchmark report and compare every metric with the approved
   design.
2. Record the evidence in the pull-request/implementation notes without adding
   private images or reports to Git.
3. Read the live files listed in Section 3, including their current diffs.
4. Search all first-party source code for both existing routes:

~~~powershell
rg -n "/ocr/extract|ocr-upload|uploadOcrImage" frontend backend docs --glob "!**/vendor/**" --glob "!**/node_modules/**" --glob "!**/.next/**"
~~~

5. Confirm the UI uses the protected category endpoint and identify any declared
   consumer of the public generic endpoint.
6. If no supported consumer exists, plan to delete the public generic endpoint.
   If a supported consumer exists, move it into the same auth.token and
   role.controller middleware rather than leaving it public.
7. Capture and save a full porcelain snapshot in implementation notes outside
   the repository. Compare it at final review; it is not permission to discard
   another user's later changes:

~~~powershell
git status --porcelain=v1
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend status --porcelain=v1
~~~

8. Work from a clean approved baseline/worktree for integration whenever
   possible. Do not stage, restore, or reset unrelated user changes.
9. Make no changes until the user has explicitly authorized this gated plan.

Deliverable: safe, evidenced authorization to integrate.

## 5. Task 1: Expose the Proven OCR Core as a Local HTTP Service

1. Add an optional service dependency group in ocr-lab/pyproject.toml for
   FastAPI and Uvicorn. Keep the base CLI/benchmark install lightweight.
2. Add tests/test_service.py before implementation.
3. Define service-level response schema as the Lab ExtractionResult. Include:

~~~text
success
provider
schemaVersion
items
rows
warnings
message
failureCode
requiresReview
~~~

4. Add a health route returning engine name, schema version, and ready state but
   never internal source paths, credentials, or model cache contents.
5. Add a multipart POST route:

~~~text
POST /v1/extract-bom
form field: image
~~~

6. Accept only JPEG and PNG using the same authoritative image policy as the
   Laravel adapter: max 10 MiB, max 8,192 pixels on either edge, and max
   24,000,000 decoded pixels. Verify the decoded image format rather than
   trusting filename/MIME alone. Reject PDF, WebP, GIF, empty files,
   oversized/pixel-bomb images, animated/multi-frame images, and mismatched
   MIME/extension combinations before pipeline execution.
7. Write the multipart input to a short-lived temporary file only if the
   selected decoder requires a filesystem path. Delete it in a finally block.
8. Invoke the existing benchmarked pipeline exactly once per request with one
   CPU worker. Do not create an alternative service-only parsing path.
9. Map no-table/unsupported-layout outcomes to HTTP 200 with success false and
   empty items, so the UI can show diagnostic warnings and the explicit fallback
   option. Map unavailable service/model startup failures to HTTP 503 with a
   sanitized failureCode.
10. Add tests for health, supported image, PDF/MIME-spoof/empty-file rejection,
    byte and decoded-pixel limit rejection, no-table result, temporary-file
    cleanup, no persisted source image, and service unavailable handling.
11. Run the service locally only on loopback:

~~~powershell
Set-Location C:\laragon\www\MATRIX\ocr-lab
.\.venv\Scripts\python.exe -m uvicorn bom_ocr.service:app --host 127.0.0.1 --port 8080
~~~

12. Run:

~~~powershell
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus" tests/test_service.py
.\.venv\Scripts\python.exe -m ruff check src tests
~~~

Deliverable: a private local HTTP facade that serves the already benchmarked OCR
core without persistent source uploads.

Suggested clean-worktree commit after review: feat(ocr): expose local BOM OCR service

## 6. Task 2: Containerize the Local Service Without Exposing It Publicly

1. Create docker/Dockerfile.ocr using a Python version proven by the Lab,
   preferably Python 3.11 slim.
2. Install only the service dependencies and the tested CPU OCR stack. Do not
   add CUDA/NVIDIA packages or a browser.
3. Arrange the image so model weights use a configurable mounted cache instead
   of being stored in source control.
4. Add a non-root service user and a writable temporary directory.
5. Configure one Uvicorn worker and loopback/container HTTP health endpoint.
6. Update docker-compose.yml with an ocr service that:

   - has no host ports;
   - has a persistent named volume only for model cache, not input images;
   - exposes its health endpoint only on the Docker network;
   - uses a health check;
   - starts before backend through a health dependency;
   - receives no Gemini key or database credential.

7. Add LOCAL_BOM_OCR_URL to the backend service environment with value
   http://ocr:8080 in Docker.
8. Do not alter Postgres, storage, or frontend services.
9. Validate syntax before building:

~~~powershell
docker compose config
~~~

10. After approved dependency/image downloads, build only the OCR image and
    check its health. Do not run destructive compose commands or recreate
    database volumes.

~~~powershell
docker compose build ocr
docker compose up -d ocr
docker compose ps ocr
~~~

11. Confirm no host port is published for the OCR service.
12. Stop only the service started for this test if it was not part of an
    existing user-owned stack.

Deliverable: deployable CPU OCR service reachable only by MATRIX backend.

Suggested clean-worktree commit after review: build(ocr): add internal local OCR service

## 7. Task 3: Refactor Laravel to Use Local OCR by Default

1. Add backend unit/feature tests first in backend/tests/Feature/OcrTest.php.
   In test setup, call `Http::preventStrayRequests()`; fake only the expected
   local-service or Gemini URL in each test so an accidental external request
   fails the test suite.
2. Add backend/app/Http/Requests/OcrImageUploadRequest.php. Use it from both
   OCR actions so one policy accepts only decoded JPEG/PNG images, checks an
   actual decoder result plus MIME/extension consistency, and enforces max
   10 MiB, 8,192 pixels per edge, and 24,000,000 decoded pixels. Keep these
   limits in OCR config rather than duplicating magic numbers.
3. Add a focused backend client, for example
   backend/app/Services/LocalBomOcrClient.php, responsible only for multipart
   transport to the configured local service.
4. Make it accept an UploadedFile, forward only the image content/type/name,
   enforce connect/read timeouts from config, and return the service payload.
5. Make it sanitize connection errors into a local service unavailable exception
   without logging base64/image content.
6. Refactor backend/app/Services/OcrService.php surgically. Preserve
   compatibility with its controller constructor, but split behavior into:

   - extractItems: local OCR default only;
   - extractItemsWithGemini: invoked only by explicit fallback route;
   - normalized result mapping into current MATRIX item fields;
   - removal of fallbackParse, offline_fallback, and every call site that can
     fabricate sample rows;
   - exactly one Google request per user-confirmed Gemini action. Do not loop
     through alternate Gemini models after 429/503; return one sanitized
     failure and require a new explicit confirmed action for another attempt.

7. Retain Gemini configuration server-side but do not call it from extractItems.
8. In backend/config/ocr.php, replace the flat Gemini-only shape with named
   local and gemini settings. Keep existing GEMINI_API_KEY and
   GEMINI_OCR_MODEL compatibility, add only server-side variables such as:

~~~text
LOCAL_BOM_OCR_URL
LOCAL_BOM_OCR_CONNECT_TIMEOUT
LOCAL_BOM_OCR_TIMEOUT
~~~

   Also configure the shared file-byte, width, height, and pixel limits there.
9. Update backend/.env.example, never backend/.env.
10. Map the local OCR output as follows:

   - local item no, description, dimension, material, qty, hrc map into the
     existing item preview shape;
   - optional remark remains source-only and is not silently persisted because
     the current Item schema has no remark field;
   - warnings/row review status remain available to the frontend;
   - no structural result returns empty items, success false, warnings, and a
     clear message;
   - transport/model outage returns a sanitized 503 response.

11. Write tests that fake the local service URL and assert:

    - successful local payload yields provider local_bom_ocr;
    - default endpoint sends no request to Google;
    - local/Gemini failure and no-table result each yield no static fake rows;
    - local HTTP failure yields sanitized failure code;
    - unrecognized response schema fails safely;
    - PDF, empty file, MIME/extension spoofing, byte oversize, and decoded
      pixel oversize are rejected before either provider is contacted;
    - input file is not stored;
    - the existing category/Controller role remains enforced.
    - a confirmed Gemini 429/503 produces exactly one outbound request and no
      hidden model retry.

12. Run:

~~~powershell
Set-Location C:\laragon\www\MATRIX\backend
php artisan test --filter=OcrTest
php artisan test
~~~

Deliverable: Laravel is a safe internal adapter for local OCR, not a Gemini-first
or fake-data fallback service.

Suggested clean-worktree commit after review: feat(api): use local BOM OCR by default

## 8. Task 4: Secure OCR Routes and Add Explicit Gemini Fallback

1. Update OcrController only after the local default tests are red and ready.
2. Keep the existing category upload endpoint under auth.token plus
   role.controller middleware.
3. Add a separate controller-only fallback endpoint:

~~~text
POST /api/categories/{category}/ocr-upload/gemini-fallback
~~~

4. Require multipart field `external_upload_confirmed=true`. The fallback use
   of OcrImageUploadRequest must validate it as required and accepted before
   OcrService is called; browser confirmation alone is not authorization.
5. The endpoint accepts the image again from the browser's in-memory File. Do
   not recover or persist a previous source image.
6. Call only OcrService::extractItemsWithGemini from this endpoint after the
   accepted confirmation field has passed validation.
7. Remove the unprotected POST /api/ocr/extract route and its unused controller
   method after the Task 0 source-consumer check confirms no supported client.
   If a verified client must remain, place it behind both auth.token and
   role.controller rather than keeping it public.
8. Add explicit failure responses for:

    - non-image/oversized upload: 422;
    - absent/false external_upload_confirmed: 422 with no Google request;
    - unauthenticated request: 401;
   - Viewer request: 403;
   - local structural failure: 200 with success false and no items;
   - local service unavailable: 503;
   - manually requested Gemini failure: sanitized 502 or 503 with no items.

9. Update OcrTest.php with tests for Controller success, Viewer denial, guest
   denial, no static fallback, public-route removal/protection, missing consent
   causing no outbound request, and Gemini request being sent only to the
   separate fallback route after consent.
10. Use Laravel Http::fake, Http::assertNothingSent/Http::assertSent, and an
    expected one-request count to prove the default route never contacts Google
    and a confirmed 429/503 fallback does not silently retry another model.
11. Run focused and full backend tests again.

Deliverable: the server enforces local-first and human-confirmed external
fallback; no public Gemini-capable endpoint remains.

Suggested clean-worktree commit after review: fix(api): gate Gemini OCR fallback by controller confirmation

## 9. Task 5: Add Typed Frontend OCR Contract and API Client Methods

1. Create frontend/lib/ocr.ts and frontend/lib/ocr.test.ts before editing the
   dialog.
2. Define TypeScript types for:

   - OcrProvider;
   - OcrWarning;
   - OcrReviewStatus;
   - OcrExtractionResponse;
   - OcrReviewRow;
   - local service failure codes;
   - mapping from server items to the existing batch Add Data fields.

3. Write pure tests for:

   - a clean local response;
   - warning/needs-review response;
   - no-table empty result;
   - optional remark displayed as source-only and excluded from item batch
     payload;
   - Gemini result using the same review model;
   - eligibility for the Gemini button only after local failure or warnings.

4. In frontend/lib/api-client.ts, replace the untyped OCR return shape with
   OcrExtractionResponse.
5. Keep uploadOcrImage as the local-default category endpoint. Add a distinctly
   named uploadOcrImageWithGeminiFallback method that calls only the new
   fallback endpoint and includes `external_upload_confirmed=true` only when
   the dialog has completed its confirmation action.
6. Preserve Authorization header behavior and avoid direct browser requests to
   the local service.
7. In API error handling, preserve a sanitized failureCode/message from 503
   response for UI display.
8. Run:

~~~powershell
Set-Location C:\laragon\www\MATRIX\frontend
npm.cmd run test -- --run lib/ocr.test.ts
npm.cmd run typecheck
~~~

Deliverable: frontend OCR result handling is typed, testable, and cannot
accidentally call Gemini through the default method.

Suggested clean-worktree commit after review: feat(frontend): type local OCR review responses

## 10. Task 6: Update the Image Conversion UI Safely

1. Read frontend/AGENTS.md and the current Next.js guidance before editing the
   component.
2. Add frontend/components/add-data-dialog.test.tsx before changing behavior.
3. Remove FALLBACK_EXTRACTION from add-data-dialog.tsx. Initial conversion rows
   must be empty, not prototype data.
4. Remove the PDF branch from prepareImageForOcr.
5. Add client-side image validation that permits JPEG and PNG only. Server
   validation remains the authority.
6. Change the file input accept attribute from image/PDF to explicit image MIME
   types. Update visible copy to say PNG/JPG only.
7. Keep drag/drop and clipboard image workflow, but reject unsupported image
   types with a visible explanation rather than calling the API.
8. Preserve the original File in component state only while the dialog is
   open. Clear it on close/reset; do not persist it to storage/localStorage.
9. On local extraction success:

   - populate editable review rows;
   - show provider Local OCR;
   - show per-row/per-result warnings and needs-review state;
   - retain the current manual batch confirmation flow;
   - do not auto-create items.

10. On local no-table/low-confidence result:

    - keep rows empty or show warning-marked rows as returned;
    - display the server message and clear corrective action;
    - make Coba dengan Gemini available only to a Controller;
    - do not insert sample values.

11. On local 503:

    - show local service unavailable;
    - retain the in-memory source File;
    - allow the explicit Gemini button but never trigger it automatically.

12. Reuse the existing confirmation dialog pattern. Its content must state:

~~~text
Gambar ini akan dikirim ke Google Gemini untuk mencoba ekstraksi ulang.
Pastikan Anda memiliki izin untuk mengirim data drawing/BOM ini ke layanan eksternal.
~~~

13. Cancel must close the confirmation without calling the fallback API. Confirm
    calls uploadOcrImageWithGeminiFallback using the still-in-memory File; that
    method supplies the required `external_upload_confirmed=true` field.
14. Render the optional Remark, if present, as a source-only/read-only
    review field labelled Tidak diimpor. Do not mutate current Item domain
    types or add a database field.
15. Add component tests for:

    - PNG/JPG accept/reject behavior;
    - no initial fake rows;
    - local clean response renders editable rows;
    - warning response renders warning state;
    - local failure does not add items;
    - Gemini button is absent until eligible;
    - cancel sends no fallback request;
    - confirmed fallback calls only explicit API method with the required
      external-upload confirmation field;
    - confirmation text explains external upload;
    - batch confirmation still uses only editable current item fields.

16. Run:

~~~powershell
npm.cmd run test -- --run components/add-data-dialog.test.tsx lib/ocr.test.ts
npm.cmd run typecheck
~~~

Deliverable: Controller users get a transparent image-only local-first review
workflow, with no false OCR rows or silent external upload.

Suggested clean-worktree commit after review: feat(ui): add reviewed local OCR conversion flow

## 11. Task 7: Update Deployment Documentation and Current OCR Docs

1. Update docs/IMPLEMENTATION_PLAN.md so it no longer describes Gemini as the
   sole/default OCR architecture.
2. Update docs/TASK_LIST.md to state that local OCR is default after benchmark,
   image-only input is supported, review is required, and Gemini is an explicit
   Controller fallback.
3. Update backend/config/ocr.php comments and backend/.env.example comments
   consistently.
4. Update ocr-lab/README.md with service mode and Docker/local development
   commands, but keep Lab benchmark instructions intact.
5. Do not include private corpus data, benchmark results, keys, screenshots, or
   actual drawings in public documentation.

Deliverable: code/config/docs describe the same local-first behavior.

## 12. Task 8: Full Verification and Manual Acceptance

1. Run local Lab checks with the proven model/version:

~~~powershell
Set-Location C:\laragon\www\MATRIX\ocr-lab
.\.venv\Scripts\python.exe -m pytest -q -m "not model and not private_corpus"
.\.venv\Scripts\python.exe -m ruff check src tests
~~~

2. Run backend checks:

~~~powershell
Set-Location C:\laragon\www\MATRIX\backend
php artisan test --filter=OcrTest
php artisan test
~~~

3. Run frontend checks:

~~~powershell
Set-Location C:\laragon\www\MATRIX\frontend
npm.cmd run test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
~~~

4. Run Docker configuration validation:

~~~powershell
Set-Location C:\laragon\www\MATRIX
docker compose config
~~~

5. If lint or build fails on pre-existing dirty worktree issues, report the
   exact output and do not misattribute it to OCR integration.
6. Manually verify as a Controller:

   - upload a representative PNG/JPG;
   - inspect grid/OCR review output and edit values;
   - confirm rows are not saved until manual batch confirmation;
   - test a no-table image and verify no sample rows appear;
   - test an unavailable local service and verify no automatic Google call;
   - open Gemini confirmation, cancel, and verify no call;
   - confirm Gemini retry with an authorized non-sensitive test image;
   - verify optional remark remains source-only;
   - verify an unsupported PDF is rejected;
   - verify Viewer cannot upload or use fallback.

7. Review network/devtools/server logs to confirm the default path reaches only
   the local service and no Google request happens until explicit confirmation.
8. Review only intended files:

~~~powershell
git diff --check -- ocr-lab backend/app/Services/OcrService.php backend/app/Services/LocalBomOcrClient.php backend/app/Http/Controllers/Api/OcrController.php backend/app/Http/Requests/OcrImageUploadRequest.php backend/config/ocr.php backend/routes/api.php backend/tests/Feature/OcrTest.php backend/.env.example docker/Dockerfile.ocr docker-compose.yml docs/IMPLEMENTATION_PLAN.md docs/TASK_LIST.md
git diff --cached --check -- ocr-lab backend/app/Services/OcrService.php backend/app/Services/LocalBomOcrClient.php backend/app/Http/Controllers/Api/OcrController.php backend/app/Http/Requests/OcrImageUploadRequest.php backend/config/ocr.php backend/routes/api.php backend/tests/Feature/OcrTest.php backend/.env.example docker/Dockerfile.ocr docker-compose.yml docs/IMPLEMENTATION_PLAN.md docs/TASK_LIST.md
git status --short -- ocr-lab backend/app/Services/OcrService.php backend/app/Services/LocalBomOcrClient.php backend/app/Http/Controllers/Api/OcrController.php backend/app/Http/Requests/OcrImageUploadRequest.php backend/config/ocr.php backend/routes/api.php backend/tests/Feature/OcrTest.php backend/.env.example docker/Dockerfile.ocr docker-compose.yml docs/IMPLEMENTATION_PLAN.md docs/TASK_LIST.md
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend diff --check -- components/add-data-dialog.tsx components/add-data-dialog.test.tsx lib/api-client.ts lib/ocr.ts lib/ocr.test.ts
git -c safe.directory=C:/laragon/www/matrix/frontend -C frontend status --short -- components/add-data-dialog.tsx components/add-data-dialog.test.tsx lib/api-client.ts lib/ocr.ts lib/ocr.test.ts
~~~

9. Request code review before merge. Create focused commits only in a clean
   approved worktree; never fold unrelated existing changes into this work.
   Before staging or committing, manually inspect every intended untracked OCR
   path because Git diff checks do not show new untracked files; compare the
   final porcelain snapshot with the Task 0 baseline as well.

## 13. Completion Checklist

- [ ] Lab benchmark report is approved before integration starts.
- [ ] Local OCR is the default path.
- [ ] Image-only input enforced in browser and backend.
- [ ] No fake static extraction rows remain.
- [ ] No automatic Gemini retry exists.
- [ ] Gemini fallback is Controller-only and confirmation-gated.
- [ ] Public generic OCR endpoint is removed or protected after caller audit.
- [ ] Source images are not stored or logged.
- [ ] Optional Remark is source-only, not silently persisted.
- [ ] No migration/database schema is added.
- [ ] Docker OCR service has no host port and no Gemini credentials.
- [ ] Backend, frontend, Lab, and Docker checks have actual recorded evidence.
