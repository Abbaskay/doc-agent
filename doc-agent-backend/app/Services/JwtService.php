<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;

class JwtService
{
    protected string $secret;
    protected string $cookieName;
    protected string $algorithm = 'HS256';

    public function __construct()
    {
        $this->secret = config('jwt.secret');
        $this->cookieName = config('jwt.cookie', 'super_agent_token');

        if (empty($this->secret)) {
            throw new \RuntimeException('JWT_SECRET is not set. Please configure it in your .env file.');
        }
    }

    public function validateToken(string $token): ?object
    {
        try {
            return JWT::decode($token, new Key($this->secret, $this->algorithm));
        } catch (\Exception $e) {
            return null;
        }
    }

    public function extractFromCookie(): ?string
    {
        if (!empty($_COOKIE[$this->cookieName])) {
            return $_COOKIE[$this->cookieName];
        }
        return \Illuminate\Support\Facades\Cookie::get($this->cookieName);
    }

    public function extractFromRequest(Request $request): ?string
    {
        $token = $request->query('token')
            ?? $request->bearerToken()
            ?? $request->input('token')
            ?? $this->extractFromCookie();

        return $token ?: null;
    }
}
