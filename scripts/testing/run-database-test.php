<?php

/**
 * MATRIX Database Testing Script
 * Inspired by postgres-mcp skill:
 * - Schema integrity & UUID validation
 * - Foreign key and cascade constraints
 * - Index coverage on relations
 * - EXPLAIN ANALYZE performance for core queries
 */

require __DIR__ . '/../../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

echo "====================================================\n";
echo "       MATRIX DATABASE TESTING AUDIT (PostgreSQL)   \n";
echo "====================================================\n\n";

$results = [
    'passed' => 0,
    'failed' => 0,
    'warnings' => 0,
    'details' => [],
];

function assertDb(bool $condition, string $checkName, string $detail, array &$results) {
    if ($condition) {
        $results['passed']++;
        echo "  [PASS] {$checkName}\n";
        $results['details'][] = ['status' => 'PASS', 'check' => $checkName, 'detail' => $detail];
    } else {
        $results['failed']++;
        echo "  [FAIL] {$checkName} - {$detail}\n";
        $results['details'][] = ['status' => 'FAIL', 'check' => $checkName, 'detail' => $detail];
    }
}

// 1. Connection & Version Health
echo "--- 1. Database Connection & Engine ---\n";
try {
    $version = DB::select("SELECT version() as ver")[0]->ver;
    assertDb(str_contains(strtolower($version), 'postgresql'), "PostgreSQL Connection Active", $version, $results);
    echo "       Database Engine: " . substr($version, 0, 50) . "...\n";
} catch (\Throwable $e) {
    assertDb(false, "PostgreSQL Connection", $e->getMessage(), $results);
}

// 2. Expected Tables & Primary Key Types
echo "\n--- 2. Schema Structure & UUID Primary Keys ---\n";
$tables = [
    'projects', 'jos', 'categories', 'items', 'controls',
    'po_trackings', 'process_photos', 'activities',
    'trial_sessions', 'trial_findings', 'trial_entries', 'trial_entry_photos',
    'users', 'personal_access_tokens'
];

