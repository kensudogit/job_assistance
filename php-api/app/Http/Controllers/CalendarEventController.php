<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * カレンダー管理API
 * Python Flask API (CalendarEventListResource) のPHP版
 */
class CalendarEventController extends Controller
{
    public function index($worker_id = null)
    {
        try {
            $query = CalendarEvent::query();
            
            if ($worker_id) {
                $query->where(function ($q) use ($worker_id) {
                    $q->where('worker_id', $worker_id)
                        ->orWhereNull('worker_id');
                });
            } else {
                $query->whereNull('worker_id');
            }

            $events = $query->orderBy('start_datetime', 'asc')->get();

            return response()->json([
                'success' => true,
                'data' => $events->map(function ($e) {
                    return $this->serialize($e);
                })
            ], 200);
        } catch (\Exception $e) {
            Log::error('CalendarEvent index error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request, $worker_id = null)
    {
        try {
            $data = $request->all();

            $event = new CalendarEvent();
            $event->worker_id = $worker_id ?: null;
            $event->title = $data['title'] ?? null;
            $event->description = $data['description'] ?? null;
            $event->event_type = $data['event_type'] ?? null;
            $event->start_datetime = isset($data['start_datetime']) ? date('Y-m-d H:i:s', strtotime($data['start_datetime'])) : null;
            $event->end_datetime = isset($data['end_datetime']) ? date('Y-m-d H:i:s', strtotime($data['end_datetime'])) : null;
            $event->location = $data['location'] ?? null;
            $event->attendees = $data['attendees'] ?? null;
            $event->is_all_day = $data['is_all_day'] ?? false;
            $event->reminder_minutes = $data['reminder_minutes'] ?? null;
            $event->color = $data['color'] ?? 'blue';
            $event->save();

            return response()->json([
                'success' => true,
                'data' => $this->serialize($event)
            ], 201);
        } catch (\Exception $e) {
            Log::error('CalendarEvent store error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function indexAll()
    {
        return $this->index(null);
    }

    public function storeAll(Request $request)
    {
        return $this->store($request, null);
    }

    private function serialize($e)
    {
        return [
            'id' => $e->id,
            'worker_id' => $e->worker_id,
            'title' => $e->title,
            'description' => $e->description,
            'event_type' => $e->event_type,
            'start_datetime' => $e->start_datetime ? $e->start_datetime->toIso8601String() : null,
            'end_datetime' => $e->end_datetime ? $e->end_datetime->toIso8601String() : null,
            'location' => $e->location,
            'attendees' => $e->attendees,
            'is_all_day' => $e->is_all_day,
            'reminder_minutes' => $e->reminder_minutes,
            'color' => $e->color,
            'created_at' => $e->created_at ? $e->created_at->toIso8601String() : null,
            'updated_at' => $e->updated_at ? $e->updated_at->toIso8601String() : null,
        ];
    }
}

