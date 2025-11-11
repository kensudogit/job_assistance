<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index() { return response()->json(['success' => true, 'data' => []], 200); }
    public function store(Request $request) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
}

