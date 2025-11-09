/**
 * マイルストーン管理API（モック）
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { workerId } = req.query;

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  if (req.method === 'POST') {
    return res.status(201).json({
      success: true,
      data: {
        id: Date.now(),
        worker_id: Number(workerId),
        ...req.body,
      },
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
  });
}

