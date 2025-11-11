<?php

namespace App\Http\Controllers;

use App\Models\Training;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * 研修管理API
 * Python Flask API (TrainingListResource) のPHP版
 */
class TrainingController extends Controller
{
    public function index()
    {
        try {
            $trainings = Training::orderBy('start_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $trainings->map(function ($t) {
                    return $this->serialize($t);
                })
            ], 200);
        } catch (\Exception $e) {
            Log::error('Training index error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->all();

            $training = new Training();
            $training->title = $data['title'] ?? null;
            $training->description = $data['description'] ?? null;
            $training->training_type = $data['training_type'] ?? null;
            $training->category = $data['category'] ?? null;
            $training->duration_hours = $data['duration_hours'] ?? null;
            $training->start_date = isset($data['start_date']) ? date('Y-m-d', strtotime($data['start_date'])) : null;
            $training->end_date = isset($data['end_date']) ? date('Y-m-d', strtotime($data['end_date'])) : null;
            $training->location = $data['location'] ?? null;
            $training->instructor = $data['instructor'] ?? null;
            $training->max_participants = $data['max_participants'] ?? null;
            $training->status = $data['status'] ?? '予定';
            $training->materials = $data['materials'] ?? null;
            $training->save();

            return response()->json([
                'success' => true,
                'data' => $this->serialize($training)
            ], 201);
        } catch (\Exception $e) {
            Log::error('Training store error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function serialize($t)
    {
        return [
            'id' => $t->id,
            'title' => $t->title,
            'description' => $t->description,
            'training_type' => $t->training_type,
            'category' => $t->category,
            'duration_hours' => $t->duration_hours,
            'start_date' => $t->start_date ? $t->start_date->toIso8601String() : null,
            'end_date' => $t->end_date ? $t->end_date->toIso8601String() : null,
            'location' => $t->location,
            'instructor' => $t->instructor,
            'max_participants' => $t->max_participants,
            'current_participants' => $t->current_participants ?? 0,
            'status' => $t->status,
            'materials' => $t->materials,
            'created_at' => $t->created_at ? $t->created_at->toIso8601String() : null,
            'updated_at' => $t->updated_at ? $t->updated_at->toIso8601String() : null,
        ];
    }
}

