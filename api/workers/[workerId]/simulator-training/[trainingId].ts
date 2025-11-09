/**
 * 建設機械シュミレータ訓練詳細API（モック）
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { workerId, trainingId } = req.query;

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: {
        id: Number(trainingId),
        worker_id: Number(workerId),
        machine_type: 'バックホー',
        training_start_date: new Date().toISOString().split('T')[0],
        status: '受講中',
        completion_rate: 0,
      },
    });
  }

  if (req.method === 'PUT') {
    return res.status(200).json({
      success: true,
      data: {
        id: Number(trainingId),
        worker_id: Number(workerId),
        ...req.body,
      },
    });
  }

  if (req.method === 'DELETE') {
    return res.status(200).json({
      success: true,
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
  });
}

