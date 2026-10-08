<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'engineering@matrix.com'],
            [
                'name' => 'Staff Engineering',
                'username' => 'matrix',
                'password' => \Illuminate\Support\Facades\Hash::make(env('DEMO_STAFF_PASSWORD', 'eng#1')),
                'role' => 'controller',
            ]
        );

        User::firstOrCreate(
            ['email' => 'viewer@matrix.com'],
            [
                'name' => 'Viewer',
                'username' => 'matrix#1',
                'password' => \Illuminate\Support\Facades\Hash::make(env('DEMO_VIEWER_PASSWORD', 'matrix#1')),
                'role' => 'viewer',
            ]
        );

        $this->call(DemoSeeder::class);
    }
}
