<?php

namespace App\Http\Controllers;

use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function __construct(
        protected JwtService $jwt
    ) {
        Log::info('AuthController: initialized');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->attributes->get('jwt_user');
        Log::info('Auth: me requested', ['user_id' => $user->sub ?? 'unknown']);
        return response()->json(['user' => $user]);
    }

    public function validateToken(Request $request): JsonResponse
    {
        Log::info('Auth: validateToken');
        $token = $this->jwt->extractFromRequest($request);
        if (!$token) {
            Log::warning('Auth: validateToken - no token provided');
            return response()->json(['valid' => false, 'message' => 'No token provided'], 401);
        }
        $payload = $this->jwt->validateToken($token);
        if (!$payload) {
            Log::warning('Auth: validateToken - invalid token');
            return response()->json(['valid' => false, 'message' => 'Invalid token'], 401);
        }
        Log::info('Auth: validateToken - valid', ['user' => $payload->name ?? 'unknown']);
        return response()->json(['valid' => true, 'user' => $payload]);
    }

    public function logout(): JsonResponse
    {
        Log::info('Auth: logout');
        $cookie = cookie()->forget(config('jwt.cookie', 'super_agent_token'));
        return response()->json(['message' => 'Logged out successfully.'])
            ->withCookie($cookie);
    }
}
