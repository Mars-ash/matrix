<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrialEntry extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'id',
        'trial_finding_id',
        'section',
        'order',
        'text',
        'target_date',
        'pic',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'target_date' => 'date:Y-m-d',
        ];
    }

    public function finding(): BelongsTo
    {
        return $this->belongsTo(TrialFinding::class, 'trial_finding_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(TrialEntryPhoto::class, 'trial_entry_id')->latest('added_at');
    }
}
