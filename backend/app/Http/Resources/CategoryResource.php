<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'joId' => $this->jo_id,
            'label' => $this->label,
            'kind' => $this->kind,
            'isCustom' => (bool) $this->is_custom,
            'items' => ItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
