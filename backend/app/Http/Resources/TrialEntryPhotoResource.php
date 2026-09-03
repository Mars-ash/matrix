<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TrialEntryPhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $url = str_starts_with($this->path, 'http') || str_starts_with($this->path, 'data:')
            ? $this->path
            : Storage::disk('public')->url($this->path);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'previewUrl' => $url,
            'addedAt' => $this->added_at?->toISOString() ?? $this->created_at?->toISOString(),
        ];
    }
}
