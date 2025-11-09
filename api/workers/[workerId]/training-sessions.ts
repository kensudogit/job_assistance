/**
 * 訓練セッション一覧API（モック）
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

  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
  });
}

