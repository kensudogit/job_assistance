<?php

namespace App\Http\Controllers;

class EvidenceReportController extends Controller
{
    public function index($worker_id) { return response()->json(['success' => false, 'error' => 'Not implemented'], 501); }
}

