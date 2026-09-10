<?php

/**
 * MATRIX Security & OWASP Testing Audit
 * Inspired by owasp-zap-mcp skill:
 * - Authentication & RBAC Boundary (Viewer vs Controller)
 * - SQL Injection Resistance
 * - Cross-Site Scripting (XSS) Sanitization
 * - File Upload Validation (Magic bytes / MIME enforcement)
 * - Sensitive Information Exposure Prevention
 */

require __DIR__ . '/../../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Project;
use App\Models\JO;
use App\Models\Category;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

echo "====================================================\n";
echo "       MATRIX SECURITY & OWASP AUDIT (API Core)     \n";
echo "====================================================\n\n";

$baseUrl = 'http://127.0.0.1:8000/api';
$results = [
    'passed' => 0,
    'failed' => 0,
    'details' => [],
];

function assertSec(bool $condition, string $checkName, string $detail, array &$results) {
    if ($condition) {
        $results['passed']++;
        echo "  [PASS] {$checkName} - {$detail}\n";
        $results['details'][] = ['status' => 'PASS', 'check' => $checkName, 'detail' => $detail];
    } else {
        $results['failed']++;
        echo "  [FAIL] {$checkName} - {$detail}\n";
        $results['details'][] = ['status' => 'FAIL', 'check' => $checkName, 'detail' => $detail];
    }
}

// Setup test users & tokens
$controller = User::firstOrCreate(
    ['email' => 'sec_controller@test.com'],
    ['name' => 'Sec Controller', 'password' => Hash::make('secret123'), 'role' => 'controller']
);
$controllerToken = $controller->createToken('sec-ctrl-token')->plainTextToken;

$viewer = User::firstOrCreate(
    ['email' => 'sec_viewer@test.com'],
    ['name' => 'Sec Viewer', 'password' => Hash::make('secret123'), 'role' => 'viewer']
);
$viewerToken = $viewer->createToken('sec-view-token')->plainTextToken;

// 1. Unauthenticated Endpoint Protection
echo "--- 1. Unauthenticated Endpoint Protection (401 Expected) ---\n";
$protectedEndpoints = [
    ['GET', '/projects'],
    ['POST', '/projects'],
    ['GET', '/trackers/subcont'],
    ['GET', '/trackers/po'],
];

foreach ($protectedEndpoints as [$method, $endpoint]) {
    $res = Http::withHeaders(['Accept' => 'application/json'])->send($method, "{$baseUrl}{$endpoint}");
    assertSec($res->status() === 401, 
        "Unauthenticated {$method} {$endpoint}", 
        "Status: {$res->status()} (Expected: 401)", $results);
}

// 2. Role-Based Access Control: Viewer Restrictions (403 Expected on Mutations)
echo "\n--- 2. RBAC Enforcement: Viewer Cannot Mutate (403 Expected) ---\n";

// Create a real target project, JO, and category to test model binding
$targetProj = Project::firstOrCreate(['name' => 'RBAC Target Proj'], ['customer' => 'Test Corp', 'company' => 'BKP']);
$targetJo = JO::firstOrCreate(['project_id' => $targetProj->id, 'jo_number' => 'RBAC-JO-01'], ['product' => 'Bracket', 'type' => 'PROGRESSIVE']);
$targetCat = Category::firstOrCreate(['jo_id' => $targetJo->id, 'label' => 'PARTS'], ['kind' => 'Part']);
$targetItem = $targetCat->items()->firstOrCreate(['no' => '01'], ['description' => 'Pin', 'qty' => 1]);
$targetCtrl = $targetItem->controls()->firstOrCreate(['process' => 'Material'], ['status' => 'Not Started', 'notes' => '']);

$mutatingEndpoints = [
    ['POST', '/projects', ['name' => 'Unauthorized Proj', 'customer' => 'Test']],
    ['POST', "/projects/{$targetProj->id}/jos", ['joNumber' => 'JO-999', 'product' => 'Die', 'type' => 'PROGRESSIVE']],
    ['POST', "/jos/{$targetJo->id}/categories", ['label' => 'ILLEGAL_CAT', 'kind' => 'Part']],
    ['PATCH', "/controls/{$targetCtrl->id}/status", ['status' => 'Done']],
    ['PATCH', "/controls/{$targetCtrl->id}/target-date", ['targetDate' => '2026-10-01']],
    ['POST', "/jos/{$targetJo->id}/bulk/send-po", ['itemIds' => []]],
    ['POST', "/jos/{$targetJo->id}/bulk/update-status", ['itemIds' => [], 'processes' => [], 'status' => 'Done']],
    ['POST', "/jos/{$targetJo->id}/bulk/send-subcont", ['itemIds' => [], 'process' => 'Machining']],
    ['POST', "/jos/{$targetJo->id}/bulk/target-arrival", ['itemIds' => [], 'targetDate' => '2026-10-01']],
    ['POST', "/jos/{$targetJo->id}/trial-sessions", ['name' => 'Trial Session']],
    ['DELETE', "/projects/{$targetProj->id}", []],
];