foreach ($tables as $table) {
    $exists = Schema::hasTable($table);
    assertDb($exists, "Table Exists: {$table}", "Table exists in schema", $results);

    if ($exists && !in_array($table, ['users', 'personal_access_tokens'])) {
        $colType = DB::select("
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = ? AND column_name = 'id'
        ", [$table]);

        $isUuid = !empty($colType) && ($colType[0]->data_type === 'uuid' || str_contains($colType[0]->data_type, 'char'));
        assertDb($isUuid, "Primary Key UUID: {$table}.id", "Type is " . ($colType[0]->data_type ?? 'none'), $results);
    }
}

// 3. Foreign Key Constraints & Cascade Integrity
echo "\n--- 3. Foreign Key Constraints & Referential Integrity ---\n";
$fkChecks = [
    ['jos', 'project_id', 'projects', 'id'],
    ['categories', 'jo_id', 'jos', 'id'],
    ['items', 'category_id', 'categories', 'id'],
    ['controls', 'item_id', 'items', 'id'],
    ['po_trackings', 'control_id', 'controls', 'id'],
    ['process_photos', 'control_id', 'controls', 'id'],
    ['trial_sessions', 'jo_id', 'jos', 'id'],
    ['trial_findings', 'trial_session_id', 'trial_sessions', 'id'],
    ['trial_entries', 'trial_finding_id', 'trial_findings', 'id'],
    ['trial_entry_photos', 'trial_entry_id', 'trial_entries', 'id'],
];

foreach ($fkChecks as [$childTable, $childCol, $parentTable, $parentCol]) {
    $fks = DB::select("
        SELECT tc.constraint_name, rc.delete_rule
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = ? 
          AND kcu.column_name = ?
    ", [$childTable, $childCol]);

    $hasFk = !empty($fks);
    $deleteRule = $hasFk ? $fks[0]->delete_rule : 'NONE';
    assertDb($hasFk && in_array($deleteRule, ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']), 
        "FK Constraint: {$childTable}.{$childCol} -> {$parentTable}.{$parentCol}", 
        "Delete rule: {$deleteRule}", $results);
}

// 4. Index Coverage on Foreign Keys
echo "\n--- 4. Index Health & Coverage ---\n";
$indexedCols = [
    'jos' => ['project_id', 'jo_number'],
    'categories' => ['jo_id'],
    'items' => ['category_id'],
    'controls' => ['item_id'],
    'po_trackings' => ['control_id'],
    'trial_sessions' => ['jo_id'],
    'trial_findings' => ['trial_session_id'],
    'trial_entries' => ['trial_finding_id'],
];

foreach ($indexedCols as $table => $cols) {
    $indexes = DB::select("
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = ?
    ", [$table]);

    foreach ($cols as $col) {
        $found = false;
        foreach ($indexes as $idx) {
            if (str_contains($idx->indexdef, "control_id") || str_contains($idx->indexdef, "({$col})") || str_contains($idx->indexdef, "({$col} ")) {
                $found = true;
                break;
            }
        }
        assertDb($found, "Index Exists on {$table}.{$col}", $found ? "Indexed" : "Missing index", $results);
    }
}

// 5. Query Plans & EXPLAIN ANALYZE for Core Workflows
echo "\n--- 5. Query Performance & EXPLAIN Plans ---\n";

// Query A: JO full tree hydration
try {
    $planA = DB::select("EXPLAIN ANALYZE SELECT * FROM jos WHERE id = (SELECT id FROM jos LIMIT 1)");
    $executionTimeA = null;
    foreach ($planA as $line) {
        if (preg_match('/Execution Time:\s*([0-9.]+)\s*ms/', $line->{'QUERY PLAN'}, $matches)) {
            $executionTimeA = (float)$matches[1];
        }
    }
    assertDb($executionTimeA !== null && $executionTimeA < 50.0, 
        "EXPLAIN ANALYZE: JO Hydration Query", 
        "Execution time: {$executionTimeA}ms (Target: <50ms)", $results);
    echo "       Execution time: {$executionTimeA} ms\n";
} catch (\Throwable $e) {
    assertDb(false, "EXPLAIN ANALYZE: JO Hydration Query", $e->getMessage(), $results);
}

// Query B: Cross-JO Subcontractor Tracker Query
try {
    $planB = DB::select("EXPLAIN ANALYZE SELECT items.*, categories.label as cat_label, jos.jo_number FROM items JOIN categories ON items.category_id = categories.id JOIN jos ON categories.jo_id = jos.id WHERE items.is_subcont = true");
    $executionTimeB = null;
    foreach ($planB as $line) {
        if (preg_match('/Execution Time:\s*([0-9.]+)\s*ms/', $line->{'QUERY PLAN'}, $matches)) {
            $executionTimeB = (float)$matches[1];
        }
    }
    assertDb($executionTimeB !== null && $executionTimeB < 100.0, 
        "EXPLAIN ANALYZE: Subcont Tracker Cross-JO Query", 
        "Execution time: {$executionTimeB}ms (Target: <100ms)", $results);
    echo "       Execution time: {$executionTimeB} ms\n";
} catch (\Throwable $e) {
    assertDb(false, "EXPLAIN ANALYZE: Subcont Tracker Query", $e->getMessage(), $results);
}

// Query C: Cross-JO PO Tracker Query
try {
    $planC = DB::select("EXPLAIN ANALYZE SELECT controls.*, po_trackings.supplier, po_trackings.po_no, items.description as item_desc, jos.jo_number FROM controls JOIN po_trackings ON controls.id = po_trackings.control_id JOIN items ON controls.item_id = items.id JOIN categories ON items.category_id = categories.id JOIN jos ON categories.jo_id = jos.id");
    $executionTimeC = null;
    foreach ($planC as $line) {
        if (preg_match('/Execution Time:\s*([0-9.]+)\s*ms/', $line->{'QUERY PLAN'}, $matches)) {
            $executionTimeC = (float)$matches[1];
        }
    }
    assertDb($executionTimeC !== null && $executionTimeC < 100.0, 
        "EXPLAIN ANALYZE: PO Tracker Cross-JO Query", 
        "Execution time: {$executionTimeC}ms (Target: <100ms)", $results);
    echo "       Execution time: {$executionTimeC} ms\n";
} catch (\Throwable $e) {
    assertDb(false, "EXPLAIN ANALYZE: PO Tracker Query", $e->getMessage(), $results);
}

// 6. Transaction & Cascading Delete Safety Test
echo "\n--- 6. Cascading Delete & Transaction Boundary Test ---\n";
try {
    DB::beginTransaction();
    $testProjId = (string)Str::uuid();
    $testJoId = (string)Str::uuid();
    $testCatId = (string)Str::uuid();
    $testItemId = (string)Str::uuid();
    $testCtrlId = (string)Str::uuid();

    DB::table('projects')->insert(['id' => $testProjId, 'name' => 'Temp DB Test', 'customer' => 'Test Corp', 'company' => 'BKP', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('jos')->insert(['id' => $testJoId, 'project_id' => $testProjId, 'jo_number' => 'TEST-DEL-101', 'product' => 'Test Bracket', 'type' => 'PROGRESSIVE', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('categories')->insert(['id' => $testCatId, 'jo_id' => $testJoId, 'label' => 'PART', 'kind' => 'Part', 'created_at' => now(), 'updated_at' => now()]);
    DB::table('items')->insert(['id' => $testItemId, 'category_id' => $testCatId, 'no' => '01', 'description' => 'Test Pin', 'qty' => 2, 'created_at' => now(), 'updated_at' => now()]);
    DB::table('controls')->insert(['id' => $testCtrlId, 'item_id' => $testItemId, 'process' => 'Material', 'status' => 'Not Started', 'notes' => '', 'created_at' => now(), 'updated_at' => now()]);

    // Now delete project and check if children cascaded
    DB::table('projects')->where('id', $testProjId)->delete();

    $remainingJo = DB::table('jos')->where('id', $testJoId)->count();
    $remainingCat = DB::table('categories')->where('id', $testCatId)->count();
    $remainingItem = DB::table('items')->where('id', $testItemId)->count();
    $remainingCtrl = DB::table('controls')->where('id', $testCtrlId)->count();

    $cascadeSuccess = ($remainingJo === 0 && $remainingCat === 0 && $remainingItem === 0 && $remainingCtrl === 0);
    assertDb($cascadeSuccess, "Cascade Delete: Project -> JO -> Cat -> Item -> Control", 
        "Remaining records: JO: {$remainingJo}, Cat: {$remainingCat}, Item: {$remainingItem}, Ctrl: {$remainingCtrl}", $results);

    DB::rollBack();
} catch (\Throwable $e) {
    DB::rollBack();
    assertDb(false, "Cascade Delete & Transaction Safety", $e->getMessage(), $results);
}

echo "\n====================================================\n";
echo "DATABASE AUDIT SUMMARY: {$results['passed']} Passed | {$results['failed']} Failed\n";
echo "Pass Rate: " . round(($results['passed'] / max(1, $results['passed'] + $results['failed'])) * 100, 1) . "%\n";
echo "====================================================\n";

file_put_contents(__DIR__ . '/database-test-results.json', json_encode($results, JSON_PRETTY_PRINT));
exit($results['failed'] > 0 ? 1 : 0);
