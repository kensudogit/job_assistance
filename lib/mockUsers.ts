/**
 * モックユーザーストレージ（共有）
 * VercelのServerless Functionsで複数のエンドポイント間でユーザーデータを共有するためのモックストレージ
 * 注意: これは一時的なストレージであり、本番環境ではデータベースを使用する必要があります
 */

export interface MockUser {
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
export function getMockUsers(): Map<string, MockUser> {
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

// ユーザーを取得
export function getUser(username: string): MockUser | undefined {
  return getMockUsers().get(username);
}

// ユーザーを保存
export function saveUser(user: MockUser): void {
  getMockUsers().set(user.username, user);
}

// ユーザー名でユーザーが存在するか確認
export function userExists(username: string): boolean {
  return getMockUsers().has(username);
}

// メールアドレスでユーザーが存在するか確認
export function emailExists(email: string): boolean {
  for (const user of getMockUsers().values()) {
    if (user.email === email) {
      return true;
    }
  }
  return false;
}

