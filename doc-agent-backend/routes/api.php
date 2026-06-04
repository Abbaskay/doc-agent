<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/validate', [AuthController::class, 'validateToken']);

Route::get('/auth/sso', function (\Illuminate\Http\Request $request) {
    $token = $request->query('token');
    $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
    if (!$token) {
        return redirect($frontendUrl . '/login');
    }
    $jwt = app(\App\Services\JwtService::class);
    $payload = $jwt->validateToken($token);
    if (!$payload) {
        return redirect($frontendUrl . '/login');
    }
    $cookie = cookie(
        config('jwt.cookie', 'super_agent_token'),
        $token,
        120,
        '/',
        null,
        (bool) env('JWT_SECURE_COOKIE', false),
        true,
        false,
        'lax'
    );
    $redirectTo = $request->query('redirect', '');
    $callbackUrl = $frontendUrl . '/auth/callback?token=' . $token;
    if ($redirectTo) {
        $callbackUrl .= '&redirect=' . urlencode($redirectTo);
    }
    return redirect($callbackUrl)
        ->withCookie($cookie);
});

Route::middleware('jwt.auth','tenant')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::post('/generate', [DocController::class, 'generate']);
    Route::post('/upload', [DocController::class, 'upload']);
    Route::get('/templates', [DocController::class, 'templates']);
    Route::post('/generate-from-template', [DocController::class, 'generateFromTemplate']);
});
