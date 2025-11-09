/**
 * 新規登録API（モック）
 * バックエンドが存在しない場合のモックAPI
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

// モックユーザーストレージ（メモリ内、サーバーレス環境では一時的）
// 実際の実装では、データベースを使用する必要があります
interface MockUser {
  id: number;
  username: string;
  email: string;
  password: string; // 実際の実装ではハッシュ化する必要があります
  role: 'trainee' | 'administrator' | 'auditor';
  worker_id: number | null;
  mfa_enabled: boolean;
}

// グローバル変数としてユーザーを保存（VercelのServerless Functionsでは関数が再利用される場合がある）
// 注意: これは一時的なストレージであり、本番環境ではデータベースを使用する必要があります
declare global {
  var mockUsers: Map<string, MockUser> | undefined;
}

// ユーザーストレージを初期化
function getMockUsers(): Map<string, MockUser> {
  if (!global.mockUsers) {
    global.mockUsers = new Map<string, MockUser>();
    
    // デフォルトのadminユーザーを追加
    global.mockUsers.set('admin', {
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // 実際の実装ではハッシュ化する必要があります
      role: 'administrator',
      worker_id: null,
      mfa_enabled: true,
    });
  }
  
  return global.mockUsers;
}

// ユーザー名でユーザーが存在するか確認
function userExists(username: string): boolean {
  return getMockUsers().has(username);
}

// メールアドレスでユーザーが存在するか確認
function emailExists(email: string): boolean {
  for (const user of getMockUsers().values()) {
    if (user.email === email) {
      return true;
    }
  }
  return false;
}

// ユーザーを保存
function saveUser(user: MockUser): void {
  getMockUsers().set(user.username, user);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method Not Allowed',
      });
    }

    const { username, email, password } = req.body;

  // バリデーション
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username, email, and password are required',
    });
  }

  // ユーザー名のバリデーション（3文字以上）
  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Username must be at least 3 characters long',
    });
  }

  // メールアドレスのバリデーション（簡易版）
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address format',
    });
  }

  // パスワードのバリデーション（8文字以上）
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Password must be at least 8 characters long',
    });
  }

  // ユーザー名の重複チェック
  if (userExists(username)) {
    return res.status(400).json({
      success: false,
      error: 'このユーザー名は既に使用されています。ログインしてください。',
    });
  }

  // メールアドレスの重複チェック
  if (emailExists(email)) {
    return res.status(400).json({
      success: false,
      error: 'このメールアドレスは既に使用されています。ログインしてください。',
    });
  }

  // モック登録（開発用）
  // 実際の実装では、データベースにユーザーを保存し、パスワードをハッシュ化する必要があります
  // ここでは、メモリ内にユーザー情報を保存します
  
  // モックユーザーID（実際の実装ではデータベースから取得）
  const userId = Date.now(); // 一時的なID生成

  const newUser: MockUser = {
    id: userId,
    username: username,
    email: email,
    password: password, // 実際の実装ではハッシュ化する必要があります
    role: 'trainee', // デフォルトロール
    worker_id: null,
    mfa_enabled: true, // 全ユーザーにMFAを有効化
  };

  // ユーザーを保存
  saveUser(newUser);

    return res.status(200).json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        worker_id: newUser.worker_id,
        mfa_enabled: newUser.mfa_enabled,
      },
      message: 'Registration successful',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
}

