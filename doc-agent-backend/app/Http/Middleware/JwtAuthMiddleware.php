<?php

namespace App\Http\Middleware;

use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthMiddleware
{
    public function __construct(
        protected JwtService $jwt
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->jwt->extractFromRequest($request);

        if (!$token) {
            return response()->json(['message' => 'Not authenticated'], 401);
        }

        $payload = $this->jwt->validateToken($token);

        if (!$payload) {
            return response()->json(['message' => 'Invalid or expired token'], 401);
        }

        $request->attributes->set('jwt_user', $payload);

        return $next($request);
    }
}
