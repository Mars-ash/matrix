<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'categoryId' => $this->category_id,
            'no' => $this->no,
            'description' => $this->description,
            'dimension' => $this->dimension ?? '',
            'material' => $this->material ?? '',
            'qty' => (int) $this->qty,
            'hrc' => $this->hrc ?? '',
            'isSubcont' => (bool) $this->is_subcont,
            'subcontNotes' => $this->subcont_notes,
            'subcontSupplier' => $this->subcont_supplier,
            'subcontStatus' => $this->subcont_status,
            'subcontProcess' => $this->subcont_process,
            'subcontDispatchDate' => $this->subcont_dispatch_date?->toISOString(),
            'subcontDoneAt' => $this->subcont_done_at?->toISOString(),
            'arrivalTargetDate' => $this->arrival_target_date?->format('Y-m-d'),
            'controls' => ControlResource::collection($this->whenLoaded('controls')),
        ];
    }
}
