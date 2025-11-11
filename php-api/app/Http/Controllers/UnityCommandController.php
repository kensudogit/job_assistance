<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UnityCommandController extends Controller
{
    public function store(Request $request) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
}

