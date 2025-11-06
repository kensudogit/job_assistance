/**
 * ユーザー管理コンポーネント
 * ユーザーの一覧表示と作成を行う（管理者専用）
 */
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { userApi, type User } from '@/lib/api';
import { workerApi, type Worker } from '@/lib/api';

/**
 * ユーザー管理コンポーネント
 * 管理者がユーザーアカウントを管理するUI
 */
export default function UserManagement() {
  const { t } = useTranslation();
  
  // 状態管理
  const [users, setUsers] = useState<User[]>([]);                    // ユーザー一覧
  const [workers, setWorkers] = useState<Worker[]>([]);              // 就労者一覧（訓練生アカウント作成時用）
  const [loading, setLoading] = useState(true);                      // ローディング状態
  const [error, setError] = useState<string | null>(null);           // エラーメッセージ
  const [showForm, setShowForm] = useState(false);                   // フォーム表示フラグ
  const [editingUser, setEditingUser] = useState<Omit<User, 'id'> & { password: string } | null>(null);  // 編集中のユーザー

  // コンポーネントマウント時にデータを読み込む
  useEffect(() => {
    loadData();
  }, []);

  /**
   * データを読み込む
   * ユーザー一覧と就労者一覧を並行して取得
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      // ユーザー一覧と就労者一覧を並行して取得
      const [usersData, workersData] = await Promise.all([
        userApi.getAll(),
        workerApi.getAll().catch(() => []),  // エラー時は空配列を返す
      ]);
      setUsers(usersData);
      setWorkers(workersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * ユーザー追加ボタンのハンドラ
   * 新しいユーザーのフォームを表示
   */
  const handleAddUser = () => {
    setEditingUser({
      username: '',
      email: '',
      role: 'trainee',  // デフォルトは訓練生
      password: '',
      is_active: true,  // デフォルトは有効
    });
    setShowForm(true);
  };

  /**
   * ユーザー保存ハンドラ
   * 新しいユーザーを作成し、一覧を再読み込み
   * 
   * @param userData - 保存するユーザーデータ（パスワードを含む）
   */
  const handleSaveUser = async (userData: Omit<User, 'id'> & { password: string }) => {
    try {
      await userApi.create(userData);
      await loadData();  // 一覧を再読み込み
      setShowForm(false);
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">ユーザー管理</h2>
            </div>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              + ユーザーを追加
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass rounded-xl p-4 bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* フォーム */}
      {showForm && editingUser && (
        <div className="glass rounded-2xl p-6 shadow-xl card-hover animate-slide-up">
          <h3 className="text-xl font-bold mb-4">ユーザーを追加</h3>
          <UserForm
            user={editingUser}
            workers={workers}
            onSave={handleSaveUser}
            onCancel={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
          />
        </div>
      )}

      {/* ユーザー一覧 */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="divide-y divide-gray-100">
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">ユーザーが登録されていません</p>
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{user.username}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'administrator' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'auditor' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'administrator' ? '管理者' :
                         user.role === 'auditor' ? '監査担当者' :
                         '訓練生'}
                      </span>
                      {user.is_active ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          有効
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                          無効
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>メール: {user.email}</div>
                      {user.worker_id && (
                        <div>訓練生ID: {user.worker_id}</div>
                      )}
                      {user.last_login && (
                        <div>最終ログイン: {new Date(user.last_login).toLocaleString()}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface UserFormProps {
  user: Omit<User, 'id'> & { password: string };
  workers: Worker[];
  onSave: (user: Omit<User, 'id'> & { password: string }) => void;
  onCancel: () => void;
}

function UserForm({ user, workers, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<Omit<User, 'id'> & { password: string }>(user);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ユーザー名</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">メールアドレス</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">パスワード</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">役割</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'trainee' | 'administrator' | 'auditor' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="trainee">訓練生</option>
            <option value="administrator">管理者</option>
            <option value="auditor">監査担当者</option>
          </select>
        </div>

        {formData.role === 'trainee' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">訓練生</label>
            <select
              value={formData.worker_id || ''}
              onChange={(e) => setFormData({ ...formData, worker_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選択してください</option>
              {workers.map((worker) => (
                <option key={worker.id} value={worker.id}>{worker.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is_active !== false}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="text-sm font-semibold text-gray-700">有効</label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all duration-300"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

