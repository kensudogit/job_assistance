<?php

namespace App\Http\Controllers;

use App\Models\JapaneseProficiency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class JapaneseProficiencyController extends Controller
{
    public function index($worker_id) { return response()->json(['success' => true, 'data' => []], 200); }
    public function store(Request $request, $worker_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
    public function show($worker_id, $proficiency_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
    public function update(Request $request, $worker_id, $proficiency_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
    public function destroy($worker_id, $proficiency_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
}

