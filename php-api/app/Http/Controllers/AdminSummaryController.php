<?php

namespace App\Http\Controllers;

class AdminSummaryController extends Controller
{
    public function index() { return response()->json(['success' => true, 'data' => ['summary' => [], 'alerts' => []]], 200); }
}

