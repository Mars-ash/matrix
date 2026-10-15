<?php

namespace Tests\Feature;

use App\Models\Partner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PartnerTest extends TestCase
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
            'email' => 'controller_partner@test.com',
            'password' => Hash::make('secret'),
            'role' => 'controller',
        ]);

        $this->viewer = User::create([
            'name' => 'Viewer Test',
            'email' => 'viewer_partner@test.com',
            'password' => Hash::make('secret'),
            'role' => 'viewer',
        ]);

        $this->controllerToken = $this->controller->createToken('c-token')->plainTextToken;
        $this->viewerToken = $this->viewer->createToken('v-token')->plainTextToken;

        Partner::query()->delete();
    }

    public function test_controller_and_viewer_can_list_partners_with_filters(): void
    {
        Partner::create(['name' => 'PT Astra Honda', 'type' => 'customer', 'status' => 'active']);
        Partner::create(['name' => 'PT Old Customer', 'type' => 'customer', 'status' => 'discontinued']);
        Partner::create(['name' => 'PT Misumi', 'type' => 'supplier_po', 'status' => 'active']);

        // 1. Unfiltered list
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->getJson('/api/partners');
        $res->assertStatus(200)
            ->assertJsonCount(3, 'data');

        // 2. Filter by type
        $resType = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->getJson('/api/partners?type=customer');
        $resType->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // 3. Filter by status
        $resActive = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->getJson('/api/partners?type=customer&status=active');
        $resActive->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'PT Astra Honda');
    }

    public function test_controller_can_create_partner(): void
    {
        $payload = [
            'name' => 'PT Baru Sukses',
            'type' => 'customer',
        ];

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/partners', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('data.name', 'PT Baru Sukses')
            ->assertJsonPath('data.type', 'customer')
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('partners', [
            'name' => 'PT Baru Sukses',
            'type' => 'customer',
            'status' => 'active',
        ]);
    }

    public function test_controller_can_update_partner_name_and_status(): void
    {
        $partner = Partner::create([
            'name' => 'PT Mitra Awal',
            'type' => 'supplier_po',
            'status' => 'active',
        ]);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->putJson("/api/partners/{$partner->id}", [
                'name' => 'PT Mitra Revisi',
                'status' => 'discontinued',
            ]);

        $res->assertStatus(200)
            ->assertJsonPath('data.name', 'PT Mitra Revisi')
            ->assertJsonPath('data.status', 'discontinued');

        $this->assertDatabaseHas('partners', [
            'id' => $partner->id,
            'name' => 'PT Mitra Revisi',
            'status' => 'discontinued',
        ]);
    }

    public function test_controller_can_delete_partner(): void
    {
        $partner = Partner::create([
            'name' => 'PT Mau Dihapus',
            'type' => 'supplier_subcont',
            'status' => 'active',
        ]);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->deleteJson("/api/partners/{$partner->id}");

        $res->assertStatus(200)
            ->assertJsonPath('message', 'Partner deleted successfully.');

        $this->assertDatabaseMissing('partners', [
            'id' => $partner->id,
        ]);
    }

    public function test_viewer_cannot_mutate_partners(): void
    {
        $partner = Partner::create([
            'name' => 'PT Penting',
            'type' => 'customer',
            'status' => 'active',
        ]);

        // Post
        $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->postJson('/api/partners', ['name' => 'Hacker PT', 'type' => 'customer'])
            ->assertStatus(403);

        // Put
        $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->putJson("/api/partners/{$partner->id}", ['name' => 'Ubah Nama'])
            ->assertStatus(403);

        // Delete
        $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->deleteJson("/api/partners/{$partner->id}")
            ->assertStatus(403);
    }

    public function test_partner_validation_rules_are_enforced(): void
    {
        // Missing name and type
        $res = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/partners', []);

        $res->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'type']);

        // Invalid type
        $resInvalidType = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/partners', [
                'name' => 'PT Valid',
                'type' => 'invalid_type',
            ]);

        $resInvalidType->assertStatus(422)
            ->assertJsonValidationErrors(['type']);

        // Invalid status on update
        $partner = Partner::create(['name' => 'PT Valid', 'type' => 'customer']);
        $resInvalidStatus = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->putJson("/api/partners/{$partner->id}", [
                'status' => 'unknown_status',
            ]);

        $resInvalidStatus->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }
}
