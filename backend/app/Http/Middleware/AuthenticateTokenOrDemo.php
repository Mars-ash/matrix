<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateTokenOrDemo
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if ($token === 'demo-prototype-token' || $token === 'demo-controller-token') {
            $user = User::where('role', 'controller')->first();
            if ($user) {
                Auth::setUser($user);
                $request->setUserResolver(fn () => $user);
                return $next($request);
            }
        }

        if ($token === 'demo-viewer-token') {
            $user = User::where('role', 'viewer')->first();
            if ($user) {
                Auth::setUser($user);
                $request->setUserResolver(fn () => $user);
                return $next($request);
            }
        }

        if ($token) {
            $pat = PersonalAccessToken::findToken($token);
            if ($pat && $pat->tokenable) {
                Auth::setUser($pat->tokenable);
                $request->setUserResolver(fn () => $pat->tokenable);
                return $next($request);
            }
        }

        // Fallback to Sanctum session guard if available
        if (Auth::guard('sanctum')->check()) {
            return $next($request);
        }

        // In local/testing environment, fallback to demo controller if no token was sent
        if (!$token && app()->environment('local', 'testing')) {
            $user = User::where('role', 'controller')->first();
            if ($user) {
                Auth::setUser($user);
                $request->setUserResolver(fn () => $user);
                return $next($request);
            }
        }

        return response()->json(['message' => 'Unauthenticated.'], 401);
    }
}
