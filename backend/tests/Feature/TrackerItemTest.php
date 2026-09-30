<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Control;
use App\Models\Item;
use App\Models\JO;
use App\Models\PoTracking;
use App\Models\Project;
use App\Models\User;
use App\Services\TrackerItemService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TrackerItemTest extends TestCase
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

    public function test_po_item_into_existing_part_category(): void
    {
        $project = Project::create(['name' => 'Proj 1', 'customer' => 'Cust 1', 'company' => 'BKP']);
        $jo = JO::create(['project_id' => $project->id, 'jo_number' => '126.200', 'product' => 'Die', 'type' => 'PROGRESSIVE']);
        $category = Category::create(['jo_id' => $jo->id, 'label' => 'PART DIES', 'kind' => 'Part', 'is_custom' => false, 'sort_order' => 1]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/trackers/items', [
                'tracker' => 'po',
                'categoryId' => $category->id,
                'no' => '01',
                'description' => 'Guide Pin',
                'dimension' => '10 x 20',
                'material' => 'SKD11',
                'qty' => 2,
                'targetArrival' => '2026-10-15',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.category.id', $category->id)
            ->assertJsonPath('data.item.description', 'Guide Pin');

        $itemId = $response->json('data.item.id');
        $item = Item::findOrFail($itemId);
        $this->assertCount(7, $item->controls);

        $material = $item->controls()->where('process', 'Material')->first();
        $arrival = $item->controls()->where('process', 'Arrival')->first();
        $this->assertNotNull($material);
        $this->assertNotNull($arrival);
        $this->assertEquals('2026-10-15', $material->target_date?->format('Y-m-d'));
        $this->assertEquals('2026-10-15', $arrival->target_date?->format('Y-m-d'));

        $this->assertDatabaseHas('po_trackings', [
            'control_id' => $material->id,
            'target_arrival' => '2026-10-15',
        ]);
    }

    public function test_po_item_no_jo_kind_component(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/trackers/items', [
                'tracker' => 'po',
                'kind' => 'Component',
                'description' => 'M8 Bolt',
                'qty' => 10,
            ]);

        $response->assertStatus(201);
        $this->assertEquals(1, Project::where('is_system', true)->count());
        $this->assertEquals(1, JO::where('jo_number', TrackerItemService::UNASSIGNED_JO_NUMBER)->count());

        $category = Category::where('label', 'COMPONENT')->first();
        $this->assertNotNull($category);
        $this->assertEquals('Component', $category->kind);

        $itemId = $response->json('data.item.id');
        $item = Item::findOrFail($itemId);
        $this->assertCount(2, $item->controls);
        $processes = $item->controls->pluck('process')->all();
        $this->assertEqualsCanonicalizing(['PO', 'Arrival'], $processes);
    }

    public function test_second_jo_less_call_reuses_same_system_rows(): void
    {
        $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/trackers/items', [
                'tracker' => 'po',
                'kind' => 'Part',
                'description' => 'Item 1',
            ])->assertStatus(201);

        $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/trackers/items', [
                'tracker' => 'po',
                'kind' => 'Component',
                'description' => 'Item 2',
            ])->assertStatus(201);

        $this->assertEquals(1, Project::where('is_system', true)->count());
        $this->assertEquals(1, JO::where('jo_number', TrackerItemService::UNASSIGNED_JO_NUMBER)->count());
    }

    public function test_subcont_item_no_jo(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/trackers/items', [
                'tracker' => 'subcont',
                'description' => 'Die Insert',
                'targetArrival' => '2026-10-20',
                'subcontNotes' => 'Vacuum hardening',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.category.label', 'PART')
            ->assertJsonPath('data.item.isSubcont', true)
            ->assertJsonPath('data.item.subcontStatus', 'In Progress')
            ->assertJsonPath('data.item.subcontNotes', 'Vacuum hardening');

        $itemId = $response->json('data.item.id');
        $item = Item::findOrFail($itemId);
        $this->assertTrue($item->is_subcont);
        $this->assertEquals('In Progress', $item->subcont_status);
        $this->assertNotNull($item->subcont_dispatch_date);
        $this->assertEquals('2026-10-20', $item->arrival_target_date?->format('Y-m-d'));
        $this->assertEquals('Vacuum hardening', $item->subcont_notes);
    }

    public function test_viewer_token_403_and_no_token_401(): void
    {
        $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->postJson('/api/trackers/items', [
                'tracker' => 'po',
                'description' => 'Should fail',
            ])
            ->assertStatus(403);

        $this->flushHeaders();

        $this->postJson('/api/trackers/items', [
            'tracker' => 'po',
            'description' => 'Should fail',
        ])
            ->assertStatus(401);
    }

    public function test_validation_errors(): void
    {
        $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/trackers/items', [
                'tracker' => 'po',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['description']);

        $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/trackers/items', [
                'tracker' => 'invalid_tracker',
                'description' => 'Test',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['tracker']);

        $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/trackers/items', [
                'tracker' => 'po',
                'categoryId' => '00000000-0000-0000-0000-000000000000',
                'description' => 'Test',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['categoryId']);
    }

    public function test_get_projects_returns_system_project_with_is_system(): void
    {
        $service = new TrackerItemService();
        $service->unassignedCategory('Part');

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->getJson('/api/projects');

        $response->assertStatus(200);
        $projects = $response->json('data');
        $systemProj = collect($projects)->firstWhere('isSystem', true);
        $this->assertNotNull($systemProj);
        $this->assertEquals('Tanpa JO', $systemProj['name']);
        $this->assertTrue($systemProj['isSystem']);
    }

    public function test_system_project_and_jo_cannot_be_deleted(): void
    {
        $service = new TrackerItemService();
        $cat = $service->unassignedCategory('Part');
        $systemJo = $cat->jo;
        $systemProject = $systemJo->project;

        $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->deleteJson('/api/projects/' . $systemProject->id)
            ->assertStatus(422)
            ->assertJson(['message' => 'System project cannot be deleted.']);

        $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->deleteJson('/api/jos/' . $systemJo->id)
            ->assertStatus(422)
            ->assertJson(['message' => 'System project cannot be deleted.']);
    }
}
