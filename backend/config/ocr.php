<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google Gemini Vision AI API Configuration
    |--------------------------------------------------------------------------
    | Used for OCR extraction of engineering drawing / table images into MATRIX items.
    */
    'gemini_api_key' => env('GEMINI_API_KEY', ''),
    'model' => env('GEMINI_OCR_MODEL', 'gemini-3.5-flash-lite'),
    'base_url' => env('GEMINI_API_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'),
];
