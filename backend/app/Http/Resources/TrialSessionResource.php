<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrialSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'joId' => $this->jo_id,
            'name' => $this->name,
            'trialDate' => $this->trial_date?->format('Y-m-d') ?? '',
            'updateDate' => $this->update_date?->format('Y-m-d') ?? '',
            'customer' => $this->customer ?? '',
            'jobNo' => $this->job_no ?? '',
            'picName' => $this->pic_name ?? '',
            'approvedByName' => $this->approved_by_name ?? '',
            'findings' => TrialFindingResource::collection($this->whenLoaded('findings')),
            'publishedSnapshot' => $this->published_snapshot,
            'lastPublishedAt' => $this->last_published_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
