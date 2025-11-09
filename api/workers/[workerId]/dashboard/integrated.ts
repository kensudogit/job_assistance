/**
 * 統合ダッシュボードAPI（モック）
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
    });
  }

  const { workerId } = req.query;

  // モックデータ（フロントエンドが期待する構造に合わせる）
  return res.status(200).json({
    success: true,
    data: {
      kpi_timeline: [
        {
          date: new Date().toISOString().split('T')[0],
          safety_score: 85,
          error_count: 2,
          procedure_compliance_rate: 90,
          achievement_rate: 88,
          overall_score: 88,
        },
      ],
      japanese_proficiency: [
        {
          date: new Date().toISOString().split('T')[0],
          test_type: 'JLPT',
          level: 'N5',
          total_score: 120,
          passed: true,
        },
      ],
    },
  });
}

