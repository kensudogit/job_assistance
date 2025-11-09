/**
 * 訓練メニュー一覧API（モック）
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // モックデータ
    const activeOnly = req.query.active_only === 'true';
    
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  if (req.method === 'POST') {
    // 新規作成
    return res.status(201).json({
      success: true,
      data: {
        id: Date.now(),
        ...req.body,
      },
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
  });
}

