# Plan: "Tambah Item" button + "Riwayat Done" pages for PO Tracker & Subcont (SC) Tracker

Date: 2026-09-30
Put this file at: `docs/superpowers/plans/2026-09-30-tracker-add-item-and-done-pages.md`
Audience: an implementing agent (smaller model). Follow the steps **in order**. Do not skip the "Done when" checks.

---

## 0. Ground rules (from `AGENTS/AGENTS.md`)

- Stack is fixed: Next.js + Laravel + PostgreSQL. **No new dependencies.** No new backend framework or ORM.
- Follow existing conventions. Reuse existing patterns. **Do not rewrite working code** unless a step says so.
- Do not touch `AddDataDialog` behaviour. Its `ManualItemForm` usage must keep working exactly as today.
- Only report things you actually ran and saw pass. If you could not run something, say so.
- UI copy: the app mixes Indonesian and English. Use the strings given in this plan.
- `php artisan migrate:fresh` wipes the DB. Run it only against a dev/test database.

---

## 1. Goal

1. **PO Tracker** (`/po-tracker`) and **Subcont Tracker** (`/subcont`) each get a **"+ Tambah Item"** button (controller role only).
2. The button opens a dialog with the **same form as the existing manual item form** (`ManualItemForm`), plus **one new row at the very top: a searchable JO dropdown. The JO is optional.**
3. Items that are **Done** leave the main list and appear on a dedicated page per tracker:
   - `/po-tracker/done`
   - `/subcont/done`

---

## 2. What the code does today (verified by reading it)

Read this section before coding. It explains why the design below looks the way it does.

### 2.1 Data model
`Project → JO → Category → Item → Control (→ PoTracking, ProcessPhoto)`.

DB constraints that matter:
- `items.category_id` is **NOT NULL** (FK to `categories`).
- `categories.jo_id` is **NOT NULL**. `jos.project_id` is **NOT NULL**. `jos.jo_number` is **UNIQUE**.
- `activities.jo_id` is **NOT NULL**.

**Consequence:** an item cannot exist without a JO today. The requirement "JO is optional" therefore needs a design decision (see D1).

### 2.2 Both trackers are *views* over existing items
- PO rows: `collectPoTrackingRows()` in `frontend/lib/po-tracking.ts`. One row per control whose process is `Material` (Part categories) or `PO` (Component categories). Row `status` is derived: `Problem` if the control or its `Arrival` control is Problem; `Done` if either is Done; otherwise `In Progress`.
- Subcont rows: inline in `frontend/app/subcont/page.tsx`. One row per item with `item.isSubcont === true`.
- Both pages read from the store (`useAppState().projects`), **not** from `/trackers/po` or `/trackers/subcont`. (`api-client.ts` defines `getPoTracker`/`getSubcontTracker`, but no page uses them. Do not use them.)

### 2.3 "Done" handling today
- **PO page**: Done rows stay in the main list forever. `stats.done` is computed but never displayed.
- **Subcont page**: Done items stay for 5 minutes (`FIVE_MINUTES_MS`, uses `item.subcontDoneAt`), then are hidden from the page and **not shown anywhere else**. A Done item with no `subcontDoneAt` is never hidden.

### 2.4 Store and sync
- `frontend/lib/store.tsx` (~2300 lines) = reducer + `StoreProvider` that mirrors some actions to the API.
- `ADD_ITEM` is optimistic (temp id, then `SYNC_ITEM`). `SET_PROJECTS` replaces all projects from the server. Projects are cached in `localStorage` under `matrix_projects_cache`.
- Reducer cases are keyed by `projectId/joId/categoryId/itemId` and call `addActivity(jo!, ...)`, which needs a real JO.

### 2.5 Backend
- Mutating routes sit inside `Route::middleware('role.controller')` in `backend/routes/api.php`.
- `ItemController@store` validates only `id,no,description,dimension,material,qty,hrc`. It creates the item plus controls (`Part` → 7 processes, `Component` → `PO`,`Arrival`; `Material`/`PO`/`Arrival` start `Not Started`, others `-`).
- `ProjectController@index` eager-loads `jos.categories.items.controls.poTracking` etc. `ProjectResource` returns `id,name,customer,company,jos`.
- Tests: `backend/tests/Feature/ApiTest.php` (uses `RefreshDatabase`, creates a controller and a viewer user with Sanctum tokens).

### 2.6 Side finding (do NOT fix in this task, just note in your final report)
`ManualItemForm` has a "Subcont" checkbox, but `ItemController@store` and `api.addItem` only handle 6 fields, so subcont data entered in the normal Add Data dialog may not be persisted. Not our scope. Our new endpoint (Step 2) persists subcont fields properly.

---

## 3. Design decisions (already made; do not re-open)

### D1. How an item can exist "without a JO"
Use a **hidden system placeholder** created lazily by the backend:

