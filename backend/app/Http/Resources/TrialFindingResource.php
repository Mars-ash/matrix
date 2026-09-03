<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrialFindingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $entries = $this->whenLoaded('entries');

        $problems = [];
        $causes = [];
        $correctiveActions = [];

        if ($entries) {
            foreach ($entries as $entry) {
                $photoData = TrialEntryPhotoResource::collection($entry->photos ?? collect());

                if ($entry->section === 'problems') {
                    $problems[] = [
                        'id' => $entry->id,
                        'order' => (int) $entry->order,
                        'text' => $entry->text ?? '',
                        'photos' => $photoData,
                        'createdAt' => $entry->created_at?->toISOString(),
                        'updatedAt' => $entry->updated_at?->toISOString(),
                    ];
                } elseif ($entry->section === 'causes') {
                    $causes[] = [
                        'id' => $entry->id,
                        'order' => (int) $entry->order,
                        'text' => $entry->text ?? '',
                        'photos' => $photoData,
                        'createdAt' => $entry->created_at?->toISOString(),
                        'updatedAt' => $entry->updated_at?->toISOString(),
                    ];
                } elseif ($entry->section === 'correctiveActions') {
                    $correctiveActions[] = [
                        'id' => $entry->id,
                        'order' => (int) $entry->order,
                        'text' => $entry->text ?? '',
                        'targetDate' => $entry->target_date?->format('Y-m-d') ?? '',
                        'pic' => $entry->pic ?? '',
                        'status' => $entry->status ?? 'On Process',
                        'photos' => $photoData,
                        'createdAt' => $entry->created_at?->toISOString(),
                        'updatedAt' => $entry->updated_at?->toISOString(),
                    ];
                }
            }
        }

        // Sort by order
        usort($problems, fn ($a, $b) => $a['order'] <=> $b['order']);
        usort($causes, fn ($a, $b) => $a['order'] <=> $b['order']);
        usort($correctiveActions, fn ($a, $b) => $a['order'] <=> $b['order']);

        return [
            'id' => $this->id,
            'order' => (int) $this->order,
            'problems' => $problems,
            'causes' => $causes,
            'correctiveActions' => $correctiveActions,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
