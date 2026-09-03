<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'password' => ['required', 'string'],
        ]);

        $login = trim($request->input('username') ?? $request->input('email') ?? '');
        $password = (string) $request->input('password');

        if (empty($login)) {
            throw ValidationException::withMessages([
                'username' => ['Username wajib diisi.'],
            ]);
        }

        // Search candidates by username, email, or alias
        $candidates = User::where('username', $login)
            ->orWhere('email', $login)
            ->orWhere(function ($q) use ($login) {
                if ($login === 'matrix') {
                    $q->whereIn('email', ['engineering@matrix.com', 'viewer@matrix.com', 'controller@matrix.com'])
                      ->orWhereIn('username', ['matrix', 'matrix#1']);
                }
            })
            ->get();

        $user = null;
        foreach ($candidates as $candidate) {
            if (Hash::check($password, $candidate->password)) {
                $user = $candidate;
                break;
            }
        }

        if (!$user) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password yang Anda masukkan salah.'],
                'email' => ['Username atau password yang Anda masukkan salah.'],
            ]);
        }

        // Revoke old tokens if any to keep single device or clean sessions
        $token = $user->createToken('matrix-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