```
Project  "Tanpa JO"   (projects.is_system = true, customer "-")
  └─ JO  "TANPA-JO"   (jo_number constant, type "MACHINING SERVICE", product "Item tanpa JO")
       ├─ Category "PART"      (kind Part)
       └─ Category "COMPONENT" (kind Component)
```

Why: it respects every NOT NULL constraint, the activity log and the id-keyed reducer, and keeps the two tracker pages working with **zero changes to their row types**. Rejected alternative: nullable `items.category_id` (would touch every row type, every `Link` to a JO, every reducer case, and the notification bell).

Consequences that this plan handles:
- The system project must be **hidden** from the dashboard, "New Data", "New JO" and the JO picker.
- It must be **undeletable** (deleting the project/JO would cascade-delete all untracked items).
- Tracker rows show **"Tanpa JO"** (plain text, no link) instead of a JO link.

### D2. What the dialog asks
- Top row: `JO (opsional)` searchable dropdown.
- **JO chosen** → a required `Kategori` select appears (categories of that JO, first one preselected). The category decides Part vs Component.
- **No JO chosen** → PO dialog shows a `Jenis` toggle: `Part (PO Mtl)` / `Component (PO)`, default Part. Subcont dialog has no toggle (kind = Part).
- Below that: the existing form fields.

### D3. Form differences per tracker (via a new `mode` prop on `ManualItemForm`)
- `mode="default"` (current behaviour, used by `AddDataDialog`): unchanged.
- `mode="po"`: hide the Subcont checkbox and "Keterangan Subcont"; **always** show `Target Arrival`.
- `mode="subcont"`: hide the checkbox (treated as on); **always** show `Keterangan Subcont` and `Target Arrival`.

### D4. Definition of "Done" and the 5-minute grace
- **Subcont**: archived = `isSubcont && subcontStatus === "Done" && (no subcontDoneAt || older than 5 min)`. Everything archived moves to `/subcont/done`. (This also fixes the "Done with no `subcontDoneAt` stays forever" quirk.)
- **PO**: archived = `row.status === "Done"`, **except** rows the user marked Done *in this browser session* in the last 5 minutes (tracked in page state, so a mis-click can be corrected). On page load, every Done row is archived immediately. No DB change needed.
- The Done pages list **all** Done items (no time filter).
- The Done pages have a **"Kembalikan"** (reopen) button for controllers.

### D5. Creating the item
The dialog **awaits** a new API call `POST /api/trackers/items`. On success it dispatches a new pure reducer action `INSERT_TRACKER_ITEM` with the server response. No optimistic temp ids (they break follow-up calls).

---

## 4. Files overview

**Backend (new):**
- `backend/database/migrations/2026_09_30_000001_add_is_system_to_projects_table.php`
- `backend/app/Services/TrackerItemService.php`
- `backend/app/Http/Controllers/Api/TrackerItemController.php`
- `backend/tests/Feature/TrackerItemTest.php`

**Backend (edit):** `app/Models/Project.php`, `app/Http/Resources/ProjectResource.php`, `routes/api.php`, `ProjectController.php` (destroy guard), `JOController.php` (destroy guard).

**Frontend (new):**
- `lib/subcont-tracking.ts` (+ `lib/subcont-tracking.test.ts`)
- `lib/tracker-items.ts` (+ `lib/tracker-items.test.ts`)
- `components/jo-picker.tsx` (+ `components/jo-picker.test.tsx`)
- `components/tracker-add-item-dialog.tsx` (+ `components/tracker-add-item-dialog.test.tsx`)
- `app/po-tracker/done/page.tsx`
- `app/subcont/done/page.tsx`

**Frontend (edit):** `lib/types.ts`, `lib/api-client.ts`, `lib/store.tsx` (+ `lib/store.test.ts`), `lib/po-tracking.ts` (+ test), `components/manual-item-form.tsx`, `app/po-tracker/page.tsx`, `app/subcont/page.tsx`, `app/page.tsx`, `components/new-data-dialog.tsx`, `components/jo-create-dialog.tsx`, `components/app-shell.tsx`, `app/projects/[projectId]/jos/[joId]/page.tsx`.

---

## 5. Step-by-step

### STEP 1 — Backend: mark the system project

1. Create migration `2026_09_30_000001_add_is_system_to_projects_table.php`, same style as `2026_09_07_000001_add_company_to_projects_table.php`:
   ```php
   Schema::table('projects', function (Blueprint $table) {
       $table->boolean('is_system')->default(false)->after('company');
       $table->index('is_system');
   });
   // down(): dropIndex(['is_system']); dropColumn('is_system');
   ```
