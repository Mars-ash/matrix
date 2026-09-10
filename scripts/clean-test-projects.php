<?php

require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Project;

echo "--- Current Projects in Database ---\n";
$projects = Project::all();
foreach ($projects as $p) {
    echo "ID: {$p->id} | Name: {$p->name} | Customer: {$p->customer}\n";
}

echo "\n--- Deleting Test Projects ---\n";
$deleted = 0;
foreach ($projects as $p) {
    if (
        str_contains($p->name, 'XSS Test') ||
        str_contains($p->name, 'RBAC Target') ||
        str_contains($p->name, 'Security Audit') ||
        str_contains($p->name, 'Unauthorized') ||
        str_contains($p->name, 'DB Test')
    ) {
        echo "Deleting test project: [{$p->id}] {$p->name}...\n";
        $p->delete(); // Cascades to JOs, categories, items, controls, etc.
        $deleted++;
    }
}

echo "\nTotal deleted test projects: {$deleted}\n";

echo "\n--- Remaining Projects in Database ---\n";
foreach (Project::all() as $p) {
    echo "ID: {$p->id} | Name: {$p->name} | Customer: {$p->customer}\n";
}
