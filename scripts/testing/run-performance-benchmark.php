<?php

// Environment variable: MATRIX_PERF_TOKEN

$perfToken = getenv('MATRIX_PERF_TOKEN') ?: ($_ENV['MATRIX_PERF_TOKEN'] ?? null);
if (empty($perfToken)) {
    echo "Set MATRIX_PERF_TOKEN to a valid Sanctum token (php artisan tinker: User::where('role','controller')->first()->createToken('perf')->plainTextToken)\n";
    exit(1);
}

/**
 * MATRIX Performance & SLO Benchmark
 * Inspired by k6-perf-test-website skill:
 * - Measures TTFB (Time to First Byte), Connect time, and Total Latency
 * - Tests both cold and warm iterations per endpoint
 * - Validates SLO thresholds:
 *     - /health: p95 < 100ms
 *     - /projects: p95 < 250ms
 *     - /trackers/subcont: p95 < 300ms
 *     - /trackers/po: p95 < 300ms
 *     - /jos/{id}: p95 < 300ms
 */

require __DIR__ . '/../../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\JO;

echo "====================================================\n";
echo "       MATRIX PERFORMANCE & LATENCY AUDIT (SLOs)    \n";
echo "====================================================\n\n";

$firstJo = JO::first();
$joId = $firstJo ? $firstJo->id : null;

$endpoints = [
    ['name' => 'GET /api/health', 'url' => 'http://127.0.0.1:8000/api/health', 'slo' => 100],
    ['name' => 'GET /api/projects', 'url' => 'http://127.0.0.1:8000/api/projects', 'slo' => 250],
    ['name' => 'GET /api/trackers/subcont', 'url' => 'http://127.0.0.1:8000/api/trackers/subcont', 'slo' => 300],
    ['name' => 'GET /api/trackers/po', 'url' => 'http://127.0.0.1:8000/api/trackers/po', 'slo' => 300],
];

if ($joId) {
    $endpoints[] = ['name' => "GET /api/jos/{id}", 'url' => "http://127.0.0.1:8000/api/jos/{$joId}", 'slo' => 300];
}

$results = [];

function measureRequest(string $url, ?string $token = null): array {
    global $perfToken;
    $token = $token ?? $perfToken;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            "Authorization: Bearer {$token}",
            'Connection: close',
        ],
    ]);

    $start = microtime(true);
    $response = curl_exec($ch);
    $totalTime = (microtime(true) - $start) * 1000;

    $info = curl_getinfo($ch);
    curl_close($ch);

    return [
        'status' => $info['http_code'],
        'namelookup' => $info['namelookup_time'] * 1000,
        'connect' => $info['connect_time'] * 1000,
        'ttfb' => $info['starttransfer_time'] * 1000,
        'total' => $totalTime,
        'size' => $info['size_download'],
        'success' => ($info['http_code'] >= 200 && $info['http_code'] < 400),
    ];
}

$allPassed = true;

foreach ($endpoints as $ep) {
    echo "Benchmarking {$ep['name']} (10 iterations)...\n";
    $durations = [];
    $ttfbs = [];
    $errors = 0;

    // 10 iterations
    for ($i = 0; $i < 10; $i++) {
        $res = measureRequest($ep['url']);
        if ($res['success']) {
            $durations[] = $res['total'];
            $ttfbs[] = $res['ttfb'];
        } else {
            $errors++;
        }
        usleep(25000); // 25ms pacing
    }

    sort($durations);
    $count = count($durations);
    $min = $durations[0];
    $max = $durations[$count - 1];
    $avg = array_sum($durations) / $count;
    $p50 = $durations[(int)floor($count * 0.50)];
    $p90 = $durations[(int)floor($count * 0.90)];
    $p95 = $durations[(int)floor($count * 0.95)];
    $avgTtfb = array_sum($ttfbs) / $count;

    $passed = ($p95 <= $ep['slo']) && ($errors === 0);
    if (!$passed) $allPassed = false;

    $tag = $passed ? "[PASS]" : "[FAIL]";
    echo "  {$tag} p95: " . round($p95, 1) . "ms (SLO: <{$ep['slo']}ms) | Avg: " . round($avg, 1) . "ms | TTFB: " . round($avgTtfb, 1) . "ms | Min: " . round($min, 1) . "ms | Max: " . round($max, 1) . "ms\n\n";

    $results[] = [
        'endpoint' => $ep['name'],
        'url' => $ep['url'],
        'slo' => $ep['slo'],
        'samples' => $count,
        'errors' => $errors,
        'min_ms' => round($min, 2),
        'avg_ms' => round($avg, 2),
        'p50_ms' => round($p50, 2),
        'p90_ms' => round($p90, 2),
        'p95_ms' => round($p95, 2),
        'max_ms' => round($max, 2),
        'ttfb_avg_ms' => round($avgTtfb, 2),
        'passed_slo' => $passed,
    ];
}

echo "====================================================\n";
$passedCount = count(array_filter($results, fn($r) => $r['passed_slo']));
$totalEndpoints = count($results);
echo "PERFORMANCE SUMMARY: {$passedCount}/{$totalEndpoints} Endpoints Met SLO Targets\n";
echo "SLO Compliance: " . round(($passedCount / $totalEndpoints) * 100, 1) . "%\n";
echo "====================================================\n";

file_put_contents(__DIR__ . '/performance-benchmark-results.json', json_encode($results, JSON_PRETTY_PRINT));
exit($allPassed ? 0 : 1);