2. `app/Models/Project.php`: add `'is_system'` to `$fillable`; add a `casts()` method returning `['is_system' => 'boolean']` (the model has no `casts()` yet; copy the style used in `JO.php`).
3. `app/Http/Resources/ProjectResource.php`: add `'isSystem' => (bool) $this->is_system,`.
4. Guards (open both controllers and look at `destroy`):
   - `ProjectController::destroy`: at the top, if `$project->is_system` return `response()->json(['message' => 'System project cannot be deleted.'], 422)`.
   - `JOController::destroy`: if `$jo->project?->is_system` (or `$jo->jo_number === TrackerItemService::UNASSIGNED_JO_NUMBER`) return the same 422.

**Done when:** `php artisan migrate` succeeds on a dev DB and `GET /api/projects` includes `"isSystem": false` for existing projects.

---

### STEP 2 — Backend: create-item-for-tracker endpoint

**2a. `app/Services/TrackerItemService.php`**

```php
namespace App\Services;

use App\Models\{Category, Control, Item, JO, Project};

class TrackerItemService
{
    public const UNASSIGNED_JO_NUMBER = 'TANPA-JO';
    private const PART_PROCESSES = ['Material','Arrival','Machining','Hardening','Grinding','Wirecut','Assembly'];
    private const COMPONENT_PROCESSES = ['PO','Arrival'];

    /** Find-or-create the hidden "Tanpa JO" project → JO → category for the given kind. */
    public function unassignedCategory(string $kind): Category
    {
        $project = Project::firstOrCreate(
            ['is_system' => true],
            ['name' => 'Tanpa JO', 'customer' => '-', 'company' => 'BKP']
        );
        $jo = JO::firstOrCreate(
            ['jo_number' => self::UNASSIGNED_JO_NUMBER],
            ['project_id' => $project->id, 'product' => 'Item tanpa JO', 'type' => 'MACHINING SERVICE']
        );
        return Category::firstOrCreate(
            ['jo_id' => $jo->id, 'label' => strtoupper($kind)],
            ['kind' => $kind, 'is_custom' => false, 'sort_order' => $kind === 'Part' ? 0 : 1]
        );
    }

    /** Create the item and its default controls (same rules as ItemController). */
    public function createItem(Category $category, array $data): Item
    {
        $maxOrder = $category->items()->max('sort_order') ?? 0;
        $payload = [
            'no' => $data['no'] ?? '-',
            'description' => $data['description'],
            'dimension' => $data['dimension'] ?? '',
            'material' => $data['material'] ?? '',
            'qty' => $data['qty'] ?? 1,
            'hrc' => $data['hrc'] ?? '',
            'sort_order' => $maxOrder + 1,
        ];
        if (!empty($data['id'])) { $payload['id'] = $data['id']; }
        $item = $category->items()->create($payload);

        $processes = $category->kind === 'Part' ? self::PART_PROCESSES : self::COMPONENT_PROCESSES;
        foreach ($processes as $proc) {
            Control::create([
                'item_id' => $item->id,
                'process' => $proc,
                'status' => in_array($proc, ['Material','PO','Arrival'], true) ? 'Not Started' : '-',
                'notes' => '',
            ]);
        }
        return $item;
    }
}
```
Leave `ItemController` untouched (it keeps its own private copy; a later refactor can merge them. Add a one-line `// TODO` in the service saying so).

**2b. `app/Http/Controllers/Api/TrackerItemController.php`** — `store(Request $request, TrackerItemService $service): JsonResponse`

Validation (inline, like `ItemController`):
```php
'tracker'         => ['required','in:po,subcont'],
'categoryId'      => ['nullable','uuid','exists:categories,id'],
'kind'            => ['nullable','in:Part,Component'],
'id'              => ['nullable','uuid'],
'no'              => ['nullable','string','max:50'],
'description'     => ['required','string','max:255'],
'dimension'       => ['nullable','string','max:100'],
'material'        => ['nullable','string','max:100'],
'qty'             => ['nullable','integer','min:1'],
'hrc'             => ['nullable','string','max:50'],
'targetArrival'   => ['nullable','date'],
'subcontNotes'    => ['nullable','string'],
```

Logic inside one `DB::transaction`:
1. `$category = categoryId ? Category::findOrFail(categoryId) : $service->unassignedCategory($kind ?? 'Part')`.
   - For `tracker=subcont` with no category, kind is always `Part`.
2. `$item = $service->createItem($category, $validated)`.
3. **If `tracker === 'po'` and `targetArrival` is given:**
   - primary control = the item's control with process `Material` (Part) or `PO` (Component).
   - set `target_date` on the primary control **and** on the `Arrival` control.
   - `PoTracking::create(['control_id' => $primary->id, 'target_arrival' => $targetArrival])`.
   - Do **not** change any control status (the frontend derives "In Progress" for the tracker row).
