<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CompanyAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user->isCompanyAdmin() && !$user->isSuperAdmin()) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return $next($request);
    }
}
