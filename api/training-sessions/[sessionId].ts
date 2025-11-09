/**
 * 訓練セッション詳細API（モック）
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { sessionId } = req.query;

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: {
        session_id: String(sessionId),
        worker_id: 0,
        training_menu_id: null,
        session_start_time: new Date().toISOString(),
        session_end_time: new Date().toISOString(),
        duration_seconds: 3600,
        status: 'completed',
        kpi: {
          safety_score: 85,
          error_count: 2,
          procedure_compliance_rate: 90,
          achievement_rate: 88,
          overall_score: 88,
        },
        operation_logs_count: 0,
      },
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
  });
}