4. **If `tracker === 'subcont'`:** `$item->update(['is_subcont' => true, 'subcont_status' => 'In Progress', 'subcont_dispatch_date' => now(), 'subcont_notes' => $subcontNotes, 'arrival_target_date' => $targetArrival])`.
5. `Activity::create(['jo_id' => $category->jo_id, 'message' => "Item \"{$item->description}\" added via " . ($tracker === 'po' ? 'PO Tracker.' : 'Subcont Tracker.')])`.
6. Reload `$item->load(['controls.poTracking','controls.photos'])`.

Response `201`:
```json
{ "data": { "project": {...}, "jo": {...}, "category": {...}, "item": {...} },
  "message": "Item added to tracker." }
```
Build each part with the existing resources so the JSON is camelCase exactly like `GET /projects`: `new ProjectResource($category->jo->project)`, `new JOResource($category->jo)`, `new CategoryResource($category)`, `new ItemResource($item)`.
**Before doing this, open `JOResource`, `CategoryResource`, `ItemResource` and confirm they use `whenLoaded(...)` for relations** (so not-loaded relations are simply omitted). If one of them forces a relation, load it or build a small array for that part instead.

**2c. Route** in `routes/api.php`, inside the existing `role.controller` group, next to the other mutating routes (add the `use` import at the top):
```php
Route::post('/trackers/items', [TrackerItemController::class, 'store']);
```

**Done when:** manual `curl`/test shows 201 for a JO-less request and the system project/JO/category are created once and reused on the second call.

---

### STEP 3 — Backend tests

Create `backend/tests/Feature/TrackerItemTest.php`. Copy the `setUp()` pattern from `ApiTest.php` (controller + viewer users, tokens, `RefreshDatabase`). Use `withHeader('Authorization', 'Bearer '.$token)`.

Cases (one test method each):
1. **PO item into an existing Part category** → 201; item has 7 controls; category id unchanged; with `targetArrival` a `po_trackings` row exists and `Arrival`/`Material` `target_date` are set.
2. **PO item, no JO, `kind=Component`** → 201; exactly 1 project with `is_system=true`, 1 JO `TANPA-JO`, category label `COMPONENT`; item has 2 controls (`PO`,`Arrival`).
3. **Second JO-less call reuses the same system rows** (counts still 1).
4. **Subcont item, no JO** → `is_subcont` true, `subcont_status` `In Progress`, `subcont_dispatch_date` not null, `arrival_target_date` set, category label `PART`.
5. **Viewer token → 403**; **no token → 401**.
6. **Validation → 422**: missing `description`; `tracker` not in `po,subcont`; `categoryId` not existing.
7. `GET /api/projects` returns the system project with `isSystem: true`.
8. `DELETE /api/projects/{systemProject}` → 422; `DELETE /api/jos/{systemJo}` → 422.

Run: `cd backend && php artisan test --filter=TrackerItemTest`, then the full `php artisan test`.

**Done when:** new tests pass and no previously passing test fails.

---

### STEP 4 — Frontend: types, API client, pure helpers

1. `lib/types.ts`: add `isSystem?: boolean;` to the `Project` interface (open the file and find it).
2. `lib/api-client.ts`: add next to `addItem`:
   ```ts
   async createTrackerItem(payload: {
     tracker: "po" | "subcont";
     categoryId?: string;
     kind?: CategoryKind;
     no?: string; description: string; dimension?: string; material?: string;
     qty?: number; hrc?: string;
     targetArrival?: string; subcontNotes?: string;
   }): Promise<{ data: { project: Project; jo: JO; category: Category; item: Item }; message: string }> {
     return request(`/trackers/items`, { method: "POST", body: JSON.stringify(payload) });
   }
   ```
3. New `lib/tracker-items.ts`:
   ```ts
   import type { Project } from "./types";
   export const UNASSIGNED_JO_LABEL = "Tanpa JO";
   /** Hide the system placeholder project from normal project/JO UIs. */
   export function visibleProjects(projects: Project[]): Project[] {
     return projects.filter((p) => !p.isSystem);
   }
   ```
4. New `lib/subcont-tracking.ts` — **extract** (do not reinvent) from `app/subcont/page.tsx`:
   - `export interface SubcontRow { project; jo; category; item; arrivalControl?; originalIndex }` (copy the existing interface).
   - `export const FIVE_MINUTES_MS = 5 * 60 * 1000;`
   - `export function collectSubcontRows(projects: Project[]): SubcontRow[]` (move the loop that builds `rawSubcontRows`).
   - ```ts
     export function isSubcontArchived(item: Item, now: number): boolean {
       if (item.subcontStatus !== "Done") return false;
       if (!item.subcontDoneAt) return true;
       return now - new Date(item.subcontDoneAt).getTime() > FIVE_MINUTES_MS;
     }
     ```
   - In `app/subcont/page.tsx`: delete the inline `SubcontRow` interface, the `FIVE_MINUTES_MS` constant and the `rawSubcontRows` loop; import them from the lib. Replace "Filter 1" with `!isSubcontArchived(row.item, currentTime)`. **Change nothing else in that file in this step.**
