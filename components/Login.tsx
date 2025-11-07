/**
 * ログインコンポーネント
 * ユーザー名とパスワードでログインするUIコンポーネント
 */
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi, type LoginCredentials, type RegisterCredentials } from '@/lib/api';

/**
 * ログインコンポーネントのプロパティ
 */
interface LoginProps {
  onLoginSuccess: (user: any) => void;  // ログイン成功時のコールバック
}

/**
 * ログインコンポーネント
 * ユーザー認証を行うログインフォームを表示
 */
export default function Login({ onLoginSuccess }: LoginProps) {
  const { t } = useTranslation();
  
  // 状態管理
  const [isRegisterMode, setIsRegisterMode] = useState(false);  // 新規登録モードかどうか
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',  // ユーザー名
    password: '',  // パスワード
  });
  const [registerData, setRegisterData] = useState<RegisterCredentials>({
    username: '',  // ユーザー名
    email: '',     // メールアドレス
    password: '',  // パスワード
  });
  const [error, setError] = useState<string | null>(null);      // エラーメッセージ
  const [loading, setLoading] = useState(false);                // ローディング状態

  /**
   * フォーム送信ハンドラ
   * ログイン認証または新規登録を実行し、成功時にonLoginSuccessを呼び出す
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegisterMode) {
        // 新規登録APIを呼び出し
        const user = await authApi.register(registerData);
        // 登録成功後、自動的にログイン
        await authApi.login({
          username: registerData.username,
          password: registerData.password,
        });
        // ログイン成功時にコールバックを実行
        onLoginSuccess(user);
      } else {
        // ログインAPIを呼び出し
        const user = await authApi.login(credentials);
        // ログイン成功時にコールバックを実行
        onLoginSuccess(user);
      }
    } catch (err) {
      // エラーを設定（詳細なエラーメッセージを表示）
      let errorMessage = '';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String(err.message);
      } else {
        errorMessage = isRegisterMode ? 'Registration failed' : 'Login failed';
      }
      console.error('Auth error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
      }}
    >
      {/* 背景装飾アニメーション */}
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
      
      {/* 背景装飾オーバーレイ */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* ガラスモーフィズム効果のログインフォーム */}
      <div 
        className="rounded-2xl p-8 shadow-2xl w-full max-w-md backdrop-blur-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.3) inset';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2) inset';
        }}
      >
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
              animation: 'float 3s ease-in-out infinite',
            }}
          >
            <span className="text-white font-bold text-2xl">就</span>
          </div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{
              background: 'linear-gradient(to right, #2563eb, #9333ea, #4f46e5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('title')}
          </h1>
          <p className="text-gray-700 font-medium">
            {isRegisterMode ? '新規アカウントを作成してください' : 'ログインしてください'}
          </p>
        </div>

        {error && (
          <div 
            className="mb-6 p-4 rounded-lg border"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              value={isRegisterMode ? registerData.username : credentials.username}
              onChange={(e) => {
                if (isRegisterMode) {
                  setRegisterData({ ...registerData, username: e.target.value });
                } else {
                  setCredentials({ ...credentials, username: e.target.value });
                }
              }}
              className="w-full px-4 py-3 rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder="ユーザー名を入力"
              required
              autoComplete="username"
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                placeholder="メールアドレスを入力"
                required
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={isRegisterMode ? registerData.password : credentials.password}
              onChange={(e) => {
                if (isRegisterMode) {
                  setRegisterData({ ...registerData, password: e.target.value });
                } else {
                  setCredentials({ ...credentials, password: e.target.value });
                }
              }}
              className="w-full px-4 py-3 rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              placeholder={isRegisterMode ? 'パスワードを入力（8文字以上）' : 'パスワードを入力'}
              required
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              minLength={isRegisterMode ? 8 : undefined}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(37, 99, 235, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.4)';
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {isRegisterMode ? '登録中...' : 'ログイン中...'}
              </span>
            ) : (
              isRegisterMode ? '新規登録' : 'ログイン'
            )}
          </button>
        </form>

        {/* 新規登録/ログインモード切り替え */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
              setCredentials({ username: '', password: '' });
              setRegisterData({ username: '', email: '', password: '' });
            }}
            className="text-sm text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            style={{
              textDecoration: 'underline',
              textDecorationColor: 'rgba(59, 130, 246, 0.3)',
            }}
          >
            {isRegisterMode ? '既にアカウントをお持ちの方はこちら' : '新規登録はこちら'}
          </button>
        </div>
      </div>
    </div>
  );
}

