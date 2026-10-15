<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    /**
     * Display a listing of partners.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Partner::query();

        if ($request->filled('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $partners = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'data' => $partners,
        ]);
    }

    /**
     * Store a newly created partner.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:customer,supplier_po,supplier_subcont'],
            'status' => ['nullable', 'string', 'in:active,discontinued'],
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        $partner = Partner::create($validated);

        return response()->json([
            'data' => $partner,
            'message' => 'Partner created successfully.',
        ], 201);
    }

    /**
     * Update the specified partner.
     */
    public function update(Request $request, Partner $partner): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'in:customer,supplier_po,supplier_subcont'],
            'status' => ['sometimes', 'required', 'string', 'in:active,discontinued'],
        ]);

        $partner->update($validated);

        return response()->json([
            'data' => $partner->fresh(),
            'message' => 'Partner updated successfully.',
        ]);
    }

    /**
     * Remove the specified partner.
     */
    public function destroy(Partner $partner): JsonResponse
    {
        $partner->delete();

        return response()->json([
            'message' => 'Partner deleted successfully.',
        ]);
    }
}
