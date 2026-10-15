# Design Spec: Customer & Supplier Management

- **Date**: 2026-10-15
- **Topic**: Customer & Supplier Management Modal Dialog (`+ New Item` Menu Integration)
- **Target Aesthetic**: MATRIX clean industrial design system (100% native micro-SVG stroke icons, zero emojis/emoticons, high contrast, clean typography, responsive layout, matching `control-table.tsx`)

---

## 1. Overview & Requirements

1. **Trigger / Access Point**:
   - Integrated into the existing **`+ New Item`** menu button on the main dashboard (`frontend/components/new-item-menu.tsx`).
   - Accessible only to users with the `controller` role.
   - Menu list hierarchy:
     1. New Project
     2. New JO
     3. *(divider)*
     4. New Data
     5. **Customer & Supplier** *(new option)*
   - Clicking this option opens the **Customer & Supplier Management Dialog**.

2. **Modal Dialog Window**:
   - Built using the project's native `Dialog` modal component (`frontend/components/dialog.tsx`).
   - Width: ~640px to 720px (comfortable modal table layout).
   - Header: Title **"Customer & Supplier"** and native close button (`✕`).

3. **Tabs Structure (3 Tabs)**:
   - Three filter tabs at the top of the modal content:
     1. **Customer** (`type: 'customer'`)
     2. **Supp PO** (`type: 'supplier_po'`)
     3. **Supp SC** (`type: 'supplier_subcont'`)
   - Switching tabs switches the displayed partner list and scopes the Add Bar to the selected type.

4. **Inline Add Bar (Option 1 - Fast Entry)**:
   - Placed directly above the table in each tab.
   - Structure:
     - Input text field: Placeholder e.g. *"Tambah nama customer baru..."* / *"Tambah supplier baru..."*.
     - Button: Styled with project standard `.btn.btn-primary.btn-sm`, containing native plus SVG icon and text `"+ Add"`.
   - Behavior:
     - Pressing `Enter` or clicking `+ Add` immediately submits the partner to the backend with default status `active`.
     - Automatically trims whitespace and validates non-empty name.

5. **3-Column Table Layout**:
   - **Column 1: Nama**:
     - Displays company/vendor name in clean tabular typography.
     - When editing, turns into an inline input field or editable row.
   - **Column 2: Status**:
     - Interactive badge with cursor pointer to toggle between:
       - **Active**: Background `var(--color-status-done-bg)`, color `var(--color-status-done)`.
       - **Discontinued**: Background `var(--color-status-na-bg)`, color `var(--color-text-muted)`.
     - Clicking the badge toggles status immediately via API.
   - **Column 3: Action**:
     - Micro-SVG action buttons using `className="btn-icon"` matching `control-table.tsx`:
       - **Edit** button: Native micro-SVG pencil icon. Enables inline name editing with Save (`✓`) / Cancel (`✕`) actions.
       - **Delete** button: Native micro-SVG trash icon. Prompts confirmation and removes the partner.

6. **Iconography & Design System Rules**:
   - **Strict Rule**: Zero emoji or emoticon characters in UI (no ✏️, 🗑️, ➕, etc.).
   - Strictly use inline SVG stroke icons identical to `control-table.tsx` (`stroke="currentColor"`, `strokeWidth="2"`, `strokeLinecap="round"`, `strokeLinejoin="round"`).

---

## 2. Technical Architecture & Data Model

### Backend (Laravel 13 / PHP 8.3 / PostgreSQL)

1. **Migration (`backend/database/migrations/2026_10_15_000001_create_partners_table.php`)**:
   - `id`: UUID Primary Key
   - `name`: string
   - `type`: string (`customer`, `supplier_po`, `supplier_subcont`)
   - `status`: string (`active`, `discontinued`), default: `'active'`
   - `timestamps`
   - Indexes:
     - `$table->index('name');`
     - `$table->index(['type', 'status']);`

2. **Model (`backend/app/Models/Partner.php`)**:
   - Uses `HasUuids` trait.
   - Fillable: `['name', 'type', 'status']`.
   - Scopes: `scopeActive($query)`, `scopeOfType($query, $type)`.

