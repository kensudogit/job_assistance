/**
 * 現在のユーザー情報取得API（モック）
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
    });
  }

  // モックユーザー情報
  return res.status(200).json({
    success: true,
    data: {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      role: 'administrator',
      worker_id: null,
      mfa_enabled: true,
    },
  });
}

