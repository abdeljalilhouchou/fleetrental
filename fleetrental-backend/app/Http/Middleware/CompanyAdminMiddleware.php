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

        // Super admin : accès total
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // L'utilisateur doit appartenir à une entreprise
        if (!$user->company_id) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        return $next($request);
    }
}
