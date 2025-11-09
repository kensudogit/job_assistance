/**
 * 管理者サマリーAPI（モック）
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
    });
  }

  // モックデータ
  return res.status(200).json({
    success: true,
    data: {
      total_workers: 0,
      active_workers: 0,
      total_trainings: 0,
      active_trainings: 0,
      workers_with_low_kpi: 0,
      workers_with_high_errors: 0,
      recent_progress: [],
      upcoming_events: [],
      alerts: [],  // アラート配列を追加
      summary: [],  // サマリー配列を追加
    },
  });
}

