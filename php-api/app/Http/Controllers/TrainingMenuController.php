<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TrainingMenuController extends Controller
{
    public function index() { return response()->json(['success' => true, 'data' => []], 200); }
    public function store(Request $request) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
    public function show($menu_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
    public function update(Request $request, $menu_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
    public function destroy($menu_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
}

