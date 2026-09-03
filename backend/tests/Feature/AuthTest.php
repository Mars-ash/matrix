<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::create([
            'name' => 'Controller User',
            'email' => 'controller@test.com',
            'password' => Hash::make('password123'),
            'role' => 'controller',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'controller@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ])
            ->assertJson([
                'user' => [
                    'email' => 'controller@test.com',
                    'role' => 'controller',
                ],
            ]);
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        User::create([
            'name' => 'User A',
            'email' => 'user@test.com',
            'password' => Hash::make('password123'),
            'role' => 'viewer',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@test.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_user_can_fetch_me(): void
    {
        $user = User::create([
            'name' => 'Viewer User',
            'email' => 'viewer@test.com',
            'password' => Hash::make('password123'),
            'role' => 'viewer',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'email' => 'viewer@test.com',
                    'role' => 'viewer',
                ],
            ]);
    }

    public function test_unauthenticated_user_cannot_access_me(): void
    {
        $response = $this->getJson('/api/auth/me');
        $response->assertStatus(401);
    }

    public function test_user_can_logout_and_revoke_token(): void
    {
        $user = User::create([
            'name' => 'Logout User',
            'email' => 'logout@test.com',
            'password' => Hash::make('password123'),
            'role' => 'controller',
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully.']);

        $this->assertCount(0, $user->fresh()->tokens);
    }

    public function test_role_policies_distinguish_controller_from_viewer(): void
    {
        $controller = User::create([
            'name' => 'Controller',
            'email' => 'c@test.com',
            'password' => Hash::make('secret'),
            'role' => 'controller',
        ]);

        $viewer = User::create([
            'name' => 'Viewer',
            'email' => 'v@test.com',
            'password' => Hash::make('secret'),
            'role' => 'viewer',
        ]);

        $project = Project::create([
            'name' => 'Project A',
            'customer' => 'Customer A',
        ]);

        $policy = new \App\Policies\ProjectPolicy();

        // Both can view
        $this->assertTrue($policy->view($controller, $project));
        $this->assertTrue($policy->view($viewer, $project));

        // Only controller can create / update / delete
        $this->assertTrue($policy->create($controller));
        $this->assertFalse($policy->create($viewer));

        $this->assertTrue($policy->update($controller, $project));
        $this->assertFalse($policy->update($viewer, $project));

        $this->assertTrue($policy->delete($controller, $project));
        $this->assertFalse($policy->delete($viewer, $project));
    }
}
