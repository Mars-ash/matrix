<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JO extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'jos';

    protected $fillable = [
        'project_id',
        'jo_number',
        'product',
        'type',
        'target_date',
        'finish_date',
    ];

    protected function casts(): array
    {
        return [
            'target_date' => 'date:Y-m-d',
            'finish_date' => 'date:Y-m-d',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class, 'jo_id')->orderBy('sort_order');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'jo_id')->latest();
    }

    public function trialSessions(): HasMany
    {
        return $this->hasMany(TrialSession::class, 'jo_id')->latest('trial_date');
    }
}
