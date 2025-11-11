<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * ドキュメント管理API
 * Python Flask API (DocumentListResource) のPHP版
 */
class DocumentController extends Controller
{
    public function index($worker_id)
    {
        try {
            $documents = Document::where('worker_id', $worker_id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $documents->map(function ($doc) {
                    return $this->serialize($doc);
                })
            ], 200);
        } catch (\Exception $e) {
            Log::error('Document index error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request, $worker_id)
    {
        try {
            $data = $request->all();

            $document = new Document();
            $document->worker_id = $worker_id;
            $document->document_type = $data['document_type'] ?? null;
            $document->title = $data['title'] ?? null;
            $document->file_path = $data['file_path'] ?? null;
            $document->file_name = $data['file_name'] ?? null;
            $document->file_size = $data['file_size'] ?? null;
            $document->mime_type = $data['mime_type'] ?? null;
            $document->description = $data['description'] ?? null;
            $document->expiry_date = isset($data['expiry_date']) ? date('Y-m-d', strtotime($data['expiry_date'])) : null;
            $document->is_required = $data['is_required'] ?? false;
            $document->is_verified = $data['is_verified'] ?? false;
            $document->uploaded_by = $data['uploaded_by'] ?? null;
            $document->save();

            return response()->json([
                'success' => true,
                'data' => $this->serialize($document)
            ], 201);
        } catch (\Exception $e) {
            Log::error('Document store error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function serialize($doc)
    {
        return [
            'id' => $doc->id,
            'worker_id' => $doc->worker_id,
            'document_type' => $doc->document_type,
            'title' => $doc->title,
            'file_path' => $doc->file_path,
            'file_name' => $doc->file_name,
            'file_size' => $doc->file_size,
            'mime_type' => $doc->mime_type,
            'description' => $doc->description,
            'expiry_date' => $doc->expiry_date ? $doc->expiry_date->toIso8601String() : null,
            'is_required' => $doc->is_required,
            'is_verified' => $doc->is_verified,
            'uploaded_by' => $doc->uploaded_by,
            'created_at' => $doc->created_at ? $doc->created_at->toIso8601String() : null,
            'updated_at' => $doc->updated_at ? $doc->updated_at->toIso8601String() : null,
        ];
    }
}

