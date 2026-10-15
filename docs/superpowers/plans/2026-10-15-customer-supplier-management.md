# Customer & Supplier Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

Implement the Customer & Supplier Management modal dialog accessed from the `+ New Item` menu, backed by a unified `partners` table in PostgreSQL / Laravel 13, complete with micro-SVG actions, status toggling (Active / Discontinued), inline fast-entry, and integration with dynamic dropdowns across the application.

---

## Proposed Changes

### Backend (Laravel 13 / PHP 8.3 / PostgreSQL)

#### [NEW] [database/migrations/2026_10_15_000001_create_partners_table.php](file:///c:/laragon/www/matrix/backend/database/migrations/2026_10_15_000001_create_partners_table.php)
- Creates `partners` table:
  - `id`: UUID Primary Key (`$table->uuid('id')->primary()`)
  - `name`: string
  - `type`: string (`customer`, `supplier_po`, `supplier_subcont`)
  - `status`: string (`active`, `discontinued`), default: `'active'`
  - `timestamps`
  - Indexes: `name`, `[type, status]`

#### [NEW] [app/Models/Partner.php](file:///c:/laragon/www/matrix/backend/app/Models/Partner.php)
- Eloquent model using `HasUuids`.
- Fillable: `['name', 'type', 'status']`.
- Query scopes: `scopeActive($query)`, `scopeOfType($query, $type)`.

#### [NEW] [app/Http/Controllers/Api/PartnerController.php](file:///c:/laragon/www/matrix/backend/app/Http/Controllers/Api/PartnerController.php)
- Methods:
  - `index(Request $request)`: returns JSON list of partners, with optional query filters `type` and `status`, sorted alphabetically by name.
  - `store(Request $request)`: validates name (required, max:255), type (required, in:customer,supplier_po,supplier_subcont), status (in:active,discontinued, default active). Creates and returns `Partner`.
  - `update(Request $request, Partner $partner)`: validates optional name, status. Updates and returns `Partner`.
  - `destroy(Partner $partner)`: deletes partner, returns `{ message: "Partner deleted successfully" }`.

#### [NEW] [database/seeders/PartnerSeeder.php](file:///c:/laragon/www/matrix/backend/database/seeders/PartnerSeeder.php)
- Migrates existing static lists with status `active`:
  - 79 customers
  - 7 PO suppliers
  - 8 Subcont suppliers
- Idempotent (checks `firstOrCreate` by `name` and `type`).

#### [MODIFY] [database/seeders/DatabaseSeeder.php](file:///c:/laragon/www/matrix/backend/database/seeders/DatabaseSeeder.php)
- Calls `PartnerSeeder::class`.

#### [MODIFY] [routes/api.php](file:///c:/laragon/www/matrix/backend/routes/api.php)
- Authenticated read:
  - `Route::get('/partners', [PartnerController::class, 'index']);`
- Mutating endpoints (`middleware('role.controller')`):
  - `Route::post('/partners', [PartnerController::class, 'store']);`
  - `Route::put('/partners/{partner}', [PartnerController::class, 'update']);`
  - `Route::delete('/partners/{partner}', [PartnerController::class, 'destroy']);`

#### [NEW] [tests/Feature/PartnerTest.php](file:///c:/laragon/www/matrix/backend/tests/Feature/PartnerTest.php)
- Tests:
  - `test_controller_can_list_partners()`
  - `test_controller_can_create_partner()`
  - `test_controller_can_update_partner_name_and_status()`
  - `test_controller_can_delete_partner()`
  - `test_viewer_can_list_partners_but_cannot_mutate()`
  - `test_partner_validation_rules()`

---

### Frontend (Next.js 16 / React 19 / TypeScript)

#### [MODIFY] [lib/types.ts](file:///c:/laragon/www/matrix/frontend/lib/types.ts)
- Add:
  - `PartnerType = "customer" | "supplier_po" | "supplier_subcont"`
  - `PartnerStatus = "active" | "discontinued"`
  - `Partner` interface (`id`, `name`, `type`, `status`, `createdAt`, `updatedAt`)

#### [MODIFY] [lib/api-client.ts](file:///c:/laragon/www/matrix/frontend/lib/api-client.ts)
- Add methods:
  - `getPartners(type?: PartnerType, status?: PartnerStatus): Promise<Partner[]>`
  - `createPartner(data: { name: string; type: PartnerType; status?: PartnerStatus }): Promise<Partner>`
  - `updatePartner(id: string, data: Partial<Pick<Partner, 'name' | 'status'>>): Promise<Partner>`
  - `deletePartner(id: string): Promise<void>`

