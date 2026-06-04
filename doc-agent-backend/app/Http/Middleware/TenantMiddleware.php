<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Support both patterns: jwt_payload (array, SA) and jwt_user (object, sub-agents)
        $jwtPayload = $request->attributes->get('jwt_payload');
        $jwtUser = $request->attributes->get('jwt_user');

        $tenantId = null;
        $role = null;
        $tenantSlug = null;

        if (is_array($jwtPayload) && !empty($jwtPayload['tenant_id'])) {
            $tenantId = $jwtPayload['tenant_id'];
            $role = $jwtPayload['role'] ?? null;
            $tenantSlug = $jwtPayload['tenant_slug'] ?? null;
        } elseif ($jwtUser && !empty($jwtUser->tenant_id)) {
            $tenantId = $jwtUser->tenant_id;
            $role = $jwtUser->role ?? null;
            $tenantSlug = $jwtUser->tenant_slug ?? null;
        }

        if (!$tenantId) {
            Log::warning('Tenant middleware: no tenant_id in JWT', [
                'path' => $request->path(),
            ]);
            return response()->json(['message' => 'Tenant context required.'], 403);
        }

        // Make tenant info available to controllers
        $request->merge([
            'current_tenant_id' => $tenantId,
            'current_tenant_role' => $role,
            'current_tenant_slug' => $tenantSlug,
        ]);

        return $next($request);
    }
}
