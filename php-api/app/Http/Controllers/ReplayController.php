<?php

namespace App\Http\Controllers;

class ReplayController extends Controller
{
    public function show($session_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
}

