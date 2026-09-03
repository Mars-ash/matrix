<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'jo_id',
        'label',
        'kind',
        'is_custom',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_custom' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function jo(): BelongsTo
    {
        return $this->belongsTo(JO::class, 'jo_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'category_id')->orderBy('sort_order');
    }
}