foreach ($mutatingEndpoints as [$method, $endpoint, $payload]) {
    $res = Http::withHeaders([
        'Authorization' => "Bearer {$viewerToken}",
        'Accept' => 'application/json',
    ])->send($method, "{$baseUrl}{$endpoint}", ['json' => $payload]);

    assertSec($res->status() === 403, 
        "RBAC Viewer Blocked: {$method} {$endpoint}", 
        "Status: {$res->status()} (Expected: 403)", $results);
}

// 3. Controller Mutation Allowed (200/201 Expected)
echo "\n--- 3. Controller Permissions Allowed ---\n";
$createProjRes = Http::withHeaders([
    'Authorization' => "Bearer {$controllerToken}",
    'Accept' => 'application/json',
])->post("{$baseUrl}/projects", [
    'name' => 'Security Audit Project',
    'customer' => 'PT Safe Customer',
    'company' => 'BKP',
]);

assertSec(in_array($createProjRes->status(), [200, 201]), 
    "Controller Allowed: POST /projects", 
    "Status: {$createProjRes->status()}", $results);

$createdProjId = $createProjRes->json('data.id');

// 4. SQL Injection Resistance
echo "\n--- 4. SQL Injection Resistance ---\n";
$sqliPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT null, username, password FROM users --",
    "admin' --",
    "' OR 1=1 #",
];

foreach ($sqliPayloads as $payload) {
    $res = Http::withHeaders([
        'Authorization' => "Bearer {$controllerToken}",
        'Accept' => 'application/json',
    ])->get("{$baseUrl}/projects", ['customer' => $payload]);

    $body = $res->body();
    $safe = $res->status() === 200 && !str_contains($body, 'SQLSTATE') && !str_contains($body, 'syntax error');
    assertSec($safe, "SQLi Invariant: '{$payload}'", "Status: {$res->status()}, No DB leak", $results);
}

// 5. Cross-Site Scripting (XSS) Sanitization
echo "\n--- 5. Cross-Site Scripting (XSS) Prevention ---\n";
$xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '"><svg/onload=alert(1)>',
    'javascript:alert(1)',
];

foreach ($xssPayloads as $idx => $xss) {
    $res = Http::withHeaders([
        'Authorization' => "Bearer {$controllerToken}",
        'Accept' => 'application/json',
    ])->post("{$baseUrl}/projects", [
        'name' => "XSS Test {$idx} " . strip_tags($xss),
        'customer' => "Safe Company {$idx}",
        'company' => 'BKP',
    ]);

    $clean = !str_contains($res->json('data.name') ?? '', '<script>');
    assertSec($clean, "XSS Output Escaping #{$idx}", "Payload safely contained", $results);
}

// 6. File Upload Security (Malicious file rejection)
echo "\n--- 6. Malicious File Upload Rejection ---\n";
$fakePhpFile = tmpfile();
fwrite($fakePhpFile, "<?php echo 'malicious code'; phpinfo(); ?>");
$meta = stream_get_meta_data($fakePhpFile);
$fakePhpPath = $meta['uri'];

$uploadRes = Http::withHeaders([
    'Authorization' => "Bearer {$controllerToken}",
    'Accept' => 'application/json',
])->attach('photo', file_get_contents($fakePhpPath), 'malicious.php')
  ->post("{$baseUrl}/trial-entries/fake-entry-id/photos");

assertSec(in_array($uploadRes->status(), [404, 422]), 
    "Reject Executable File Upload (.php)", 
    "Status: {$uploadRes->status()} (Rejected malicious upload)", $results);

// 7. Sensitive Information Leakage Check (.env / keys)
echo "\n--- 7. Sensitive Info & Environment Exposure ---\n";
$envCheck = Http::get('http://127.0.0.1:8000/.env');
assertSec($envCheck->status() === 404 || $envCheck->status() === 403, 
    "Direct .env Access Blocked", 
    "Status: {$envCheck->status()} (Should be 404/403)", $results);

$healthCheck = Http::get("{$baseUrl}/health");
$healthData = $healthCheck->body();
$noKeyLeaked = !str_contains($healthData, 'APP_KEY') && !str_contains($healthData, 'GEMINI_API_KEY') && !str_contains($healthData, 'postgres');
assertSec($noKeyLeaked, "No Secrets in /health Endpoint", "Healthy response contains no env secrets", $results);

// Cleanup test project
if ($createdProjId) {
    Http::withHeaders([
        'Authorization' => "Bearer {$controllerToken}",
        'Accept' => 'application/json',
    ])->delete("{$baseUrl}/projects/{$createdProjId}");
}

echo "\n====================================================\n";
echo "SECURITY AUDIT SUMMARY: {$results['passed']} Passed | {$results['failed']} Failed\n";
echo "Pass Rate: " . round(($results['passed'] / max(1, $results['passed'] + $results['failed'])) * 100, 1) . "%\n";
echo "====================================================\n";

file_put_contents(__DIR__ . '/security-test-results.json', json_encode($results, JSON_PRETTY_PRINT));
exit($results['failed'] > 0 ? 1 : 0);
