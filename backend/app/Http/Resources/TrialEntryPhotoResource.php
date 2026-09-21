<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class TrialEntryPhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        if (str_starts_with($this->path, 'data:') || str_starts_with($this->path, 'blob:')) {
            $url = $this->path;
        } else {
            $rawUrl = str_starts_with($this->path, 'http') ? $this->path : Storage::disk('public')->url($this->path);
            $url = preg_match('#(/storage/.*)$#', $rawUrl, $matches) ? $matches[1] : $rawUrl;
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'previewUrl' => $url,
            'addedAt' => $this->added_at?->toISOString() ?? $this->created_at?->toISOString(),
        ];
    }
}
