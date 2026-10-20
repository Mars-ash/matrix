<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Control;
use App\Models\Item;
use App\Models\JO;
use App\Models\PoTracking;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BulkActionDuplicateTest extends TestCase
{
    use RefreshDatabase;

    private User $controller;
    private string $controllerToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->controller = User::create([
            'name' => 'Controller Test',
            'email' => 'controller@test.com',
            'password' => Hash::make('secret'),
            'role' => 'controller',
        ]);

        $this->controllerToken = $this->controller->createToken('c-token')->plainTextToken;
    }

    public function test_controller_cannot_send_po_if_any_item_already_has_po(): void
    {
        $project = Project::create(['name' => 'Project Alpha', 'customer' => 'Customer A', 'company' => 'BKP']);
        $jo = JO::create(['project_id' => $project->id, 'jo_number' => 'JO-101', 'product' => 'Mold', 'type' => 'PROGRESSIVE']);
        $category = Category::create(['jo_id' => $jo->id, 'label' => 'Part Category', 'kind' => 'Part', 'sort_order' => 1]);

        $item1 = Item::create([
            'category_id' => $category->id,
            'no' => '01',
            'description' => 'Punch Plate',
            'qty' => 2,
        ]);
        $ctrl1 = Control::create([
            'item_id' => $item1->id,
            'process' => 'Material',
            'status' => 'Done',
        ]);
        PoTracking::create([
            'control_id' => $ctrl1->id,
            'po_no' => 'PO-001',
            'supplier' => 'Vendor Mtl',
        ]);

        $item2 = Item::create([
            'category_id' => $category->id,
            'no' => '02',
            'description' => 'Die Plate',
            'qty' => 1,
        ]);
        Control::create([
            'item_id' => $item2->id,
            'process' => 'Material',
            'status' => 'Not Started',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/jos/{$jo->id}/bulk/send-po", [
                'itemIds' => [$item1->id, $item2->id],
                'supplier' => 'New Vendor',
                'poNo' => 'PO-999',
            ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'message',
                'already_sent_items',
            ]);

        $this->assertEquals($item1->id, $response->json('already_sent_items.0.id'));

        // Ensure item2 was not updated because the transaction should abort
        $this->assertDatabaseMissing('po_trackings', [
            'po_no' => 'PO-999',
        ]);
    }

    public function test_controller_can_send_po_for_new_items(): void
    {
        $project = Project::create(['name' => 'Project Alpha', 'customer' => 'Customer A', 'company' => 'BKP']);
        $jo = JO::create(['project_id' => $project->id, 'jo_number' => 'JO-102', 'product' => 'Mold', 'type' => 'PROGRESSIVE']);
        $category = Category::create(['jo_id' => $jo->id, 'label' => 'Part Category', 'kind' => 'Part', 'sort_order' => 1]);

        $item = Item::create([
            'category_id' => $category->id,
            'no' => '01',
            'description' => 'Punch Plate',
            'qty' => 2,
        ]);
        Control::create([
            'item_id' => $item->id,
            'process' => 'Material',
            'status' => 'Not Started',
        ]);
        Control::create([
            'item_id' => $item->id,
            'process' => 'Arrival',
            'status' => 'Not Started',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/jos/{$jo->id}/bulk/send-po", [
                'itemIds' => [$item->id],
                'supplier' => 'Vendor Test',
                'poNo' => 'PO-1234',
                'poDate' => '2026-10-20',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('po_trackings', [
            'po_no' => 'PO-1234',
            'supplier' => 'Vendor Test',
        ]);
    }

    public function test_controller_cannot_send_subcont_if_item_already_in_subcont(): void
    {
        $project = Project::create(['name' => 'Project Beta', 'customer' => 'Customer B', 'company' => 'BKP']);
        $jo = JO::create(['project_id' => $project->id, 'jo_number' => 'JO-201', 'product' => 'Die', 'type' => 'PROGRESSIVE']);
        $category = Category::create(['jo_id' => $jo->id, 'label' => 'Part Category', 'kind' => 'Part', 'sort_order' => 1]);

        $item = Item::create([
            'category_id' => $category->id,
            'no' => '01',
            'description' => 'Core Block',
            'qty' => 1,
            'is_subcont' => true,
            'subcont_supplier' => 'SC Vendor 1',
            'subcont_process' => 'Machining',
            'subcont_status' => 'In Progress',
        ]);
        Control::create([
            'item_id' => $item->id,
            'process' => 'Machining',
            'status' => 'In Progress SC',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/jos/{$jo->id}/bulk/send-subcont", [
                'itemIds' => [$item->id],
                'process' => 'Machining',
                'supplier' => 'SC Vendor 2',
            ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'message',
                'already_sent_items',
            ]);

        $this->assertEquals($item->id, $response->json('already_sent_items.0.id'));
    }

    public function test_controller_can_send_subcont_for_new_items(): void
    {
        $project = Project::create(['name' => 'Project Beta', 'customer' => 'Customer B', 'company' => 'BKP']);
        $jo = JO::create(['project_id' => $project->id, 'jo_number' => 'JO-202', 'product' => 'Die', 'type' => 'PROGRESSIVE']);
        $category = Category::create(['jo_id' => $jo->id, 'label' => 'Part Category', 'kind' => 'Part', 'sort_order' => 1]);

        $item = Item::create([
            'category_id' => $category->id,
            'no' => '02',
            'description' => 'Guide Pin',
            'qty' => 4,
            'is_subcont' => false,
        ]);
        Control::create([
            'item_id' => $item->id,
            'process' => 'Machining',
            'status' => 'Not Started',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/jos/{$jo->id}/bulk/send-subcont", [
                'itemIds' => [$item->id],
                'process' => 'Machining',
                'supplier' => 'SC Vendor New',
            ]);

        $response->assertStatus(200);

        $item->refresh();
        $this->assertTrue($item->is_subcont);
        $this->assertEquals('SC Vendor New', $item->subcont_supplier);
    }
}
