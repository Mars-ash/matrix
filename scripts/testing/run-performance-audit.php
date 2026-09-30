<?php

// Environment variable: MATRIX_PERF_TOKEN

$perfToken = getenv('MATRIX_PERF_TOKEN') ?: ($_ENV['MATRIX_PERF_TOKEN'] ?? null);
if (empty($perfToken)) {
    echo "Set MATRIX_PERF_TOKEN to a valid Sanctum token (php artisan tinker: User::where('role','controller')->first()->createToken('perf')->plainTextToken)\n";
    exit(1);
}

/**
 * MATRIX Performance Audit Script
 * Measures:
 * 1. Internal Application Dispatch Latency (Pure PHP + Framework + DB)
 * 2. Network HTTP Round-Trip Latency
 * 3. Compares with SLO thresholds (<100ms, <250ms, <300ms)
 */

require __DIR__ . '/../../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Models\JO;

echo "====================================================\n";
echo "       MATRIX PERFORMANCE & LATENCY AUDIT (SLOs)    \n";
echo "====================================================\n\n";

$firstJo = JO::first();
$joId = $firstJo ? $firstJo->id : 'default';

$testRoutes = [
    ['name' => 'Health Check', 'uri' => '/api/health', 'slo' => 100],
    ['name' => 'Projects List', 'uri' => '/api/projects', 'slo' => 250],
    ['name' => 'Subcont Tracker', 'uri' => '/api/trackers/subcont', 'slo' => 300],
    ['name' => 'PO Tracker', 'uri' => '/api/trackers/po', 'slo' => 300],
];

if ($firstJo) {
    $testRoutes[] = ['name' => 'JO Detail', 'uri' => "/api/jos/{$firstJo->id}", 'slo' => 300];
}

$report = [];

echo "--- 1. Application Kernel & Database Dispatch Benchmarks ---\n";

foreach ($testRoutes as $route) {
    $times = [];
    // 10 iterations per route
    for ($i = 0; $i < 10; $i++) {
        $req = Request::create($route['uri'], 'GET');
        $req->headers->set('Accept', 'application/json');
        $req->headers->set('Authorization', "Bearer {$perfToken}");

        $t0 = microtime(true);
        $res = $kernel->handle($req);
        $durationMs = (microtime(true) - $t0) * 1000;
        $times[] = $durationMs;
        $kernel->terminate($req, $res);
    }

    sort($times);
    $count = count($times);
    $min = $times[0];
    $max = $times[$count - 1];
    $avg = array_sum($times) / $count;
    $p50 = $times[(int)floor($count * 0.50)];
    $p90 = $times[(int)floor($count * 0.90)];
    $p95 = $times[(int)floor($count * 0.95)];

    $passed = ($p95 <= $route['slo']);
    $tag = $passed ? "[PASS]" : "[FAIL]";

    echo "  {$tag} {$route['name']} ({$route['uri']})\n";
    echo "       p95: " . round($p95, 2) . "ms (SLO: <{$route['slo']}ms) | Avg: " . round($avg, 2) . "ms | Min: " . round($min, 2) . "ms | Max: " . round($max, 2) . "ms\n\n";

    $report[] = [
        'name' => $route['name'],
        'uri' => $route['uri'],
        'slo_ms' => $route['slo'],
        'p50_ms' => round($p50, 2),
        'p95_ms' => round($p95, 2),
        'avg_ms' => round($avg, 2),
        'min_ms' => round($min, 2),
        'max_ms' => round($max, 2),
        'passed' => $passed,
    ];
}

$passedCount = count(array_filter($report, fn($r) => $r['passed']));
$totalCount = count($report);

echo "====================================================\n";
echo "PERFORMANCE SUMMARY: {$passedCount}/{$totalCount} Endpoints Met SLO Targets\n";
echo "SLO Compliance: " . round(($passedCount / $totalCount) * 100, 1) . "%\n";
echo "====================================================\n";

file_put_contents(__DIR__ . '/performance-audit-results.json', json_encode($report, JSON_PRETTY_PRINT));
exit($passedCount === $totalCount ? 0 : 1);
