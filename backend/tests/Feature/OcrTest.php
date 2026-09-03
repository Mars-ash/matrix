<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\JO;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OcrTest extends TestCase
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
            'email' => 'c@test.com',
            'password' => Hash::make('secret'),
            'role' => 'controller',
        ]);
        $this->controllerToken = $this->controller->createToken('c-tok')->plainTextToken;

        $this->viewer = User::create([
            'name' => 'Viewer Test',
            'email' => 'v@test.com',
            'password' => Hash::make('secret'),
            'role' => 'viewer',
        ]);
        $this->viewerToken = $this->viewer->createToken('v-tok')->plainTextToken;

        $project = Project::create(['name' => 'P', 'customer' => 'C']);
        $jo = $project->jos()->create(['jo_number' => 'JO-OCR', 'product' => 'Bracket', 'type' => 'PROGRESSIVE']);
        $this->category = $jo->categories()->create(['label' => 'PARTS', 'kind' => 'Part']);
    }

    public function test_ocr_extracts_structured_items_from_gemini_api(): void
    {
        Config::set('ocr.gemini_api_key', 'fake-gemini-key');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        [
                                            'no' => '01',
                                            'description' => 'Top Die Plate',
                                            'dimension' => '500 x 350 x 40',
                                            'material' => 'S50C',
                                            'qty' => 1,
                                            'hrc' => '-',
                                        ],
                                        [
                                            'no' => '02',
                                            'description' => 'Guide Bush',
                                            'dimension' => 'DIA 30 x 80',
                                            'material' => 'SUJ2',
                                            'qty' => 4,
                                            'hrc' => '60-62',
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $fakeImage = UploadedFile::fake()->image('drawing_bom.jpg', 800, 600);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->post("/api/categories/{$this->category->id}/ocr-upload", [
                'image' => $fakeImage,
            ], ['Accept' => 'application/json']);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('provider', 'gemini')
            ->assertJsonCount(2, 'items')
            ->assertJsonPath('items.0.description', 'Top Die Plate')
            ->assertJsonPath('items.1.material', 'SUJ2');
    }

    public function test_ocr_falls_back_gracefully_when_no_api_key(): void
    {
        Config::set('ocr.gemini_api_key', '');

        $fakeImage = UploadedFile::fake()->image('table.png', 400, 300);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->controllerToken)
            ->post("/api/categories/{$this->category->id}/ocr-upload", [
                'image' => $fakeImage,
            ], ['Accept' => 'application/json']);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('provider', 'offline_fallback')
            ->assertJsonStructure(['items' => [['no', 'description', 'dimension', 'material', 'qty', 'hrc']]]);
    }

    public function test_viewer_cannot_upload_ocr(): void
    {
        $fakeImage = UploadedFile::fake()->image('table.png', 400, 300);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->viewerToken)
            ->post("/api/categories/{$this->category->id}/ocr-upload", [
                'image' => $fakeImage,
            ], ['Accept' => 'application/json']);

        $response->assertStatus(403);
    }
}
