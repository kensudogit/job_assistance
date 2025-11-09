/**
 * ログインAPI（モック）
 * バックエンドが存在しない場合のモックAPI
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
    });
  }

  const { username, password, mfa_code, backup_code } = req.body;

  // モック認証（開発用）
  if (username === 'admin' && password === 'admin123') {
    // MFAコードが必要な場合
    if (mfa_code && ['000000', '123456', '999999'].includes(mfa_code)) {
      // MFAコードが正しい場合、ログイン成功
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
        csrf_token: 'mock-csrf-token-' + Date.now(),
      });
    } else if (!mfa_code && !backup_code) {
      // MFAコードが必要
      return res.status(401).json({
        success: false,
        error: 'MFA code or backup code is required',
        mfa_required: true,
      });
    } else {
      // MFAコードが間違っている
      return res.status(401).json({
        success: false,
        error: 'Invalid MFA code or backup code',
      });
    }
  }

  // 認証失敗
  return res.status(401).json({
    success: false,
    error: 'Invalid username or password',
  });
}