3. **Seeder (`backend/database/seeders/PartnerSeeder.php`)**:
   - Migrates existing hardcoded default lists with `status: 'active'`:
     - 79 customers from `DEFAULT_CUSTOMERS`.
     - 7 PO suppliers from `PO_SUPPLIERS`.
     - 8 SC suppliers from `SUBCONT_SUPPLIERS`.
   - Registered in `DatabaseSeeder.php`.

4. **REST API Routes (`backend/routes/api.php`)**:
   - Authenticated (`auth:sanctum`):
     - `GET /api/partners`: Returns list of partners (supports query params `?type=` and `?status=`).
   - Role Controller (`middleware('role.controller')`):
     - `POST /api/partners`: Creates a new partner (`name`, `type`, `status`).
     - `PUT /api/partners/{partner}`: Updates name and/or status.
     - `DELETE /api/partners/{partner}`: Deletes a partner.

---

### Frontend (Next.js 16 / React 19 / TypeScript)

1. **Types (`frontend/lib/types.ts`)**:
   - Partner types definition:
     ```ts
     export type PartnerType = "customer" | "supplier_po" | "supplier_subcont";
     export type PartnerStatus = "active" | "discontinued";

     export interface Partner {
       id: string;
       name: string;
       type: PartnerType;
       status: PartnerStatus;
       createdAt?: string;
       updatedAt?: string;
     }
     ```

2. **API Client (`frontend/lib/api-client.ts`)**:
   - `api.getPartners(type?: PartnerType, status?: PartnerStatus): Promise<Partner[]>`
   - `api.createPartner(data: { name: string; type: PartnerType; status?: PartnerStatus }): Promise<Partner>`
   - `api.updatePartner(id: string, data: Partial<Pick<Partner, 'name' | 'status'>>): Promise<Partner>`
   - `api.deletePartner(id: string): Promise<void>`

3. **Dialog Component (`frontend/components/partner-management-dialog.tsx`)**:
   - Renders the modal with the 3 tabs (`customer`, `supplier_po`, `supplier_subcont`).
   - Inline add input + `.btn .btn-primary .btn-sm` with SVG plus icon.
   - Table rendering Name, Status badge (toggleable), and `btn-icon` actions (SVG pencil for edit, SVG trash for delete).
   - Optimistic UI updates with instant local feedback and error rollback.

4. **Menu Integration (`frontend/components/new-item-menu.tsx` & `frontend/app/page.tsx`)**:
   - Add `onManagePartners: () => void` prop to `NewItemMenu`.
   - Render "Customer & Supplier" option in dropdown menu.
   - `page.tsx` manages `partnerDialogOpen` state and renders `<PartnerManagementDialog open={partnerDialogOpen} onClose={() => setPartnerDialogOpen(false)} />`.

5. **Dynamic Dropdowns Integration**:
   - `CustomerCombobox` (`frontend/components/customer-combobox.tsx`):
     - Fetches active customers from partners API on mount.
     - Falls back gracefully to `DEFAULT_CUSTOMERS` if network fails or while loading.
   - `PO Tracker` (`frontend/app/po-tracker/page.tsx`):
     - Dynamically loads active `supplier_po` options.
   - `Subcont Tracker` (`frontend/app/subcont/page.tsx`):
     - Dynamically loads active `supplier_subcont` options.

---

## 3. Verification & Acceptance Criteria

1. **Backend Tests**:
   - Controller can create, read, update, and delete partners.
   - Viewer role can read partners but receives 403 on create, update, or delete.
   - Validation rejects empty names or invalid types/statuses.
2. **Frontend Quality**:
   - Zero emojis used anywhere in the UI.
   - Modal matches the MATRIX design language, dark/light theme variables, and border tokens.
   - Switching tabs displays the respective list smoothly.
   - Status toggle works seamlessly between `Active` and `Discontinued`.
   - Edit inline updates the name without layout shift.
   - Deleting a partner removes it with confirmation.
