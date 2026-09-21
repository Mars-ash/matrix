<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ControlResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'process' => $this->process,
            'status' => $this->status,
            'notes' => $this->notes ?? '',
            'inProgressAt' => $this->in_progress_at?->toISOString(),
            'targetDate' => $this->target_date?->format('Y-m-d'),
            'poTracking' => $this->whenLoaded('poTracking', fn () => $this->poTracking ? new PoTrackingResource($this->poTracking) : null, $this->poTracking ? new PoTrackingResource($this->poTracking) : null),
            'photos' => $this->whenLoaded('photos', fn () => $this->photos->map(function ($p) {
                if (str_starts_with($p->path, 'data:') || str_starts_with($p->path, 'blob:')) {
                    $url = $p->path;
                } else {
                    $rawUrl = str_starts_with($p->path, 'http') ? $p->path : Storage::disk('public')->url($p->path);
                    $url = preg_match('#(/storage/.*)$#', $rawUrl, $matches) ? $matches[1] : $rawUrl;
                }
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'previewUrl' => $url,
                ];
            })),
        ];
    }
}
