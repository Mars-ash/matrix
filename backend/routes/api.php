<?php

use App\Http\Controllers\Api\BulkActionController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ControlController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\JOController;
use App\Http\Controllers\Api\PoTrackerController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SubcontTrackerController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

/*
|--------------------------------------------------------------------------
| Protected Domain REST API Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    // Read-only endpoints (Accessible to all authenticated users: controller & viewer)
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::get('/jos/{jo}', [JOController::class, 'show']);
    Route::get('/trackers/subcont', [SubcontTrackerController::class, 'index']);
    Route::get('/trackers/po', [PoTrackerController::class, 'index']);

    // Mutating endpoints (Strictly restricted to 'controller' role)
    Route::middleware('role.controller')->group(function () {
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::post('/projects/{project}/jos', [JOController::class, 'store']);
        Route::patch('/jos/{jo}/finish', [JOController::class, 'finish']);

        Route::post('/jos/{jo}/categories', [CategoryController::class, 'store']);
        Route::post('/categories/{category}/items', [ItemController::class, 'store']);
        Route::post('/categories/{category}/items/batch', [ItemController::class, 'batchStore']);
        Route::patch('/items/{item}/subcont', [ItemController::class, 'updateSubcont']);

        Route::patch('/controls/{control}/status', [ControlController::class, 'updateStatus']);
        Route::patch('/controls/{control}/target-date', [ControlController::class, 'updateTargetDate']);
        Route::patch('/controls/{control}/po-tracking', [ControlController::class, 'updatePoTracking']);

        Route::post('/jos/{jo}/bulk/send-po', [BulkActionController::class, 'bulkSendPo']);
        Route::post('/jos/{jo}/bulk/update-status', [BulkActionController::class, 'bulkUpdateStatus']);
        Route::post('/jos/{jo}/bulk/send-subcont', [BulkActionController::class, 'bulkSendSubcont']);
        Route::post('/jos/{jo}/bulk/target-arrival', [BulkActionController::class, 'bulkTargetArrival']);
    });
});