5. `lib/po-tracking.ts`: add
   ```ts
   export const PO_DONE_GRACE_MS = 5 * 60 * 1000;
   export function poRowKey(row: PoTrackingRow): string { return `${row.item.id}-${row.process}`; }
   /** Done rows are archived unless the user marked them Done moments ago in this session. */
   export function isPoRowArchived(row: PoTrackingRow, recentlyDone: Record<string, number>, now: number): boolean {
     if (row.status !== "Done") return false;
     const t = recentlyDone[poRowKey(row)];
     return !(t !== undefined && now - t <= PO_DONE_GRACE_MS);
   }
   ```
6. Tests (Vitest, same style as `lib/po-tracking.test.ts`):
   - `subcont-tracking.test.ts`: `isSubcontArchived` for (Done + 1 min ago → false), (Done + 10 min ago → true), (Done + no `subcontDoneAt` → true), (In Progress → false); `collectSubcontRows` returns only `isSubcont` items.
   - add to `po-tracking.test.ts`: `isPoRowArchived` for (Done, not in map → true), (Done, in map 1 min ago → false), (Done, in map 6 min ago → true), (In Progress → false).
   - `tracker-items.test.ts`: `visibleProjects` drops `isSystem` projects.

**Done when:** `cd frontend && npm run typecheck && npm run test` pass.

---

### STEP 5 — Frontend: store action `INSERT_TRACKER_ITEM`

In `lib/store.tsx`:
1. Add to the `AppAction` union:
   ```ts
   | {
       type: "INSERT_TRACKER_ITEM";
       project: Pick<Project, "id" | "name" | "customer" | "company" | "isSystem">;
       jo: Pick<JO, "id" | "joNumber" | "product" | "type">;
       category: Pick<Category, "id" | "label" | "kind" | "isCustom">;
       item: Item;
     }
   ```
   (Open `types.ts` first to confirm the exact `Project`/`JO`/`Category` field names and which are required.)
2. Add a reducer case in `executeReducer` (follow the mutate-`next`-and-return-`next` style of the neighbours). Look at `case "CREATE_JO"` (~line 672) and copy how it builds a JO object (default `categories: []`, `activities: []`, etc.):
   - find project by id, else push `{ ...action.project, jos: [] }`;
   - find JO by id in it, else push a new JO built like `CREATE_JO` does;
   - find category by id in it, else push `{ ...action.category, items: [] }`;
   - if no item with `action.item.id` exists there, push `{ ...action.item, controls: action.item.controls ?? [] }` (**idempotent**).
   - Do **not** call `addActivity` (the server already logged it).
3. In `StoreProvider`'s persistence `switch (action.type)` (~line 1700+): make sure **no case** exists for `INSERT_TRACKER_ITEM` (it must not hit the API again). If that switch is exhaustive-checked by TypeScript, add an empty `case "INSERT_TRACKER_ITEM": break;`.
4. Tests in `lib/store.test.ts` (mirror an existing reducer test there): (a) inserting into an existing project/JO/category adds one item; (b) inserting the same action twice still yields one item; (c) inserting with unknown project/JO/category creates the containers.

**Done when:** `npm run typecheck && npm run test` pass.

---

### STEP 6 — Frontend: `ManualItemForm` modes

Edit `components/manual-item-form.tsx` only:
1. Add prop `mode?: "default" | "po" | "subcont"` (default `"default"`).
2. `mode === "default"`: render exactly as today (checkbox id `manual-subcont` stays).
3. `mode === "po"`: do not render the Subcont checkbox block. Render only the `Target Arrival` date input (same markup as the existing one), always visible.
4. `mode === "subcont"`: do not render the checkbox block. Always render `Keterangan Subcont` textarea and `Target Arrival` date input.
5. Do not change `ManualItemData`, `emptyManualItemData()`, or the Enter-to-submit behaviour.

**Done when:** the existing Add Data flow still shows the checkbox and behaves as before (open `AddDataDialog` mentally: it passes no `mode`, so nothing changes). Typecheck passes.

---

### STEP 7 — Frontend: `JoPicker` component

New `components/jo-picker.tsx`. **Copy the structure of `components/customer-combobox.tsx`** (portal-rendered listbox, keyboard navigation, click-outside, `useId`, ARIA roles). Do not invent a new pattern. Read `components/customer-combobox.test.tsx` and mirror it for the test.

