<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Control;
use App\Models\Item;
use App\Models\JO;
use App\Models\Project;

class TrackerItemService
{
    public const UNASSIGNED_JO_NUMBER = 'TANPA-JO';
    private const PART_PROCESSES = ['Material', 'Arrival', 'Machining', 'Hardening', 'Grinding', 'Wirecut', 'Assembly'];
    private const COMPONENT_PROCESSES = ['PO', 'Arrival'];

    /** Find-or-create the hidden "Tanpa JO" project → JO → category for the given kind. */
    public function unassignedCategory(string $kind): Category
    {
        $project = Project::firstOrCreate(
            ['is_system' => true],
            ['name' => 'Tanpa JO', 'customer' => '-', 'company' => 'BKP']
        );
        $jo = JO::firstOrCreate(
            ['jo_number' => self::UNASSIGNED_JO_NUMBER],
            ['project_id' => $project->id, 'product' => 'Item tanpa JO', 'type' => 'MACHINING SERVICE']
        );
        return Category::firstOrCreate(
            ['jo_id' => $jo->id, 'label' => strtoupper($kind)],
            ['kind' => $kind, 'is_custom' => false, 'sort_order' => $kind === 'Part' ? 0 : 1]
        );
    }

    /** Create the item and its default controls (same rules as ItemController). */
    public function createItem(Category $category, array $data): Item
    {
        // TODO: ItemController has similar control-creation logic; merge in a later refactor.
        $maxOrder = $category->items()->max('sort_order') ?? 0;
        $payload = [
            'no' => $data['no'] ?? '-',
            'description' => $data['description'],
            'dimension' => $data['dimension'] ?? '',
            'material' => $data['material'] ?? '',
            'qty' => $data['qty'] ?? 1,
            'hrc' => $data['hrc'] ?? '',
            'sort_order' => $maxOrder + 1,
        ];
        if (!empty($data['id'])) {
            $payload['id'] = $data['id'];
        }
        $item = $category->items()->create($payload);

        $processes = $category->kind === 'Part' ? self::PART_PROCESSES : self::COMPONENT_PROCESSES;
        foreach ($processes as $proc) {
            Control::create([
                'item_id' => $item->id,
                'process' => $proc,
                'status' => in_array($proc, ['Material', 'PO', 'Arrival'], true) ? 'Not Started' : '-',
                'notes' => '',
            ]);
        }
        return $item;
    }
}
