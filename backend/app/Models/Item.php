<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'id',
        'category_id',
        'no',
        'description',
        'dimension',
        'material',
        'qty',
        'hrc',
        'is_subcont',
        'subcont_notes',
        'subcont_supplier',
        'subcont_status',
        'subcont_process',
        'subcont_dispatch_date',
        'subcont_done_at',
        'arrival_target_date',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_subcont' => 'boolean',
            'qty' => 'integer',
            'sort_order' => 'integer',
            'subcont_dispatch_date' => 'datetime',
            'subcont_done_at' => 'datetime',
            'arrival_target_date' => 'date:Y-m-d',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function controls(): HasMany
    {
        return $this->hasMany(Control::class, 'item_id');
    }
}