Props:
```ts
interface JoPickerProps {
  projects: Project[];          // pass already-filtered (visibleProjects) list
  value: string;                // selected joId, "" = none
  onChange: (joId: string) => void;
  placeholder?: string;         // default "Cari nomor JO / produk / project..."
  disabled?: boolean;
  id?: string;
}
```
Behaviour:
- Flatten `projects → jos` into options. Option label: `JO {joNumber} — {product}`; secondary line: `{project.name} · {project.customer}`.
- Typing filters (case-insensitive `includes`) on `joNumber`, `product`, `project.name`, `project.customer`. Show at most 50 matches; if more, show a muted line "Persempit pencarian…".
- Empty query on focus shows the first 50 options.
- When a JO is selected, the input shows `JO {joNumber}` and a small "✕" clear button appears (calls `onChange("")`). **Clearing must be possible — the field is optional.**
- Keys: ArrowUp/ArrowDown move, Enter selects, Escape closes. **When the list is open, Enter must `preventDefault` + `stopPropagation`** so it does not submit the dialog.
- Empty result: show "JO tidak ditemukan".

Tests (`jo-picker.test.tsx`): renders options; typing filters by JO number; typing filters by product; selecting calls `onChange(joId)`; clear button calls `onChange("")`; keyboard select works.

**Done when:** `npm run test` passes for the new file.

---

### STEP 8 — Frontend: `TrackerAddItemDialog`

New `components/tracker-add-item-dialog.tsx`, built on the existing `Dialog` (`components/dialog.tsx`; props: `open,onClose,title,children,footer,className,maxWidth,panelStyle`).

Props: `{ open: boolean; onClose: () => void; tracker: "po" | "subcont" }`

State: `joId` (""), `categoryId` (""), `kind` ("Part"), `formData` (`emptyManualItemData()`), `error`, `submitError`, `submitting`.

Derived:
- `projects = visibleProjects(useAppState().projects)`
- `selectedJo` = the JO with id `joId` (search all projects)
- `categories = selectedJo?.categories ?? []`
- When `joId` changes: set `categoryId` to `categories[0]?.id ?? ""`. When cleared: `categoryId = ""`.

Layout (top to bottom):
1. **Row: label `JO (opsional)` + `<JoPicker />`**. Small muted hint under it: "Kosongkan jika item belum punya JO."
2. If `joId`: a `Kategori` `<select className="select">` listing `selectedJo.categories` (`label · kind`). Required.
   If no `joId` and `tracker === "po"`: a two-button toggle `Part (PO Mtl)` / `Component (PO)` bound to `kind` (reuse `btn btn-sm btn-primary/btn-secondary` like the group buttons on the tracker pages).
3. `<ManualItemForm mode={tracker} data={formData} onChange={setFormData} error={error} onClearError={...} onSubmit={handleSubmit} autoFocusDescription />`.
   The `JoPicker` and category row are **outside** the `ManualItemForm` wrapper, so its Enter-to-submit does not fire from them.

Footer: `Batal` (`btn btn-secondary`) and `Tambah Item` (`btn btn-primary`, `disabled={submitting}`, label "Menyimpan..." while submitting).

`handleSubmit`:
1. If `!formData.description.trim()` → `setError("Description is required.")`; return.
2. If `joId && !categoryId` → `setSubmitError("Pilih kategori.")`; return.
3. `setSubmitting(true)`; `await api.createTrackerItem({ tracker, categoryId: joId ? categoryId : undefined, kind: joId ? undefined : (tracker === "po" ? kind : "Part"), no: formData.no.trim() || "-", description: formData.description.trim(), dimension, material, qty: Math.max(1, formData.qty || 1), hrc, targetArrival: formData.arrivalTargetDate || undefined, subcontNotes: tracker === "subcont" ? formData.subcontNotes.trim() || undefined : undefined })`.
4. On success: `dispatch({ type: "INSERT_TRACKER_ITEM", ...res.data })`, reset state, `onClose()`.
5. On error: `setSubmitError(err?.message || "Gagal menambah item.")`, keep the dialog open, keep the form data. Show `submitError` in a red text block using the same style as `extractionNotice` in `add-data-dialog.tsx`.
6. `finally { setSubmitting(false) }`.
7. Guard against double submit: return early if `submitting` (there is a known double-submit usability test, see `.context/ui-test-screenshots/USABILITY-A3-double-submit.png`).

Reset all state when the dialog closes (same idea as `reset()` in `add-data-dialog.tsx`).

Tests (`tracker-add-item-dialog.test.tsx`; mock `@/lib/api-client` and wrap with the store provider or mock `useAppState`/`useAppDispatch` the way `project-create-dialog.test.tsx` / `jo-create-dialog.test.tsx` do — open one of them first and copy its setup):
- submitting with empty description shows the error and does **not** call the API;
- submitting with **no JO** calls `createTrackerItem` with `categoryId: undefined` and the right `kind`;
- choosing a JO shows the category select and the request carries `categoryId`;
- PO tracker with no JO shows the Part/Component toggle; subcont does not;
- API rejection keeps the dialog open and shows the message;
- a double click on "Tambah Item" calls the API once.

**Done when:** `npm run typecheck && npm run test` pass.

