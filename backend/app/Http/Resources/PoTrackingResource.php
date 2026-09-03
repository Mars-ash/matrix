<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PoTrackingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'supplier' => $this->supplier,
            'poNo' => $this->po_no,
            'poDate' => $this->po_date?->format('Y-m-d'),
            'targetArrival' => $this->target_arrival?->format('Y-m-d'),
            'notes' => $this->notes ?? '',
        ];
    }
}
