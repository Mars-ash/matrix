<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'customer' => $this->customer,
            'company' => $this->company ?? 'BKP',
            'isSystem' => (bool) $this->is_system,
            'jos' => JOResource::collection($this->whenLoaded('jos')),
        ];
    }
}