---

### STEP 9 — Frontend: wire the button + archive logic into the PO page

Edit `app/po-tracker/page.tsx`:
1. Imports: `TrackerAddItemDialog`, `isPoRowArchived`, `poRowKey`.
2. **Replace** the local `getRowKey` with `poRowKey` (same string format, so `selectedKeys` keep working).
3. New state:
   ```ts
   const [isAddOpen, setIsAddOpen] = useState(false);
   const [recentlyDone, setRecentlyDone] = useState<Record<string, number>>({});
   const [now, setNow] = useState(() => Date.now());
   useEffect(() => { const t = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(t); }, []);
   ```
4. In `updateRow`, right before `dispatch(...)`: if `options.status === "Done"` set `recentlyDone[poRowKey(row)] = Date.now()`; else if `options.status !== undefined` delete that key.
5. `visibleRows` must be computed from **non-archived rows**:
   ```ts
   const activeRows = useMemo(() => rows.filter((r) => !isPoRowArchived(r, recentlyDone, now)), [rows, recentlyDone, now]);
   const visibleRows = useMemo(() => sortPoTrackingRows(filterPoTrackingRows(activeRows, searchQuery), sortMode), [activeRows, searchQuery, sortMode]);
   const doneCount = useMemo(() => rows.filter((r) => r.status === "Done").length, [rows]);
   ```
   Leave the `stats` block and KPI cards unchanged (they already treat Done as not active).
6. Bulk status handler: change `rows.filter((r) => selectedKeys.has(...))` to `activeRows.filter(...)` so archived rows are never touched.
7. Header: the top row currently contains only `<h1>PO Tracker</h1>`. Add a right-side group:
   ```tsx
   <div style={{ display: "flex", gap: 8 }}>
     <Link href="/po-tracker/done" className="btn btn-secondary">Riwayat Done ({doneCount})</Link>
     {isController && <button type="button" className="btn btn-primary" onClick={() => setIsAddOpen(true)}>+ Tambah Item</button>}
   </div>
   ```
8. Render `<TrackerAddItemDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} tracker="po" />` next to the other dialogs.
9. JO cell in `renderTable`: if `row.project.isSystem`, render `<span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{UNASSIGNED_JO_LABEL}</span>` instead of the `<Link>`.
10. Empty state text: "Belum ada PO aktif. Item yang sudah Done ada di Riwayat Done." when there is no search query.

**Done when:** typecheck passes; on the page a Done row no longer appears after reload; a row you just set to Done stays ~5 min, then disappears.

---

### STEP 10 — Frontend: wire the button into the Subcont page

