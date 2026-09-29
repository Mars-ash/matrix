<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\JO;
use App\Models\Project;
use App\Models\User;
use App\Services\OcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Tests\TestCase;

class OcrSecurityTest extends TestCase
{
    use RefreshDatabase;

    private User $controller;
    private User $viewer;
    private string $controllerToken;
    private string $viewerToken;
    private Category $category;

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

        $this->controllerToken = $this->controller->createToken('controller')->plainTextToken;
        $this->viewerToken = $this->viewer->createToken('viewer')->plainTextToken;

        $project = Project::create(['name' => 'Project OCR', 'customer' => 'Customer OCR']);
        $jo = $project->jos()->create(['jo_number' => 'JO-OCR', 'product' => 'Die', 'type' => 'PROGRESSIVE']);
        $this->category = $jo->categories()->create(['label' => 'PARTS', 'kind' => 'Part']);
    }

    public function test_ocr_extract_requires_authentication(): void
    {
        $file = UploadedFile::fake()->image('table.png', 400, 200);

        $response = $this->postJson('/api/ocr/extract', [
            'image' => $file,
            'consent' => true,
        ]);

        $response->assertStatus(401);
    }

    public function test_ocr_category_upload_requires_authentication(): void
    {
        $file = UploadedFile::fake()->image('table.png', 400, 200);

        $res1 = $this->postJson("/api/categories/{$this->category->id}/ocr-upload", [
            'image' => $file,
            'consent' => true,
        ]);
        $res1->assertStatus(401);
    }

    public function test_retired_ocr_upload_alias_returns_404(): void
    {
        $file = UploadedFile::fake()->image('table.png', 400, 200);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson("/api/ocr/{$this->category->id}/upload", [
                'image' => $file,
                'consent' => true,
            ]);
        $res->assertStatus(404);
    }

    public function test_ocr_endpoints_forbidden_for_viewer_role(): void
    {
        $file = UploadedFile::fake()->image('table.png', 400, 200);

        $extractRes = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->postJson('/api/ocr/extract', [
                'image' => $file,
                'consent' => true,
            ]);
        $extractRes->assertStatus(403);

        $uploadRes = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->postJson("/api/categories/{$this->category->id}/ocr-upload", [
                'image' => $file,
                'consent' => true,
            ]);
        $uploadRes->assertStatus(403);
    }

    public function test_ocr_requires_explicit_consent(): void
    {
        $file = UploadedFile::fake()->image('table.png', 400, 200);

        // Missing consent field
        $resWithoutConsent = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/ocr/extract', [
                'image' => $file,
            ]);
        $resWithoutConsent->assertStatus(422)
            ->assertJsonValidationErrors(['consent']);

        // Consent is false
        $resWithFalseConsent = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/ocr/extract', [
                'image' => $file,
                'consent' => false,
            ]);
        $resWithFalseConsent->assertStatus(422)
            ->assertJsonValidationErrors(['consent']);
    }

    public function test_ocr_rejects_disallowed_mime_types(): void
    {
        // Fake a text file disguised as a .jpg
        $fakeScript = UploadedFile::fake()->create('malicious.jpg', 10, 'text/plain');

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/ocr/extract', [
                'image' => $fakeScript,
                'consent' => true,
            ]);

        $res->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    public function test_ocr_rejects_files_over_15mb(): void
    {
        // 16 MB fake image file
        $oversizedFile = UploadedFile::fake()->create('huge.jpg', 16 * 1024, 'image/jpeg');

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/ocr/extract', [
                'image' => $oversizedFile,
                'consent' => true,
            ]);

        $res->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    public function test_ocr_passes_validation_with_valid_image_and_consent(): void
    {
        $mockOcrService = Mockery::mock(OcrService::class);
        $mockOcrService->shouldReceive('extractItems')
            ->once()
            ->andReturn([
                'success' => true,
                'provider' => 'gemini',
                'items' => [
                    [
                        'no' => '1',
                        'description' => 'Punch Plate',
                        'dimension' => '100x50',
                        'material' => 'SKD11',
                        'qty' => 1,
                        'hrc' => '58-60',
                    ],
                ],
                'message' => 'Berhasil mengekstrak 1 item.',
            ]);

        $this->app->instance(OcrService::class, $mockOcrService);

        $file = UploadedFile::fake()->image('real_table.jpg', 400, 200);

        $res = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/ocr/extract', [
                'image' => $file,
                'consent' => true,
            ]);

        $res->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('provider', 'gemini')
            ->assertJsonPath('items.0.description', 'Punch Plate');
    }

    public function test_ocr_endpoints_are_rate_limited(): void
    {
        $mockOcrService = Mockery::mock(OcrService::class);
        $mockOcrService->shouldReceive('extractItems')->andReturn([
            'success' => true,
            'provider' => 'gemini',
            'items' => [],
            'message' => 'ok',
        ]);
        $this->app->instance(OcrService::class, $mockOcrService);

        // Send 11 valid requests (limit is 10/min)
        for ($i = 0; $i < 11; $i++) {
            $file = UploadedFile::fake()->image("table_{$i}.png", 100, 100);
            $res = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
                ->postJson('/api/ocr/extract', [
                    'image' => $file,
                    'consent' => true,
                ]);
            if ($i < 10) {
                $res->assertStatus(200);
            }
        }

        // Subsequent request must receive 429 Too Many Requests
        $fileNext = UploadedFile::fake()->image('table_next.png', 100, 100);
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->postJson('/api/ocr/extract', [
                'image' => $fileNext,
                'consent' => true,
            ]);

        $response->assertStatus(429);
    }
}
