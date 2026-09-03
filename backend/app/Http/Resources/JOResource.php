<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JOResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'projectId' => $this->project_id,
            'joNumber' => $this->jo_number,
            'product' => $this->product,
            'type' => $this->type,
            'targetDate' => $this->target_date?->format('Y-m-d'),
            'finishDate' => $this->finish_date?->format('Y-m-d'),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'activities' => $this->relationLoaded('activities')
                ? ActivityResource::collection($this->activities)
                : [],
        ];
    }
}
