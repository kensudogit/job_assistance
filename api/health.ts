/**
 * ヘルスチェックAPI
 * バックエンドが存在しない場合のモックAPI
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'API is running (mock mode)',
      timestamp: new Date().toISOString(),
    });
  }
  
  return res.status(405).json({
    success: false,
    error: 'Method Not Allowed',
  });
}

