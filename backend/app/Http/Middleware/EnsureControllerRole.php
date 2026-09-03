<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureControllerRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->isController()) {
            return response()->json([
                'message' => 'Forbidden. This action requires Controller privileges.',
            ], 403);
        }

        return $next($request);
    }
}
