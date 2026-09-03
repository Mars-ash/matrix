<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PoTracking extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'po_trackings';

    protected $fillable = [
        'control_id',
        'supplier',
        'po_no',
        'po_date',
        'target_arrival',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'po_date' => 'date:Y-m-d',
            'target_arrival' => 'date:Y-m-d',
        ];
    }

    public function control(): BelongsTo
    {
        return $this->belongsTo(Control::class, 'control_id');
    }
}
