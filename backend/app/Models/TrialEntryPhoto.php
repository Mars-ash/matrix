<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrialEntryPhoto extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'id',
        'trial_entry_id',
        'name',
        'path',
        'added_at',
    ];

    protected function casts(): array
    {
        return [
            'added_at' => 'datetime',
        ];
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(TrialEntry::class, 'trial_entry_id');
    }
}
