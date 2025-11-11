<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SpecificSkillTransitionController extends Controller
{
    public function index($worker_id) { return response()->json(['success' => true, 'data' => []], 200); }
    public function store(Request $request, $worker_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
}

