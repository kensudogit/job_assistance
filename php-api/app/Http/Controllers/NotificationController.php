<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * 通知管理API
 * Python Flask API (NotificationListResource, NotificationWorkerResource) のPHP版
 */
class NotificationController extends Controller
{
    public function index($worker_id = null)
    {
        try {
            $query = Notification::query();
            
            if ($worker_id) {
                $query->where('worker_id', $worker_id);
            } else {
                $query->whereNull('worker_id');
            }

            $notifications = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $notifications->map(function ($n) {
                    return $this->serialize($n);
                })
            ], 200);
        } catch (\Exception $e) {
            Log::error('Notification index error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request, $worker_id)
    {
        try {
            $data = $request->all();

            $notification = new Notification();
            $notification->worker_id = $worker_id ?: null;
            $notification->title = $data['title'] ?? null;
            $notification->message = $data['message'] ?? null;
            $notification->notification_type = $data['notification_type'] ?? null;
            $notification->priority = $data['priority'] ?? 'normal';
            $notification->scheduled_date = isset($data['scheduled_date']) ? date('Y-m-d H:i:s', strtotime($data['scheduled_date'])) : null;
            $notification->related_type = $data['related_type'] ?? null;
            $notification->related_id = $data['related_id'] ?? null;
            $notification->save();

            return response()->json([
                'success' => true,
                'data' => $this->serialize($notification)
            ], 201);
        } catch (\Exception $e) {
            Log::error('Notification store error: ' . $e->getMessage());
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

    private function serialize($n)
    {
        return [
            'id' => $n->id,
            'worker_id' => $n->worker_id,
            'title' => $n->title,
            'message' => $n->message,
            'notification_type' => $n->notification_type,
            'priority' => $n->priority,
            'scheduled_date' => $n->scheduled_date ? $n->scheduled_date->toIso8601String() : null,
            'related_type' => $n->related_type,
            'related_id' => $n->related_id,
            'created_at' => $n->created_at ? $n->created_at->toIso8601String() : null,
            'updated_at' => $n->updated_at ? $n->updated_at->toIso8601String() : null,
        ];
    }
}

