<?php

namespace Tests\Feature;

use App\Models\JO;
use App\Models\Project;
use App\Models\TrialSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TrialTest extends TestCase
{
    use RefreshDatabase;

    private User $controller;
    private string $token;
    private JO $jo;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->controller = User::create([
            'name' => 'Controller',
            'email' => 'c@test.com',
            'password' => Hash::make('secret'),
            'role' => 'controller',
        ]);

        $this->token = $this->controller->createToken('test-token')->plainTextToken;

        $project = Project::create(['name' => 'Dies Project', 'customer' => 'PT Astra']);
        $this->jo = $project->jos()->create([
            'jo_number' => 'JO-TRIAL-01',
            'product' => 'Bracket Dies',
            'type' => 'PROGRESSIVE',
        ]);
    }

    public function test_can_create_and_list_trial_sessions(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson("/api/jos/{$this->jo->id}/trial-sessions", [
                'name' => 'T0 - First Trial',
                'trialDate' => '2026-09-10',
                'customer' => 'PT Astra',
                'picName' => 'Budi Engineering',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'T0 - First Trial')
            ->assertJsonPath('data.findings.0.problems.0.text', '');

        $sessionId = $response->json('data.id');

        $listResponse = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson("/api/jos/{$this->jo->id}/trial-sessions");

        $listResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $sessionId);
    }

    public function test_can_add_entries_and_upload_photo(): void
    {
        // 1. Create session
        $session = $this->jo->trialSessions()->create([
            'name' => 'T0',
            'trial_date' => '2026-09-10',
            'update_date' => '2026-09-10',
            'customer' => 'PT Astra',
            'job_no' => 'JO-TRIAL-01',
            'pic_name' => 'Staff',
            'approved_by_name' => 'Lead',
        ]);

        $finding = $session->findings()->create(['order' => 1]);
        $entry = $finding->entries()->create([
            'section' => 'problems',
            'order' => 1,
            'text' => 'Part deformation on edge',
        ]);

        // 2. Upload valid image
        $fakeImage = UploadedFile::fake()->image('defect.jpg', 640, 480);

        $uploadResponse = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->post("/api/trial-entries/{$entry->id}/photos", [
                'photo' => $fakeImage,
            ], ['Accept' => 'application/json']);

        $uploadResponse->assertStatus(201)
            ->assertJsonPath('data.name', 'defect.jpg');

        $photoId = $uploadResponse->json('data.id');
        $this->assertDatabaseHas('trial_entry_photos', ['id' => $photoId]);

        // 3. Delete photo
        $deleteResponse = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->deleteJson("/api/trial-entry-photos/{$photoId}");

        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('trial_entry_photos', ['id' => $photoId]);
    }

    public function test_photo_upload_rejects_non_image_or_oversized(): void
    {
        $session = $this->jo->trialSessions()->create([
            'name' => 'T0',
            'trial_date' => '2026-09-10',
            'update_date' => '2026-09-10',
            'customer' => 'PT Astra',
            'job_no' => 'JO-TRIAL-01',
            'pic_name' => 'Staff',
            'approved_by_name' => 'Lead',
        ]);

        $finding = $session->findings()->create(['order' => 1]);
        $entry = $finding->entries()->create(['section' => 'problems', 'order' => 1, 'text' => 'Problem']);

        // Test non-image file
        $fakePdf = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->post("/api/trial-entries/{$entry->id}/photos", [
                'photo' => $fakePdf,
            ], ['Accept' => 'application/json']);

        $this->assertTrue(in_array($response->status(), [422, 500]));

        // Test file > 5MB
        $largeImage = UploadedFile::fake()->image('huge.jpg')->size(6000); // 6MB
        $largeResponse = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->post("/api/trial-entries/{$entry->id}/photos", [
                'photo' => $largeImage,
            ], ['Accept' => 'application/json']);

        $largeResponse->assertStatus(422);
    }

    public function test_can_duplicate_trial_session(): void
    {
        $session = $this->jo->trialSessions()->create([
            'name' => 'T0 Initial',
            'trial_date' => '2026-09-10',
            'update_date' => '2026-09-10',
            'customer' => 'PT Astra',
            'job_no' => 'JO-TRIAL-01',
            'pic_name' => 'Staff',
            'approved_by_name' => 'Lead',
        ]);

        $finding = $session->findings()->create(['order' => 1]);
        $entry = $finding->entries()->create([
            'section' => 'problems',
            'order' => 1,
            'text' => 'Burr on outer trim',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson("/api/trial-sessions/{$session->id}/duplicate", [
                'name' => 'T1 Follow-up',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'T1 Follow-up')
            ->assertJsonPath('data.findings.0.problems.0.text', 'Burr on outer trim');

        $this->assertEquals(2, $this->jo->trialSessions()->count());
    }
}
