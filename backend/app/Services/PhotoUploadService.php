<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

class PhotoUploadService
{
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    private const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    private const MAX_DIMENSION = 1600; // max width or height in px

    /**
     * Validate and process uploaded photo.
     *
     * @param UploadedFile $file
     * @param string $folder
     * @return array{path: string, name: string, original_name: string, file_size: int, url: string}
     */
    public function uploadPhoto(UploadedFile $file, string $folder = 'trial-photos'): array
    {
        // 1. Validate file size
        if ($file->getSize() > self::MAX_SIZE_BYTES) {
            throw new InvalidArgumentException('Ukuran file foto melebihi batas maksimal 5MB.');
        }

        // 2. Validate magic bytes via finfo
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $file->getRealPath());
        finfo_close($finfo);

        if (!in_array($realMime, self::ALLOWED_MIMES, true)) {
            throw new InvalidArgumentException('Format file tidak didukung. Harap upload format JPG, PNG, atau WebP.');
        }

        // 3. Compress & Resize using GD if available
        $originalPath = $file->getRealPath();
        $ext = match ($realMime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => 'jpg',
        };

        $filename = (string) Str::uuid() . '.' . $ext;
        $dateFolder = date('Y/m');
        $relativeFolder = "{$folder}/{$dateFolder}";
        $relativePath = "{$relativeFolder}/{$filename}";

        $this->processAndSaveImage($originalPath, $realMime, $relativePath);

        $storedSize = Storage::disk('public')->size($relativePath);
        $url = Storage::disk('public')->url($relativePath);

        return [
            'path' => $relativePath,
            'name' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'file_size' => $storedSize,
            'url' => $url,
        ];
    }

    private function processAndSaveImage(string $sourcePath, string $mime, string $targetPath): void
    {
        // Load image resource based on mime
        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($sourcePath),
            'image/png' => @imagecreatefrompng($sourcePath),
            'image/webp' => @imagecreatefromwebp($sourcePath),
            default => null,
        };

        if (!$image) {
            // Fallback: store raw file if GD fails to decode
            Storage::disk('public')->put($targetPath, file_get_contents($sourcePath));
            return;
        }

        $origWidth = imagesx($image);
        $origHeight = imagesy($image);

        // Calculate resize if larger than MAX_DIMENSION
        if ($origWidth > self::MAX_DIMENSION || $origHeight > self::MAX_DIMENSION) {
            if ($origWidth >= $origHeight) {
                $newWidth = self::MAX_DIMENSION;
                $newHeight = (int) round(($origHeight / $origWidth) * self::MAX_DIMENSION);
            } else {
                $newHeight = self::MAX_DIMENSION;
                $newWidth = (int) round(($origWidth / $origHeight) * self::MAX_DIMENSION);
            }

            $resized = imagecreatetruecolor($newWidth, $newHeight);

            // Preserve transparency for PNG
            if ($mime === 'image/png') {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
            }

            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
            imagedestroy($image);
            $image = $resized;
        }

        // Buffer compressed image
        ob_start();
        if ($mime === 'image/png') {
            imagepng($image, null, 7);
        } elseif ($mime === 'image/webp') {
            imagewebp($image, null, 85);
        } else {
            imagejpeg($image, null, 85);
        }
        $contents = ob_get_clean();
        imagedestroy($image);

        Storage::disk('public')->put($targetPath, $contents);
    }
}
