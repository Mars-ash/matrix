<?php

// Collect configured keys from all supported environment formats
$keys = [];
if ($keysStr = env('GEMINI_API_KEYS')) {
    $keys = array_merge($keys, array_map('trim', explode(',', $keysStr)));
}
if ($singleKey = env('GEMINI_API_KEY')) {
    $keys[] = trim($singleKey);
}
if ($backup1 = env('GEMINI_API_KEY_BACKUP_1')) {
    $keys[] = trim($backup1);
}
if ($backup2 = env('GEMINI_API_KEY_BACKUP_2')) {
    $keys[] = trim($backup2);
}
$apiKeys = array_values(array_unique(array_filter($keys)));

return [
    /*
    |--------------------------------------------------------------------------
    | Google Gemini Vision AI API Configuration
    |--------------------------------------------------------------------------
    | Used for OCR extraction of engineering drawing / table images into MATRIX items.
    | Supports multiple API keys for automatic failover when quota/rate limits occur.
    */
    'gemini_api_key' => env('GEMINI_API_KEY', $apiKeys[0] ?? ''),
    'api_keys' => $apiKeys,
    'model' => env('GEMINI_OCR_MODEL', 'gemini-3.7-flash'),
    'base_url' => env('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
];

