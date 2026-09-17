<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('app:seed-737d', function () {
    $p = \App\Models\Project::firstOrCreate(
        ['name' => '737D'],
        [
            'customer' => 'PT Panasonic Manufacturing',
            'company' => 'BMI',
        ]
    );

    $jo = \App\Models\JO::firstOrCreate(
        [
            'project_id' => $p->id,
            'jo_number' => '128.010',
        ],
        [
            'product' => 'Air Conditioner Base Pan',
            'type' => 'PROGRESSIVE',
            'target_date' => now()->addDays(60)->toDateString(),
        ]
    );

    $this->info("Project 737D seeded: {$p->id}");
});

