<?php

namespace Database\Seeders;

use App\Models\Activity;
use App\Models\Category;
use App\Models\Control;
use App\Models\Item;
use App\Models\JO;
use App\Models\PoTracking;
use App\Models\Project;
use App\Models\TrialEntry;
use App\Models\TrialFinding;
use App\Models\TrialSession;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $now = Carbon::now();

            // ---------------------------------------------------------------
            // 1. Project 1: Automotive Stamping Dies
            // ---------------------------------------------------------------
            $proj1 = Project::create([
                'name' => 'Automotive Stamping Dies',
                'customer' => 'PT Astra Daihatsu Motor',
            ]);

            // JO 126.110
            $jo110 = JO::create([
                'project_id' => $proj1->id,
                'jo_number' => '126.110',
                'product' => 'Upper Die Assembly',
                'type' => 'PROGRESSIVE',
                'target_date' => $now->copy()->addDays(42)->format('Y-m-d'),
            ]);

            // Activity Log for JO 126.110
            Activity::create([
                'jo_id' => $jo110->id,
                'message' => 'JO 126.110 initialized with BOM and trial session history.',
                'created_at' => $now->copy()->subDays(15),
            ]);
            Activity::create([
                'jo_id' => $jo110->id,
                'message' => 'Subcont dispatch: Die Plate sent to CHIYODA for Vacuum Hardening.',
                'created_at' => $now->copy()->subDays(4),
            ]);

            // Category 1: PART DIES OP 10
            $catPart = Category::create([
                'jo_id' => $jo110->id,
                'label' => 'PART DIES OP 10',
                'kind' => 'Part',
                'is_custom' => false,
                'sort_order' => 1,
            ]);

            $partList = [
                ['1', 'Upper Die Shoe', '600×500×60', 'S50C', 1, '', ['Done', 'Done', 'In Progress', '-', 'Not Started', '-', 'Not Started'], null],
                ['2', 'Lower Die Shoe', '600×500×50', 'S50C', 1, '', ['Done', 'Done', 'In Progress', '-', 'Not Started', '-', 'Not Started'], null],
                ['3', 'Guide Post', 'Ø38×200', 'SK3', 4, '58-60', ['Done', 'Done', 'Done', 'Done', 'Done', '-', 'Not Started'], null],
                ['4', 'Guide Bush', 'Ø38×50', 'SK3', 4, '58-60', ['Done', 'Done', 'Done', 'Done', 'Done', '-', 'Not Started'], null],
                ['5', 'Punch Holder', '400×300×35', 'S50C', 1, '', ['Done', 'Done', 'In Progress', '-', 'Not Started', '-', 'Not Started'], null],
                ['6', 'Die Plate', '400×300×30', 'SKD11', 1, '58-60', ['Done', 'Done', 'Done', 'In Progress SC', 'Not Started', 'Not Started', 'Not Started'], [
                    'is_subcont' => true,
                    'subcont_supplier' => 'CHIYODA',
                    'subcont_process' => 'Hardening',
                    'subcont_status' => 'In Progress',
                    'subcont_dispatch_date' => $now->copy()->subDays(4),
                    'arrival_target_date' => $now->copy()->addDays(2)->format('Y-m-d'),
                    'subcont_notes' => 'Vacuum hardening 58-60 HRC',
                ]],
                ['7', 'Stripper Plate', '400×300×22', 'S50C', 1, '', ['Done', 'Done', 'Not Started', '-', 'Not Started', '-', 'Not Started'], null],
                ['8', 'Backing Plate', '400×300×16', 'S50C', 1, '', ['Done', 'Done', 'Not Started', '-', '-', '-', 'Not Started'], null],
                ['9', 'Piercing Punch A', 'Ø12×70', 'SKD11', 4, '58-60', ['Done', 'Done', 'Done', 'Done', 'Done', '-', 'Not Started'], [
                    'is_subcont' => true,
                    'subcont_supplier' => 'PUTRA',
                    'subcont_process' => 'Grinding',
                    'subcont_status' => 'Done',
                    'subcont_dispatch_date' => $now->copy()->subDays(8),
                    'subcont_done_at' => $now->copy()->subDays(1),
                    'arrival_target_date' => $now->copy()->subDays(2)->format('Y-m-d'),
                    'subcont_notes' => 'Cylindrical grinding Ø12 h6',
                ]],
                ['10', 'Piercing Punch B', '□10×70', 'SKD11', 2, '58-60', ['Done', 'Done', 'Done', 'Done', 'Done', 'Not Started', 'Not Started'], null],
                ['11', 'Pilot Pin', 'Ø6×60', 'SKD11', 4, '58-60', ['Done', 'Done', 'Done', 'Done', 'Done', '-', 'Not Started'], null],
                ['12', 'Dowel Pin', 'Ø10×40', 'SUJ2', 8, '', ['Done', 'Done', '-', '-', '-', '-', 'Not Started'], null],
                ['13', 'Stopper', '20×20×25', 'S45C', 2, '', ['Done', 'Done', 'Not Started', '-', '-', '-', 'Not Started'], null],
                ['14', 'Stripper Bolt', 'M10×65', 'SCM435', 6, '', ['Done', 'Done', '-', '-', '-', '-', 'Not Started'], null],
                ['15', 'Spring', 'TF30×60', 'SWP-A', 6, '', ['Done', 'Done', '-', '-', '-', '-', 'Not Started'], null],
                ['16', 'Blanking Punch', 'special', 'SKD11', 1, '58-60', ['Done', 'Done', 'Done', 'Done', 'Done', 'In Progress SC', 'Not Started'], [
                    'is_subcont' => true,
                    'subcont_supplier' => 'PRO-TECH',
                    'subcont_process' => 'Wirecut',
                    'subcont_status' => 'In Progress',
                    'subcont_dispatch_date' => $now->copy()->subDays(6),
                    'arrival_target_date' => $now->copy()->subDays(1)->format('Y-m-d'),
                    'subcont_notes' => 'Wirecut profile clearance 0.02mm',
                ]],
                ['17', 'Forming Punch', 'special', 'SKD11', 1, '58-60', ['Done', 'Done', 'In Progress SC', 'Not Started', 'Not Started', 'Not Started', 'Not Started'], [
                    'is_subcont' => true,
                    'subcont_supplier' => 'GEMA',
                    'subcont_process' => 'Machining',
                    'subcont_status' => 'In Progress',
                    'subcont_dispatch_date' => $now->copy()->subDays(2),
                    'arrival_target_date' => $now->copy()->format('Y-m-d'),
                    'subcont_notes' => 'CNC 3D profiling',
                ]],
                ['18', 'Bending Punch', 'special', 'SKD11', 1, '58-60', ['Done', 'In Progress', 'Not Started', 'Not Started', 'Not Started', 'Not Started', 'Not Started'], null],
                ['19', 'Cam Driver', '80×50×100', 'S50C', 1, '', ['Done', 'In Progress', 'Not Started', '-', 'Not Started', '-', 'Not Started'], null],
                ['20', 'Cam Slide', '60×50×40', 'SKD11', 1, '58-60', ['Done', 'In Progress', 'Not Started', 'Not Started', 'Not Started', 'Not Started', 'Not Started'], null],
                ['21', 'Lifter', '30×80×50', 'SKD11', 2, '58-60', ['In Progress', 'Not Started', 'Not Started', 'Not Started', 'Not Started', '-', 'Not Started'], null],
                ['22', 'Lifter Guide', '30×20×40', 'S50C', 2, '', ['In Progress', 'Problem', 'Not Started', '-', '-', '-', 'Not Started'], null],
            ];

            $partProcesses = ['Material', 'Arrival', 'Machining', 'Hardening', 'Grinding', 'Wirecut', 'Assembly'];

            foreach ($partList as $idx => [$no, $desc, $dim, $mat, $qty, $hrc, $statuses, $subcont]) {
                $item = Item::create([
                    'category_id' => $catPart->id,
                    'no' => $no,
                    'description' => $desc,
                    'dimension' => $dim,
                    'material' => $mat,
                    'qty' => $qty,
                    'hrc' => $hrc,
                    'sort_order' => $idx + 1,
                    ...($subcont ?? []),
                ]);

                foreach ($partProcesses as $pIdx => $pName) {
                    $status = $statuses[$pIdx] ?? '-';
                    $notes = '';
                    if ($no === '22' && $pName === 'Arrival') {
                        $notes = 'Anomalous source value (12) — requires verification.';
                    }

                    $ctrl = Control::create([
                        'item_id' => $item->id,
                        'process' => $pName,
                        'status' => $status,
                        'notes' => $notes,
                        'in_progress_at' => in_array($status, ['In Progress', 'In Progress SC']) ? $now->copy()->subDays(2) : null,
                    ]);

                    // PO Tracking for Material
                    if ($pName === 'Material') {
                        if ($no === '21') {
                            PoTracking::create([
                                'control_id' => $ctrl->id,
                                'supplier' => 'PT Baja Makmur',
                                'po_no' => 'PO-MTL-126110-021',
                                'po_date' => $now->copy()->subDays(2)->format('Y-m-d'),
                                'target_arrival' => $now->copy()->addDays(2)->format('Y-m-d'),
                                'notes' => 'SKD11 rough size requested.',
                            ]);
                        } elseif ($no === '22') {
                            PoTracking::create([
                                'control_id' => $ctrl->id,
                                'supplier' => 'PT Sinar Steel',
                                'po_no' => 'PO-MTL-126110-022',
                                'po_date' => $now->copy()->subDays(4)->format('Y-m-d'),
                                'target_arrival' => $now->copy()->subDays(1)->format('Y-m-d'),
                                'notes' => 'Waiting supplier confirmation.',
                            ]);
                        } elseif ($no === '1') {
                            PoTracking::create([
                                'control_id' => $ctrl->id,
                                'supplier' => 'PT Baja Makmur',
                                'po_no' => 'PO-MTL-126110-001',
                                'po_date' => $now->copy()->subDays(12)->format('Y-m-d'),
                                'target_arrival' => $now->copy()->subDays(8)->format('Y-m-d'),
                                'notes' => 'Material received.',
                            ]);
                        }
                    }
                }
            }

            // Category 2: COMPONENT DIES OP 10
            $catComp = Category::create([
                'jo_id' => $jo110->id,
                'label' => 'COMPONENT DIES OP 10',
                'kind' => 'Component',
                'is_custom' => false,
                'sort_order' => 2,
            ]);

            $compList = [
                ['1', 'Coil Spring', 'TF25×40', 'SWP-A', 4, '', ['Done', 'Done'], null],
                ['2', 'Socket Head Cap Screw', 'M10×35', 'SCM435', 12, '', ['Done', 'Done'], null],
                ['3', 'Socket Head Cap Screw', 'M8×30', 'SCM435', 8, '', ['Done', 'Done'], null],
                ['4', 'Socket Head Cap Screw', 'M6×25', 'SCM435', 16, '', ['Done', 'In Progress'], null],
                ['5', 'Dowel Pin', 'Ø8×30', 'SUJ2', 8, '', ['Done', 'Done'], null],
                ['6', 'Dowel Pin', 'Ø6×25', 'SUJ2', 6, '', ['Done', 'Done'], null],
                ['7', 'Shim Plate', '400×300×1.0', 'SUS304', 2, '', ['Done', 'Not Started'], null],
                ['8', 'Urethane Pad', '25×25×20', 'Hardness 90', 4, '', ['In Progress', 'Not Started'], [
                    'supplier' => 'MISUMI',
                    'po_no' => 'PO-COMP-126110-008',
                    'po_date' => $now->copy()->subDays(1)->format('Y-m-d'),
                    'target_arrival' => $now->copy()->addDays(3)->format('Y-m-d'),
                    'notes' => 'Catalog item standard.',
                ]],
                ['9', 'Misumi Spring', 'SWF20-50', 'SWP', 4, '', ['In Progress', 'Not Started'], [
                    'supplier' => 'MISUMI',
                    'po_no' => 'PO-COMP-126110-009',
                    'po_date' => $now->copy()->subDays(2)->format('Y-m-d'),
                    'target_arrival' => $now->copy()->addDays(1)->format('Y-m-d'),
                    'notes' => 'Express delivery.',
                ]],
                ['10', 'Ball Lock Punch', 'SPAL-C Ø12', 'HAP40', 4, '62-64', ['Not Started', 'Not Started'], null],
                ['11', 'Ball Lock Punch', 'SPAL-C Ø8', 'HAP40', 2, '62-64', ['Not Started', 'Not Started'], null],
                ['12', 'Guide Bushing', 'MYKP 38-50', 'Brass', 4, '', ['Done', 'Done'], null],
                ['13', 'Shank', 'Ø40', 'S45C', 1, '', ['Done', 'In Progress'], null],
            ];

            $compProcesses = ['PO', 'Arrival'];

            foreach ($compList as $idx => [$no, $desc, $dim, $mat, $qty, $hrc, $statuses, $poData]) {
                $item = Item::create([
                    'category_id' => $catComp->id,
                    'no' => $no,
                    'description' => $desc,
                    'dimension' => $dim,
                    'material' => $mat,
                    'qty' => $qty,
                    'hrc' => $hrc,
                    'sort_order' => $idx + 1,
                ]);

                foreach ($compProcesses as $pIdx => $pName) {
                    $status = $statuses[$pIdx] ?? '-';
                    $ctrl = Control::create([
                        'item_id' => $item->id,
                        'process' => $pName,
                        'status' => $status,
                        'notes' => '',
                        'in_progress_at' => $status === 'In Progress' ? $now->copy()->subDays(1) : null,
                    ]);

                    if ($pName === 'PO' && $poData) {
                        PoTracking::create([
                            'control_id' => $ctrl->id,
                            'supplier' => $poData['supplier'],
                            'po_no' => $poData['po_no'],
                            'po_date' => $poData['po_date'],
                            'target_arrival' => $poData['target_arrival'],
                            'notes' => $poData['notes'],
                        ]);
                    }
                }
            }

            // Trial Sessions for JO 126.110
            $trial1 = TrialSession::create([
                'jo_id' => $jo110->id,
                'name' => 'Lower 140826',
                'trial_date' => '2026-08-14',
                'update_date' => '2026-08-25',
                'customer' => 'PT Astra Daihatsu Motor',
                'job_no' => '126.110',
                'pic_name' => 'Andi Prasetyo',
                'approved_by_name' => 'Pak Hendra',
            ]);

            $finding1 = TrialFinding::create([
                'trial_session_id' => $trial1->id,
                'order' => 1,
            ]);
            TrialEntry::create([
                'trial_finding_id' => $finding1->id,
                'section' => 'problems',
                'order' => 1,
                'text' => 'Burr pada sudut pemotongan R5 melebihi batas toleransi 0.05mm.',
            ]);
            TrialEntry::create([
                'trial_finding_id' => $finding1->id,
                'section' => 'causes',
                'order' => 1,
                'text' => 'Clearance punch dan die terlalu rapat di area radius, ada indikasi misalignment.',
            ]);
            TrialEntry::create([
                'trial_finding_id' => $finding1->id,
                'section' => 'correctiveActions',
                'order' => 1,
                'text' => 'Adjustment posisi die plate, perbesar clearance menjadi 0.08mm, grinding ulang permukaan.',
                'target_date' => '2026-08-28',
                'pic' => 'Budi Santoso',
                'status' => 'Close',
            ]);

            $trial2 = TrialSession::create([
                'jo_id' => $jo110->id,
                'name' => 'Upper 250826',
                'trial_date' => '2026-08-25',
                'update_date' => '2026-08-26',
                'customer' => 'PT Astra Daihatsu Motor',
                'job_no' => '126.110',
                'pic_name' => 'Andi Prasetyo',
                'approved_by_name' => 'Pak Hendra',
            ]);

            $finding2 = TrialFinding::create([
                'trial_session_id' => $trial2->id,
                'order' => 1,
            ]);
            TrialEntry::create([
                'trial_finding_id' => $finding2->id,
                'section' => 'problems',
                'order' => 1,
                'text' => 'Springback pada bending OP 20 sudut melebihi 1.5 derajat.',
            ]);
            TrialEntry::create([
                'trial_finding_id' => $finding2->id,
                'section' => 'causes',
                'order' => 1,
                'text' => 'Radius bending punch terlalu besar dan tekanan cushion kurang merata.',
            ]);
            TrialEntry::create([
                'trial_finding_id' => $finding2->id,
                'section' => 'correctiveActions',
                'order' => 1,
                'text' => 'Tambah shim menjadi 0.08mm total, poles permukaan die plate.',
                'target_date' => '2026-09-05',
                'pic' => 'Andi',
                'status' => 'On Process',
            ]);

            // JO 126.111 (TANDEM)
            JO::create([
                'project_id' => $proj1->id,
                'jo_number' => '126.111',
                'product' => 'Rear Pillar Reinforcement',
                'type' => 'TANDEM',
                'target_date' => $now->copy()->addDays(56)->format('Y-m-d'),
            ]);

            // ---------------------------------------------------------------
            // 2. Project 2: Motorcycle Frame Tooling
            // ---------------------------------------------------------------
            $proj2 = Project::create([
                'name' => 'Motorcycle Frame Tooling',
                'customer' => 'PT Yamaha Indonesia Motor',
            ]);

            JO::create([
                'project_id' => $proj2->id,
                'jo_number' => '127.001',
                'product' => 'Main Pipe Bracket',
                'type' => 'PROGRESSIVE',
                'target_date' => $now->copy()->addDays(30)->format('Y-m-d'),
            ]);

            JO::create([
                'project_id' => $proj2->id,
                'jo_number' => '127.002',
                'product' => 'Welding Fixture Sub-Assy',
                'type' => 'JIG',
                'target_date' => $now->copy()->addDays(14)->format('Y-m-d'),
            ]);

            // ---------------------------------------------------------------
            // 3. Project 3: Home Appliance Press Tool
            // ---------------------------------------------------------------
            $proj3 = Project::create([
                'name' => 'Home Appliance Press Tool',
                'customer' => 'PT Panasonic Manufacturing',
            ]);

            JO::create([
                'project_id' => $proj3->id,
                'jo_number' => '128.010',
                'product' => 'Air Conditioner Base Pan',
                'type' => 'PROGRESSIVE',
                'target_date' => $now->copy()->addDays(60)->format('Y-m-d'),
            ]);
        });
    }
}
