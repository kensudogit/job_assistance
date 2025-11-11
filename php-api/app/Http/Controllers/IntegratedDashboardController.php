<?php

namespace App\Http\Controllers;

class IntegratedDashboardController extends Controller
{
    public function index($worker_id) { return response()->json(['success' => true, 'data' => ['kpi_timeline' => [], 'japanese_proficiency' => []]], 200); }
}

