<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index()
    {
        $companies = Company::withCount(['vehicles', 'users'])->get();
        return response()->json($companies);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'email'   => ['nullable', 'email'],
            'phone'   => ['nullable', 'string'],
        ]);

        $company = Company::create($data);
        return response()->json($company, 201);
    }

    public function update(Request $request, Company $company)
    {
        $data = $request->validate([
            'name'    => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'email'   => ['nullable', 'email'],
            'phone'   => ['nullable', 'string'],
        ]);

        $company->update($data);
        return response()->json($company);
    }

    public function destroy(Company $company)
    {
        if ($company->vehicles()->count() > 0) {
            return response()->json(['message' => 'Impossible de supprimer : des véhicules sont associés'], 422);
        }
        if ($company->users()->count() > 0) {
            return response()->json(['message' => 'Impossible de supprimer : des utilisateurs sont associés'], 422);
        }

        $company->delete();
        return response()->json(['message' => 'Entreprise supprimée']);
    }
}