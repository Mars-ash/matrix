<?php

use App\Http\Controllers\Api\BulkActionController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ControlController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\JOController;
use App\Http\Controllers\Api\PoTrackerController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SubcontTrackerController;
use App\Http\Controllers\Api\TrialSessionController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::get('/health', fn () => response()->json(['status' => 'healthy', 'app' => 'MATRIX', 'time' => now()->toIso8601String()]));

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// OCR Vision AI Standalone Extraction
Route::post('/ocr/extract', [\App\Http\Controllers\Api\OcrController::class, 'extract']);

/*
|--------------------------------------------------------------------------
| Protected Domain REST API Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth.token')->group(function () {
    // Read-only endpoints (Accessible to all authenticated users: controller & viewer)
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::get('/jos/{jo}', [JOController::class, 'show']);
    Route::get('/trackers/subcont', [SubcontTrackerController::class, 'index']);
    Route::get('/trackers/po', [PoTrackerController::class, 'index']);

    // Trial Sessions (Read)
    Route::get('/jos/{jo}/trial-sessions', [TrialSessionController::class, 'index']);
    Route::get('/trial-sessions/{session}', [TrialSessionController::class, 'show']);

    // Mutating endpoints (Strictly restricted to 'controller' role)
    Route::middleware('role.controller')->group(function () {
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);
        Route::post('/projects/{project}/jos', [JOController::class, 'store']);
        Route::delete('/jos/{jo}', [JOController::class, 'destroy']);
        Route::patch('/jos/{jo}/finish', [JOController::class, 'finish']);
        Route::patch('/jos/{jo}/restore', [JOController::class, 'restore']);

        Route::post('/jos/{jo}/categories', [CategoryController::class, 'store']);
        Route::post('/categories/{category}/items', [ItemController::class, 'store']);
        Route::post('/categories/{category}/items/batch', [ItemController::class, 'batchStore']);
        Route::post('/categories/{category}/ocr-upload', [\App\Http\Controllers\Api\OcrController::class, 'upload']);
        Route::put('/items/{item}', [ItemController::class, 'update']);
        Route::delete('/items/{item}', [ItemController::class, 'destroy']);
        Route::post('/items/batch-delete', [ItemController::class, 'batchDestroy']);
        Route::patch('/items/{item}/subcont', [ItemController::class, 'updateSubcont']);

        Route::patch('/controls/{control}/status', [ControlController::class, 'updateStatus']);
        Route::patch('/controls/{control}/target-date', [ControlController::class, 'updateTargetDate']);
        Route::patch('/controls/{control}/po-tracking', [ControlController::class, 'updatePoTracking']);
        Route::post('/controls/{control}/photos', [ControlController::class, 'uploadPhoto']);
        Route::delete('/process-photos/{photo}', [ControlController::class, 'deletePhoto']);

        Route::post('/jos/{jo}/bulk/send-po', [BulkActionController::class, 'bulkSendPo']);
        Route::post('/jos/{jo}/bulk/update-status', [BulkActionController::class, 'bulkUpdateStatus']);
        Route::post('/jos/{jo}/bulk/send-subcont', [BulkActionController::class, 'bulkSendSubcont']);
        Route::post('/jos/{jo}/bulk/target-arrival', [BulkActionController::class, 'bulkTargetArrival']);

        // Trial Sessions & Photos (Mutating)
        Route::post('/jos/{jo}/trial-sessions', [TrialSessionController::class, 'store']);
        Route::patch('/trial-sessions/{session}', [TrialSessionController::class, 'update']);
        Route::post('/trial-sessions/{session}/publish', [TrialSessionController::class, 'publish']);
        Route::post('/trial-sessions/{session}/duplicate', [TrialSessionController::class, 'duplicate']);
        Route::delete('/trial-sessions/{session}', [TrialSessionController::class, 'destroy']);

        Route::post('/trial-sessions/{session}/findings', [TrialSessionController::class, 'addFinding']);
        Route::delete('/trial-findings/{finding}', [TrialSessionController::class, 'deleteFinding']);

        Route::post('/trial-findings/{finding}/entries', [TrialSessionController::class, 'addEntry']);
        Route::patch('/trial-entries/{entry}', [TrialSessionController::class, 'updateEntry']);
        Route::delete('/trial-entries/{entry}', [TrialSessionController::class, 'deleteEntry']);

        Route::post('/trial-entries/{entry}/photos', [TrialSessionController::class, 'uploadPhoto']);
        Route::delete('/trial-entry-photos/{photo}', [TrialSessionController::class, 'deletePhoto']);
    });
});