#### [NEW] [components/partner-management-dialog.tsx](file:///c:/laragon/www/matrix/frontend/components/partner-management-dialog.tsx)
- Modal dialog (`Dialog` wrapper, width ~680px).
- Header with title "Customer & Supplier".
- 3 Tabs: `Customer` | `Supp PO` | `Supp SC`.
- Inline Add Bar:
  - Input field for partner name.
  - Button `.btn .btn-primary .btn-sm` with micro-SVG plus icon.
  - Submits on Enter or click.
- Table:
  - 3 Columns: `Nama`, `Status`, `Action`.
  - Column `Nama`: display name, inline input when in edit mode with Save (`✓`) / Cancel (`✕`) buttons.
  - Column `Status`: clickable badge (`Active` green, `Discontinued` gray) to toggle status.
  - Column `Action`: `btn-icon` with native micro-SVG pencil (edit) and trash (delete with confirm).
- Zero emojis / emoticons.
- Local optimistic updates with fallback on error.

#### [NEW] [components/partner-management-dialog.test.tsx](file:///c:/laragon/www/matrix/frontend/components/partner-management-dialog.test.tsx)
- Unit tests:
  - Renders 3 tabs correctly.
  - Adds a new partner on submit.
  - Toggles partner status between active and discontinued.
  - Edits partner name.
  - Deletes partner.

#### [MODIFY] [components/new-item-menu.tsx](file:///c:/laragon/www/matrix/frontend/components/new-item-menu.tsx)
- Add `onManagePartners?: () => void` to `NewItemMenuProps`.
- Render "Customer & Supplier" option with clean industrial styling.

#### [MODIFY] [app/page.tsx](file:///c:/laragon/www/matrix/frontend/app/page.tsx)
- Add state `partnerDialogOpen: boolean`.
- Pass `onManagePartners={() => setPartnerDialogOpen(true)}` to `NewItemMenu`.
- Render `<PartnerManagementDialog open={partnerDialogOpen} onClose={() => setPartnerDialogOpen(false)} />`.

#### [MODIFY] [components/customer-combobox.tsx](file:///c:/laragon/www/matrix/frontend/components/customer-combobox.tsx)
- Load active customers from `api.getPartners("customer", "active")` on mount, falling back to `DEFAULT_CUSTOMERS`.

#### [MODIFY] [app/po-tracker/page.tsx](file:///c:/laragon/www/matrix/frontend/app/po-tracker/page.tsx) & [app/subcont/page.tsx](file:///c:/laragon/www/matrix/frontend/app/subcont/page.tsx)
- Dynamically fetch active suppliers from `api.getPartners()` to populate dropdown options.

---

## Step-by-Step Implementation Tasks

### Task 1: Backend Database Migration, Model, & Seeder
1. Create migration `2026_10_15_000001_create_partners_table.php`.
2. Create model `app/Models/Partner.php`.
3. Create seeder `database/seeders/PartnerSeeder.php` importing existing hardcoded partners.
4. Update `database/seeders/DatabaseSeeder.php`.
5. Run migration and seed inside backend container: `php artisan migrate && php artisan db:seed --class=PartnerSeeder`.

### Task 2: Backend Controller, Routes, & Feature Tests
1. Create `app/Http/Controllers/Api/PartnerController.php`.
2. Add routes in `routes/api.php` (public read, controller-only create/update/delete).
3. Create feature tests in `tests/Feature/PartnerTest.php`.
4. Run tests: `php artisan test --filter=PartnerTest` and verify 100% pass.

### Task 3: Frontend API Client & Types
1. Add `PartnerType`, `PartnerStatus`, and `Partner` interface in `frontend/lib/types.ts`.
2. Add partner CRUD methods in `frontend/lib/api-client.ts`.

### Task 4: Partner Management Dialog Component & Tests
1. Create `frontend/components/partner-management-dialog.tsx`:
   - 3 tabs (Customer, Supp PO, Supp SC).
   - Inline add bar with native plus micro-SVG.
   - Table with Nama, Status badge toggle, and `btn-icon` micro-SVG pencil & trash actions.
   - Zero emojis.
2. Create `frontend/components/partner-management-dialog.test.tsx` and verify with Vitest.

### Task 5: Integration into `+ New Item` Menu & Main Page
1. Update `frontend/components/new-item-menu.tsx` to include "Customer & Supplier" option.
2. Update `frontend/app/page.tsx` to handle opening the dialog for controller users.

### Task 6: Dynamic Dropdowns Integration
1. Update `frontend/components/customer-combobox.tsx` to fetch active customers dynamically.
2. Update `frontend/app/po-tracker/page.tsx` and `frontend/app/subcont/page.tsx` to include active suppliers dynamically.

### Task 7: Full System Verification
1. Run backend tests: `docker exec matrix-backend php artisan test --filter=PartnerTest`.
2. Run frontend tests: `npm test` inside frontend.
3. Verify building frontend: `npm run build` inside frontend.
4. Final manual review against acceptance criteria.
