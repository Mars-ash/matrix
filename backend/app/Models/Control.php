<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Control extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'item_id',
        'process',
        'status',
        'notes',
        'in_progress_at',
        'target_date',
    ];

    protected function casts(): array
    {
        return [
            'in_progress_at' => 'datetime',
            'target_date' => 'date:Y-m-d',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    public function poTracking(): HasOne
    {
        return $this->hasOne(PoTracking::class, 'control_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ProcessPhoto::class, 'control_id')->latest('added_at');
    }
}
