<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrialFinding extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'id',
        'trial_session_id',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }

    public function trialSession(): BelongsTo
    {
        return $this->belongsTo(TrialSession::class, 'trial_session_id');
    }

    public function session(): BelongsTo
    {
        return $this->trialSession();
    }

    public function entries(): HasMany
    {
        return $this->hasMany(TrialEntry::class, 'trial_finding_id')->orderBy('order');
    }

    public function problems(): HasMany
    {
        return $this->hasMany(TrialEntry::class, 'trial_finding_id')
            ->where('section', 'problems')
            ->orderBy('order');
    }

    public function causes(): HasMany
    {
        return $this->hasMany(TrialEntry::class, 'trial_finding_id')
            ->where('section', 'causes')
            ->orderBy('order');
    }

    public function correctiveActions(): HasMany
    {
        return $this->hasMany(TrialEntry::class, 'trial_finding_id')
            ->where('section', 'correctiveActions')
            ->orderBy('order');
    }

    public function resolveRouteBinding($value, $field = null)
    {
        if (!\Illuminate\Support\Str::isUuid($value)) {
            return null;
        }

        return parent::resolveRouteBinding($value, $field);
    }
}
