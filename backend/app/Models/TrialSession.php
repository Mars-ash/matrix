<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrialSession extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'id',
        'jo_id',
        'name',
        'trial_date',
        'update_date',
        'customer',
        'job_no',
        'pic_name',
        'approved_by_name',
        'published_snapshot',
        'last_published_at',
    ];

    protected function casts(): array
    {
        return [
            'trial_date' => 'date:Y-m-d',
            'update_date' => 'date:Y-m-d',
            'published_snapshot' => 'array',
            'last_published_at' => 'datetime',
        ];
    }

    public function jo(): BelongsTo
    {
        return $this->belongsTo(JO::class, 'jo_id');
    }

    public function findings(): HasMany
    {
        return $this->hasMany(TrialFinding::class, 'trial_session_id')->orderBy('order');
    }
}
