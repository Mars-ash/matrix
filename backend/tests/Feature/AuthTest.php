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

    public function test_user_can_login_with_custom_username_credentials(): void
    {
        User::create([
            'name' => 'Staff Engineering',
            'username' => 'matrix',
            'email' => 'engineering@matrix.com',
            'password' => Hash::make('eng#1'),
            'role' => 'controller',
        ]);

        User::create([
            'name' => 'Viewer',
            'username' => 'matrix#1',
            'email' => 'viewer@matrix.com',
            'password' => Hash::make('matrix#1'),
            'role' => 'viewer',
        ]);

        // 1. Staff Engineering login
        $resStaff = $this->postJson('/api/auth/login', [
            'username' => 'matrix',
            'password' => 'eng#1',
        ]);
        $resStaff->assertStatus(200)
            ->assertJson([
                'user' => [
                    'name' => 'Staff Engineering',
                    'role' => 'controller',
                ],
            ]);

        // 2. Viewer login
        $resViewer = $this->postJson('/api/auth/login', [
            'username' => 'matrix',
            'password' => 'matrix#1',
        ]);
        $resViewer->assertStatus(200)
            ->assertJson([
                'user' => [
                    'name' => 'Viewer',
                    'role' => 'viewer',
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

    public function test_demo_tokens_are_rejected(): void
    {
        User::create([
            'name' => 'Controller',
            'email' => 'ctl@test.com',
            'password' => Hash::make('secret'),
            'role' => 'controller',
        ]);
        User::create([
            'name' => 'Viewer',
            'email' => 'vwr@test.com',
            'password' => Hash::make('secret'),
            'role' => 'viewer',
        ]);

        foreach (['demo-prototype-token', 'demo-controller-token', 'demo-viewer-token'] as $token) {
            $this->withHeader('Authorization', "Bearer {$token}")
                ->getJson('/api/projects')
                ->assertStatus(401);
        }
    }

    public function test_request_without_token_is_rejected(): void
    {
        $this->getJson('/api/projects')->assertStatus(401);
    }

    public function test_real_sanctum_token_is_accepted(): void
    {
        $user = User::create([
            'name' => 'Controller',
            'email' => 'real@test.com',
            'password' => Hash::make('secret'),
            'role' => 'controller',
        ]);
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/projects')
            ->assertStatus(200);
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/login', [
                'username' => 'ratelimit_user',
                'password' => 'wrongpass',
            ]);
        }

        $res = $this->postJson('/api/auth/login', [
            'username' => 'ratelimit_user',
            'password' => 'wrongpass',
        ]);

        $res->assertStatus(429);
    }
}
