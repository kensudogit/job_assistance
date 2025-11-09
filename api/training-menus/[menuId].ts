/**
 * 訓練メニュー詳細API（モック）
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { menuId } = req.query;

  if (req.method === 'GET') {
    // モックデータ
    return res.status(200).json({
      success: true,
      data: {
        id: Number(menuId),
        name: 'Mock Training Menu',
        description: 'Mock training menu description',
      },
    });
  }

  if (req.method === 'PUT') {
    // 更新
    return res.status(200).json({
      success: true,
      data: {
        id: Number(menuId),
        ...req.body,
      },
    });
  }

  if (req.method === 'DELETE') {
    // 削除
    return res.status(200).json({
      success: true,
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
  });
}

