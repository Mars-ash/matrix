<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Control;
use App\Models\Item;
use App\Models\JO;
use App\Models\Project;
use App\Models\TrialSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_and_jo_hierarchy_persists_with_uuids(): void
    {
        $project = Project::create([
            'name' => 'Dies Test Project',
            'customer' => 'Customer A',
        ]);

        $this->assertNotEmpty($project->id);
        $this->assertIsString($project->id);

        $jo = JO::create([
            'project_id' => $project->id,
            'jo_number' => 'TEST-001',
            'product' => 'Die OP 10',
            'type' => 'PROGRESSIVE',
            'target_date' => '2026-10-01',
        ]);

        $category = Category::create([
            'jo_id' => $jo->id,
            'label' => 'PART DIES',
            'kind' => 'Part',
            'is_custom' => false,
            'sort_order' => 1,
        ]);

        $item = Item::create([
            'category_id' => $category->id,
            'no' => '1',
            'description' => 'Punch Blade',
            'dimension' => '100x50x20',
            'material' => 'SKD11',
            'qty' => 2,
            'hrc' => '58-60',
        ]);

        $control = Control::create([
            'item_id' => $item->id,
            'process' => 'Material',
            'status' => 'In Progress',
            'notes' => 'Awaiting arrival',
        ]);

        $control->poTracking()->create([
            'supplier' => 'Vendor Test',
            'po_no' => 'PO-12345',
            'po_date' => '2026-09-01',
            'target_arrival' => '2026-09-10',
            'notes' => 'Urgent',
        ]);

        // Verify loaded relationships
        $loadedProject = Project::with([
            'jos.categories.items.controls.poTracking',
        ])->find($project->id);

        $this->assertNotNull($loadedProject);
        $this->assertCount(1, $loadedProject->jos);
        $this->assertEquals('TEST-001', $loadedProject->jos->first()->jo_number);
        $this->assertCount(1, $loadedProject->jos->first()->categories);
        $this->assertCount(1, $loadedProject->jos->first()->categories->first()->items);
        $this->assertEquals('Punch Blade', $loadedProject->jos->first()->categories->first()->items->first()->description);
        $this->assertCount(1, $loadedProject->jos->first()->categories->first()->items->first()->controls);
        $this->assertEquals('Vendor Test', $loadedProject->jos->first()->categories->first()->items->first()->controls->first()->poTracking->supplier);
    }

    public function test_trial_session_finding_and_entry_hierarchy(): void
    {
        $project = Project::create([
            'name' => 'Trial Project',
            'customer' => 'Customer B',
        ]);

        $jo = JO::create([
            'project_id' => $project->id,
            'jo_number' => 'TRIAL-001',
            'product' => 'Trial Part',
            'type' => 'TANDEM',
        ]);

        $session = TrialSession::create([
            'jo_id' => $jo->id,
            'name' => 'Trial 1',
            'trial_date' => '2026-09-01',
            'update_date' => '2026-09-02',
            'customer' => 'Customer B',
            'job_no' => 'TRIAL-001',
            'pic_name' => 'Technician A',
            'approved_by_name' => 'Manager B',
        ]);

        $finding = $session->findings()->create(['order' => 1]);

        $finding->entries()->create([
            'section' => 'problems',
            'order' => 1,
            'text' => 'Part deformation',
        ]);

        $finding->entries()->create([
            'section' => 'correctiveActions',
            'order' => 1,
            'text' => 'Increase pressure',
            'target_date' => '2026-09-15',
            'pic' => 'Technician A',
            'status' => 'On Process',
        ]);

        $loadedSession = TrialSession::with(['findings.problems', 'findings.correctiveActions'])->find($session->id);

        $this->assertCount(1, $loadedSession->findings);
        $this->assertCount(1, $loadedSession->findings->first()->problems);
        $this->assertEquals('Part deformation', $loadedSession->findings->first()->problems->first()->text);
        $this->assertCount(1, $loadedSession->findings->first()->correctiveActions);
        $this->assertEquals('On Process', $loadedSession->findings->first()->correctiveActions->first()->status);
    }

    public function test_seeder_populates_full_prototype_dataset(): void
    {
        $this->seed(\Database\Seeders\DemoSeeder::class);

        $this->assertDatabaseCount('projects', 3);
        $this->assertDatabaseHas('projects', ['name' => 'Automotive Stamping Dies']);
        $this->assertDatabaseHas('jos', ['jo_number' => '126.110']);
        $this->assertDatabaseHas('items', ['description' => 'Upper Die Shoe']);
        $this->assertDatabaseHas('trial_sessions', ['name' => 'Lower 140826']);
    }
}
