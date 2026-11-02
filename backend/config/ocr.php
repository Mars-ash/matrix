<?php

// Support primary GEMINI_API_KEY and optional comma-separated GEMINI_API_KEYS for failover rotation
$keys = [];
if ($singleKey = env('GEMINI_API_KEY')) {
    $keys[] = trim($singleKey);
}
if ($b1 = env('GEMINI_API_KEY_BACKUP_1')) {
    $keys[] = trim($b1);
}
if ($b2 = env('GEMINI_API_KEY_BACKUP_2')) {
    $keys[] = trim($b2);
}
if ($keysStr = env('GEMINI_API_KEYS')) {
    $keys = array_merge($keys, array_map('trim', explode(',', $keysStr)));
}
$apiKeys = array_values(array_unique(array_filter($keys)));

return [
    /*
    |--------------------------------------------------------------------------
    | Google Gemini Vision AI API Configuration
    |--------------------------------------------------------------------------
    | Used for OCR extraction of engineering drawing / table images into MATRIX items.
    | Set GEMINI_API_KEY as primary. If quota exhaustion occurs, supply multiple
    | comma-separated keys in GEMINI_API_KEYS for round-robin rotation.
    */
    'gemini_api_key' => env('GEMINI_API_KEY', $apiKeys[0] ?? ''),
    'api_keys' => $apiKeys,
    'model' => env('GEMINI_OCR_MODEL', 'gemini-flash-lite-latest'),
    'base_url' => env('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
];