Edit `app/subcont/page.tsx` (Step 4 already switched it to `isSubcontArchived`):
1. Import `TrackerAddItemDialog`, `UNASSIGNED_JO_LABEL`.
2. State `isAddOpen`. Add the same header button group as Step 9 (find the page's `<h1>` / title row and put it on the right). `doneCount = rawSubcontRows.filter(r => r.item.subcontStatus === "Done").length`. Link to `/subcont/done`.
3. Render `<TrackerAddItemDialog ... tracker="subcont" />`.
4. JO cell: same "Tanpa JO" plain-text rule for `row.project.isSystem`.
5. Optional nicety (only if trivial): after a successful add, `setHighlightedItemId(newItemId)`. Skip if it needs plumbing.

**Done when:** typecheck passes; a Done item older than 5 minutes is gone from `/subcont` (it will show on the Done page after Step 11).

---

### STEP 11 — Frontend: the two Done pages

Create `app/po-tracker/done/page.tsx` and `app/subcont/done/page.tsx`. Both `"use client"`, both wrapped in `AppShell` (open `components/app-shell.tsx` and check the `breadcrumbs` prop type; use `[{ label: "PO Tracker", href: "/po-tracker" }, { label: "Riwayat Done" }]` if `href` is supported, otherwise plain labels).

Common layout (reuse existing classes: `control-table`, `table-scroll`, `tracker-toolbar`, `card-static`, `kpi-grid`, `EmptyState`, `Dialog`):
- `<h1>Riwayat Done — PO</h1>` / `— Subcont`, and a `← Kembali ke PO Tracker` link.
- One KPI card: total Done.
- Toolbar: search input (`aria-label="Search done rows"`), sort select.
- Table (read-only). Empty state: "Belum ada item Done."

**PO done page**
- Rows: `collectPoTrackingRows(projects).filter(r => r.status === "Done")`.
- Search: `filterPoTrackingRows`.
- Sort options: `Terbaru (PO Date)` → `sortPoTrackingRows(..., "newest")`, `Terlama` → `"oldest"`, `JO` → `"jo"`.
- Columns: JO (link or "Tanpa JO"), Item, Qty, Supplier, No. PO, PO Date, Target Arrival, Catatan (view button opening a read-only `Dialog`, copy the viewer branch from `po-tracker/page.tsx`), Aksi.
- **Aksi → "Kembalikan"** (controller only). Dispatch the same `UPDATE_PO_TRACKING` shape that `updateRow` builds in `po-tracker/page.tsx`, with `status: "In Progress"`, `problemNotes: ""`, and `tracking` copied from the row (`supplier, poNo, poDate, targetArrival, notes`). Duplicate those ~12 lines here; do not import from the page. The reducer already flips a Done `Arrival` control back to `In Progress`.

**Subcont done page**
- Rows: `collectSubcontRows(projects).filter(r => r.item.subcontStatus === "Done")`.
- Search: same fields as the main subcont page (JO number, description, no, supplier, process).
- Sort options: `Terbaru Selesai` (by `subcontDoneAt` desc, missing last), `Terlama`, `JO`.
- Columns: JO, Item, Qty, Supplier, Proses (`item.subcontProcess`), Target Arrival, Selesai (formatted `subcontDoneAt`, "-" if missing), Catatan (`item.subcontNotes` in a read-only dialog), Aksi.
- **Aksi → "Kembalikan"** (controller only): dispatch `UPDATE_ITEM_SUBCONT` with `subcontStatus: "In Progress"`. **Open the `AppAction` union and copy the exact required fields** (the reducer reads `action.isSubcont`, so pass `isSubcont: true`). Look at how `app/subcont/page.tsx` dispatches a status change and mirror it.

Both pages: viewers can see them but do not see "Kembalikan". Use `useAuth()` (`isController`) like the main pages.

**Done when:** typecheck passes; marking an item Done, waiting out the grace period (or reloading for PO) makes it appear on the Done page, and "Kembalikan" brings it back to the main list.

---

### STEP 12 — Frontend: hide the placeholder project everywhere else

1. `app/page.tsx` (dashboard): wrap the `projects` used for project/JO cards, KPI counts and search with `visibleProjects(projects)`.
2. `components/new-data-dialog.tsx`: the project list in step 1 uses `visibleProjects(projects)`.
3. `components/jo-create-dialog.tsx`: wherever it lists existing projects to choose from, use `visibleProjects(projects)`.
4. `components/app-shell.tsx` notification builder (~lines 35-110): **keep** system-project items (they still need deadline alerts), but where the text says `JO ${jo.joNumber}` in `subText`, use `project.isSystem ? UNASSIGNED_JO_LABEL : \`JO ${jo.joNumber}\``. (Check that the loop has access to `project`; if it only has `jo`, use `jo.joNumber === "TANPA-JO"`.)
5. `app/projects/[projectId]/jos/[joId]/page.tsx`: if the resolved project has `isSystem`, render Next's `notFound()` (or the page's existing "not found" state).

**Done when:** the dashboard and the New Data / New JO dialogs never show "Tanpa JO"; the bell shows "Tanpa JO" for such items.

---

### STEP 13 — E2E (optional, needs a running backend + DB)

Extend `e2e/pages/po-tracker.page.ts` with `openAddItem()` (click button `+ Tambah Item`) and `gotoDone()`. Add `e2e/tracker-add-item.spec.ts`: login as controller → open PO tracker → add item without JO → row appears → set it Done → open `/po-tracker/done` → row is there. If you cannot run Playwright, say so in the report instead of claiming it passes.

---

## 6. Final verification (run all; report real results)

Backend (dev/test DB only):
```bash
cd backend
php artisan migrate:fresh --seed
php artisan test
```
Frontend:
```bash
cd frontend
npm run typecheck
npm run test
npm run lint
npm run build
```

Manual smoke test (controller login):
1. `/po-tracker` → "+ Tambah Item" → leave JO empty, choose Component, fill Description → item appears with "Tanpa JO".
2. Repeat, this time pick a JO via search, pick a category → the row links to that JO.
3. Set a row to Done → after 5 min (or reload) it is gone from the list and present in `/po-tracker/done`. "Kembalikan" returns it.
4. Same three checks on `/subcont` and `/subcont/done`. The subcont row's flag and notes survive a reload.
5. Log in as viewer → no "+ Tambah Item", no "Kembalikan".
6. Dashboard and New Data / New JO dialogs do not list "Tanpa JO".

---

## 7. Out of scope (do not do)

- Attaching an existing item to a tracker (this plan only *creates* new items).
- Assigning an untracked item to a JO later (moving between categories).
- Merging `ItemController`'s control-creation code with `TrackerItemService`.
- Fixing the subcont fields not being saved by the normal Add Data dialog (see 2.6).
- Adding a "done at" column for PO rows.
- Any change to the `/trackers/po` and `/trackers/subcont` backend read endpoints.

## 8. Final report template

List: files changed, each command from Section 6 with pass/fail as actually observed, anything you could not run, and any deviation from this plan with the reason.
