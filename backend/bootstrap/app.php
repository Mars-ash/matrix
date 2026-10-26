<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn () => null);
        $middleware->alias([
            'role.controller' => \App\Http\Middleware\EnsureControllerRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                if ($e instanceof \Illuminate\Validation\ValidationException
                    || $e instanceof \Illuminate\Auth\AuthenticationException
                    || $e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                    return null;
                }

                \Illuminate\Support\Facades\Log::error($e->getMessage(), ['exception' => $e]);

                $message = config('app.debug') && !($e instanceof \PDOException)
                    ? $e->getMessage()
                    : 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';

                return response()->json([
                    'message' => $message,
                ], 500);
            }
        });
    })->create();
