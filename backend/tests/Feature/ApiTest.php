<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Control;
use App\Models\Item;
use App\Models\JO;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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
        // 1. Controller creates project
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/projects', [
                'name' => 'Test Project X',
                'customer' => 'Customer X',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Test Project X');

        // 2. Viewer can list projects
        $listResponse = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->getJson('/api/projects');

        $listResponse->assertStatus(200)
            ->assertJsonCount(1, 'data');
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
}
