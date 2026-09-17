<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Control;
use App\Models\Item;
use App\Models\JO;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    private User $controller;
    private User $viewer;
    private string $controllerToken;
    private string $viewerToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->controller = User::create([
            'name' => 'Controller Test',
            'email' => 'controller@test.com',
            'password' => Hash::make('secret'),
            'role' => 'controller',
        ]);

        $this->viewer = User::create([
            'name' => 'Viewer Test',
            'email' => 'viewer@test.com',
            'password' => Hash::make('secret'),
            'role' => 'viewer',
        ]);

        $this->controllerToken = $this->controller->createToken('c-token')->plainTextToken;
        $this->viewerToken = $this->viewer->createToken('v-token')->plainTextToken;
    }

    public function test_controller_can_create_and_viewer_can_list_projects(): void
    {
        // 1. Controller creates project with company BKP
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/projects', [
                'name' => 'Test Project X',
                'customer' => 'Customer X',
                'company' => 'BKP',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Test Project X')
            ->assertJsonPath('data.company', 'BKP');

        // 2. Viewer can list projects
        $listResponse = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->getJson('/api/projects');

        $listResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.company', 'BKP');
    }

    public function test_viewer_cannot_create_project(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->postJson('/api/projects', [
                'name' => 'Forbidden Project',
                'customer' => 'Customer Y',
            ]);

        $response->assertStatus(403);
    }

    public function test_can_create_jo_with_categories_and_items(): void
    {
        $project = Project::create([
            'name' => 'Stamping Project',
            'customer' => 'Customer Z',
        ]);

        // Controller creates JO with categories
        $joResponse = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/projects/{$project->id}/jos", [
                'joNumber' => 'JO-999.001',
                'product' => 'Bracket Assembly',
                'type' => 'PROGRESSIVE',
                'targetDate' => '2026-11-01',
                'categories' => [
                    ['label' => 'PART DIES', 'kind' => 'Part', 'isCustom' => false],
                    ['label' => 'COMPONENTS', 'kind' => 'Component', 'isCustom' => false],
                ],
            ]);

        $joResponse->assertStatus(201)
            ->assertJsonPath('data.joNumber', 'JO-999.001')
            ->assertJsonCount(2, 'data.categories');

        $partCatId = $joResponse->json('data.categories.0.id');

        // Controller adds an item to PART DIES
        $itemResponse = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/categories/{$partCatId}/items", [
                'no' => '1',
                'description' => 'Top Plate',
                'dimension' => '500x400x50',
                'material' => 'S50C',
                'qty' => 1,
            ]);

        $itemResponse->assertStatus(201)
            ->assertJsonPath('data.description', 'Top Plate')
            ->assertJsonCount(7, 'data.controls'); // 7 default processes for Part
    }

    public function test_batch_store_items(): void
    {
        $project = Project::create(['name' => 'P', 'customer' => 'C']);
        $jo = $project->jos()->create(['jo_number' => 'JO-BATCH', 'product' => 'P', 'type' => 'PROGRESSIVE']);
        $cat = $jo->categories()->create(['label' => 'PARTS', 'kind' => 'Part']);

        $batchResponse = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/categories/{$cat->id}/items/batch", [
                'items' => [
                    ['no' => '1', 'description' => 'Item 1', 'dimension' => '10x10', 'material' => 'S50C', 'qty' => 1],
                    ['no' => '2', 'description' => 'Item 2', 'dimension' => '20x20', 'material' => 'SKD11', 'qty' => 2],
                ],
            ]);

        $batchResponse->assertStatus(201)
            ->assertJsonCount(2, 'data');
    }

    public function test_control_status_and_po_tracking_updates(): void
    {
        $project = Project::create(['name' => 'P', 'customer' => 'C']);
        $jo = $project->jos()->create(['jo_number' => 'JO-CTRL', 'product' => 'P', 'type' => 'PROGRESSIVE']);
        $cat = $jo->categories()->create(['label' => 'PARTS', 'kind' => 'Part']);
        $item = $cat->items()->create(['no' => '1', 'description' => 'Punch', 'material' => 'SKD11']);
        $ctrl = $item->controls()->create(['process' => 'Material', 'status' => 'Not Started']);

        // 1. Update status
        $statusResponse = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->patchJson("/api/controls/{$ctrl->id}/status", [
                'status' => 'In Progress',
                'notes' => 'PO sent to vendor',
            ]);

        $statusResponse->assertStatus(200)
            ->assertJsonPath('data.status', 'In Progress')
            ->assertJsonPath('data.notes', 'PO sent to vendor');

        // 2. Update PO tracking
        $poResponse = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->patchJson("/api/controls/{$ctrl->id}/po-tracking", [
                'status' => 'In Progress',
                'supplier' => 'PT Baja Raya',
                'poNo' => 'PO-001',
                'targetArrival' => '2026-09-15',
                'notes' => 'Urgent priority',
            ]);

        $poResponse->assertStatus(200)
            ->assertJsonPath('data.poTracking.supplier', 'PT Baja Raya')
            ->assertJsonPath('data.poTracking.poNo', 'PO-001');
    }

    public function test_bulk_status_update(): void
    {
        $project = Project::create(['name' => 'P', 'customer' => 'C']);
        $jo = $project->jos()->create(['jo_number' => 'JO-BULK', 'product' => 'P', 'type' => 'PROGRESSIVE']);
        $cat = $jo->categories()->create(['label' => 'PARTS', 'kind' => 'Part']);
        $item1 = $cat->items()->create(['no' => '1', 'description' => 'Item 1']);
        $item2 = $cat->items()->create(['no' => '2', 'description' => 'Item 2']);
        $c1 = $item1->controls()->create(['process' => 'Machining', 'status' => 'Not Started']);
        $c2 = $item2->controls()->create(['process' => 'Machining', 'status' => 'Not Started']);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/jos/{$jo->id}/bulk/update-status", [
                'itemIds' => [$item1->id, $item2->id],
                'processes' => ['Machining'],
                'status' => 'Done',
                'notes' => 'Finished by CNC Team',
            ]);

        $response->assertStatus(200);

        $this->assertEquals('Done', $c1->fresh()->status);
        $this->assertEquals('Done', $c2->fresh()->status);
    }

    public function test_trackers_subcont_and_po(): void
    {
        $project = Project::create(['name' => 'P Track', 'customer' => 'C Track']);
        $jo = $project->jos()->create(['jo_number' => 'JO-TRK', 'product' => 'Tool', 'type' => 'PROGRESSIVE']);
        $cat = $jo->categories()->create(['label' => 'PARTS', 'kind' => 'Part']);

        $item = $cat->items()->create([
            'no' => '1',
            'description' => 'Die Core',
            'is_subcont' => true,
            'subcont_supplier' => 'PRO-TECH',
            'subcont_process' => 'Wirecut',
            'subcont_status' => 'In Progress',
            'arrival_target_date' => '2026-09-10',
        ]);

        $ctrl = $item->controls()->create(['process' => 'PO', 'status' => 'In Progress']);
        $ctrl->poTracking()->create(['supplier' => 'MISUMI', 'po_no' => 'PO-999']);

        // Subcont tracker
        $subcontResponse = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->getJson('/api/trackers/subcont');

        $subcontResponse->assertStatus(200)
            ->assertJsonPath('data.0.subcontSupplier', 'PRO-TECH')
            ->assertJsonPath('data.0.subcontProcess', 'Wirecut');

        // PO tracker
        $poResponse = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->getJson('/api/trackers/po');

        $poResponse->assertStatus(200)
            ->assertJsonPath('data.0.supplier', 'MISUMI')
            ->assertJsonPath('data.0.poNo', 'PO-999');
    }

    public function test_trial_session_publish_with_snapshot_and_custom_ids(): void
    {
        $project = Project::create(['name' => 'P Trial', 'customer' => 'C Trial', 'company' => 'BKP']);
        $jo = $project->jos()->create(['jo_number' => 'JO-TRL-01', 'product' => 'Bracket', 'type' => 'PROGRESSIVE']);

        $customSessionId = (string) \Illuminate\Support\Str::uuid();

        // 1. Create trial session with custom id
        $createRes = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/jos/{$jo->id}/trial-sessions", [
                'id' => $customSessionId,
                'name' => 'Trial T0',
                'trialDate' => '2026-09-07',
                'customer' => 'PT Astra',
                'jobNo' => 'JO-TRL-01',
                'picName' => 'Budi',
                'approvedByName' => 'Pak Joko',
            ]);

        $createRes->assertStatus(201)
            ->assertJsonPath('data.id', $customSessionId)
            ->assertJsonPath('data.name', 'Trial T0');

        // 2. Publish with snapshot payload
        $snapshotPayload = [
            'id' => $customSessionId,
            'name' => 'Trial T0',
            'customer' => 'PT Astra Honda',
            'jobNo' => 'JO-TRL-01',
            'picName' => 'Budi Staff',
            'approvedByName' => 'Pak Joko Manager',
            'trialDate' => '2026-09-07',
            'findings' => [
                [
                    'id' => 'f-1',
                    'order' => 1,
                    'problems' => [
                        [
                            'id' => 'p-1',
                            'text' => 'Flange burr on edge',
                            'photos' => [
                                ['id' => 'ph-1', 'name' => 'burr.jpg', 'previewUrl' => 'data:image/jpeg;base64,...']
                            ]
                        ]
                    ],
                    'causes' => [
                        ['id' => 'c-1', 'text' => 'Die clearance too small', 'photos' => []]
                    ],
                    'correctiveActions' => [
                        ['id' => 'a-1', 'order' => 1, 'text' => 'Regrind punch clearance', 'status' => 'On Process', 'pic' => 'Andi']
                    ]
                ]
            ]
        ];

        $publishRes = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/trial-sessions/{$customSessionId}/publish", [
                'snapshot' => $snapshotPayload,
            ]);

        $publishRes->assertStatus(200)
            ->assertJsonPath('data.publishedSnapshot.customer', 'PT Astra Honda')
            ->assertJsonPath('data.publishedSnapshot.findings.0.problems.0.text', 'Flange burr on edge');

        $this->assertNotNull($publishRes->json('data.lastPublishedAt'));

        // 3. Viewer retrieves via GET /projects and GET /trial-sessions/{session}
        $viewerProjRes = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->getJson('/api/projects');

        $viewerProjRes->assertStatus(200);
        $retrievedJo = collect($viewerProjRes->json('data.0.jos'))->firstWhere('id', $jo->id);
        $this->assertNotEmpty($retrievedJo['trialSessions']);
        $this->assertEquals('PT Astra Honda', $retrievedJo['trialSessions'][0]['publishedSnapshot']['customer']);

        $viewerSessionRes = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->getJson("/api/trial-sessions/{$customSessionId}");

        $viewerSessionRes->assertStatus(200)
            ->assertJsonPath('data.publishedSnapshot.customer', 'PT Astra Honda')
            ->assertJsonPath('data.publishedSnapshot.findings.0.problems.0.photos.0.name', 'burr.jpg');
    }

    public function test_controller_can_delete_project_and_viewer_cannot(): void
    {
        $project = Project::create([
            'name' => 'Project To Delete',
            'customer' => 'Customer Del',
            'company' => 'BKP',
        ]);

        $jo = $project->jos()->create([
            'jo_number' => 'JO-DEL-001',
            'product' => 'Product Del',
            'type' => 'TANDEM',
        ]);

        // 1. Viewer cannot delete project (403)
        $viewerResponse = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->deleteJson("/api/projects/{$project->id}");
        $viewerResponse->assertStatus(403);

        $this->assertDatabaseHas('projects', ['id' => $project->id]);
        $this->assertDatabaseHas('jos', ['id' => $jo->id]);

        // 2. Controller can delete project (200)
        $controllerResponse = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->deleteJson("/api/projects/{$project->id}");
        $controllerResponse->assertStatus(200)
            ->assertJsonPath('message', 'Project deleted successfully.');

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
        $this->assertDatabaseMissing('jos', ['id' => $jo->id]);
    }

    public function test_controller_can_delete_jo_and_viewer_cannot(): void
    {
        $project = Project::create([
            'name' => 'Project Keep',
            'customer' => 'Customer Keep',
        ]);

        $jo = $project->jos()->create([
            'jo_number' => 'JO-DEL-002',
            'product' => 'Product Jo Del',
            'type' => 'PROGRESSIVE',
        ]);

        $category = $jo->categories()->create([
            'label' => 'Cat 1',
            'kind' => 'Part',
        ]);

        // 1. Viewer cannot delete JO (403)
        $viewerResponse = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->deleteJson("/api/jos/{$jo->id}");
        $viewerResponse->assertStatus(403);

        $this->assertDatabaseHas('jos', ['id' => $jo->id]);

        // 2. Controller can delete JO (200)
        $controllerResponse = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->deleteJson("/api/jos/{$jo->id}");
        $controllerResponse->assertStatus(200)
            ->assertJsonPath('message', 'Job Order deleted successfully.');

        $this->assertDatabaseMissing('jos', ['id' => $jo->id]);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
        // Parent project should still exist
        $this->assertDatabaseHas('projects', ['id' => $project->id]);
    }

    public function test_jo_creation_requires_target_date_and_categories(): void
    {
        $project = Project::create([
            'name' => 'Validation Project',
            'customer' => 'Customer Val',
        ]);

        // Missing targetDate
        $resNoTarget = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/projects/{$project->id}/jos", [
                'joNumber' => 'JO-VAL-001',
                'product' => 'Product Val',
                'type' => 'PROGRESSIVE',
                'categories' => [
                    ['label' => 'PART DIES', 'kind' => 'Part', 'isCustom' => false],
                ],
            ]);
        $resNoTarget->assertStatus(422)
            ->assertJsonValidationErrors(['targetDate']);

        // Missing categories
        $resNoCat = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/projects/{$project->id}/jos", [
                'joNumber' => 'JO-VAL-002',
                'product' => 'Product Val',
                'type' => 'PROGRESSIVE',
                'targetDate' => '2026-12-01',
                'categories' => [],
            ]);
        $resNoCat->assertStatus(422)
            ->assertJsonValidationErrors(['categories']);
    }

    public function test_item_update_destroy_and_batch_destroy(): void
    {
        $project = Project::create([
            'name' => 'Item Action Project',
            'customer' => 'Customer Item',
        ]);
        $jo = $project->jos()->create([
            'jo_number' => 'JO-ITEM-001',
            'product' => 'Product Item',
            'type' => 'PROGRESSIVE',
            'target_date' => '2026-12-31',
        ]);
        $category = $jo->categories()->create([
            'label' => 'Part Category',
            'kind' => 'Part',
        ]);

        // Add 2 items
        $item1 = $category->items()->create([
            'no' => '1',
            'description' => 'Original Item 1',
            'dimension' => '100x100',
            'material' => 'SKD11',
            'qty' => 1,
            'sort_order' => 1,
        ]);
        $ctrl1 = $item1->controls()->create(['process' => 'Material', 'status' => 'Not Started']);

        $item2 = $category->items()->create([
            'no' => '2',
            'description' => 'Original Item 2',
            'dimension' => '200x200',
            'material' => 'SS400',
            'qty' => 2,
            'sort_order' => 2,
        ]);
        $ctrl2 = $item2->controls()->create(['process' => 'Material', 'status' => 'Not Started']);

        // 1. Viewer cannot update or delete item (403)
        $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->putJson("/api/items/{$item1->id}", ['description' => 'Hacked Item'])
            ->assertStatus(403);

        $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->deleteJson("/api/items/{$item1->id}")
            ->assertStatus(403);

        // 2. Controller can update item
        $updateRes = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->putJson("/api/items/{$item1->id}", [
                'no' => '1B',
                'description' => 'Updated Item 1',
                'dimension' => '120x120',
                'material' => 'SKD61',
                'qty' => 5,
                'hrc' => '58-60',
            ]);
        $updateRes->assertStatus(200)
            ->assertJsonPath('data.description', 'Updated Item 1')
            ->assertJsonPath('data.qty', 5)
            ->assertJsonPath('data.hrc', '58-60');

        $this->assertDatabaseHas('items', [
            'id' => $item1->id,
            'description' => 'Updated Item 1',
            'qty' => 5,
            'hrc' => '58-60',
        ]);

        // 3. Controller can delete single item
        $deleteRes = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->deleteJson("/api/items/{$item1->id}");
        $deleteRes->assertStatus(200);

        $this->assertDatabaseMissing('items', ['id' => $item1->id]);
        $this->assertDatabaseMissing('controls', ['id' => $ctrl1->id]);

        // 4. Controller can batch delete items
        $item3 = $category->items()->create([
            'no' => '3',
            'description' => 'Item 3 to delete',
            'qty' => 1,
            'sort_order' => 3,
        ]);
        $ctrl3 = $item3->controls()->create(['process' => 'Material', 'status' => 'Not Started']);

        $batchRes = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/items/batch-delete', [
                'itemIds' => [$item2->id, $item3->id],
            ]);
        $batchRes->assertStatus(200)
            ->assertJsonPath('deletedCount', 2);

        $this->assertDatabaseMissing('items', ['id' => $item2->id]);
        $this->assertDatabaseMissing('items', ['id' => $item3->id]);
        $this->assertDatabaseMissing('controls', ['id' => $ctrl2->id]);
        $this->assertDatabaseMissing('controls', ['id' => $ctrl3->id]);
    }

    public function test_controller_can_upload_and_delete_control_photo(): void
    {
        Storage::fake('public');

        $project = Project::create(['name' => 'Photo Project', 'customer' => 'Cust']);
        $jo = $project->jos()->create(['jo_number' => 'JO-P1', 'product' => 'Die', 'type' => 'PROGRESSIVE']);
        $category = $jo->categories()->create(['label' => 'PART DIES', 'kind' => 'Part', 'sort_order' => 1]);
        $item = $category->items()->create(['no' => '1', 'description' => 'Plate 1', 'qty' => 1]);
        $control = $item->controls()->create(['process' => 'Machining', 'status' => 'In Progress']);

        $file = UploadedFile::fake()->image('machining_proof.jpg', 800, 600);

        // Upload photo
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/controls/{$control->id}/photos", [
                'photo' => $file,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'machining_proof.jpg');

        $photoId = $response->json('data.id');
        $this->assertDatabaseHas('process_photos', ['id' => $photoId, 'control_id' => $control->id]);

        // Eager load check via ProjectController show
        $projShow = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->getJson("/api/projects/{$project->id}");
        $projShow->assertStatus(200)
            ->assertJsonCount(1, 'data.jos.0.categories.0.items.0.controls.0.photos');

        // Delete photo
        $delResponse = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->deleteJson("/api/process-photos/{$photoId}");
        $delResponse->assertStatus(200);

        $this->assertDatabaseMissing('process_photos', ['id' => $photoId]);
    }

    public function test_category_placement_places_part_before_component_and_component_at_end(): void
    {
        $project = Project::create(['name' => 'Category Order Project', 'customer' => 'Cust']);
        $jo = $project->jos()->create(['jo_number' => 'JO-CAT', 'product' => 'Die', 'type' => 'PROGRESSIVE']);
        $catPart1 = $jo->categories()->create(['label' => 'PART DIES OP 10', 'kind' => 'Part', 'sort_order' => 1]);
        $catComp1 = $jo->categories()->create(['label' => 'COMPONENT DIES OP 10', 'kind' => 'Component', 'sort_order' => 2]);

        // 1. Add another Part category -> should be inserted before COMPONENT DIES OP 10
        $resPart2 = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/jos/{$jo->id}/categories", [
                'label' => 'PART DIES OP 20',
                'kind' => 'Part',
                'isCustom' => true,
            ]);
        $resPart2->assertStatus(201);
        $part2Id = $resPart2->json('data.id');

        // Check sort orders: Part1 (1), Part2 (2), Comp1 (3)
        $this->assertEquals(1, $catPart1->fresh()->sort_order);
        $this->assertEquals(2, $jo->categories()->find($part2Id)->sort_order);
        $this->assertEquals(3, $catComp1->fresh()->sort_order);

        // 2. Add another Component category -> should be at the very end
        $resComp2 = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/jos/{$jo->id}/categories", [
                'label' => 'COMPONENT STD',
                'kind' => 'Component',
                'isCustom' => true,
            ]);
        $resComp2->assertStatus(201);
        $comp2Id = $resComp2->json('data.id');

        $this->assertEquals(4, $jo->categories()->find($comp2Id)->sort_order);

        // Verify ordering through relation
        $orderedLabels = $jo->fresh()->categories->pluck('label')->toArray();
        $this->assertEquals([
            'PART DIES OP 10',
            'PART DIES OP 20',
            'COMPONENT DIES OP 10',
            'COMPONENT STD',
        ], $orderedLabels);
    }
}

