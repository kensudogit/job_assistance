/**
 * ログインコンポーネント
 * ユーザー名とパスワードでログインするUIコンポーネント
 */
'use client';

import { useState, useEffect } from 'react';
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
  const [mfaRequired, setMfaRequired] = useState(false);         // MFAが必要かどうか
  const [mfaCode, setMfaCode] = useState('');                  // MFAコード
  const [backupCode, setBackupCode] = useState('');            // バックアップコード
  const [useBackupCode, setUseBackupCode] = useState(false);   // バックアップコードを使用するかどうか
  
  // デバッグ用: mfaRequiredの変更を監視
  useEffect(() => {
    console.log('mfaRequired state changed:', mfaRequired, 'isRegisterMode:', isRegisterMode);
  }, [mfaRequired, isRegisterMode]);

  /**
   * フォーム送信ハンドラ
   * ログイン認証または新規登録を実行し、成功時にonLoginSuccessを呼び出す
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // デバッグ用ログ
    console.log('Login form submitted:', {
      isRegisterMode,
      mfaRequired,
      mfaCode,
      backupCode,
      username: isRegisterMode ? registerData.username : credentials.username,
    });

    try {
      if (isRegisterMode) {
        // 新規登録APIを呼び出し
        console.log('Starting registration with data:', {
          username: registerData.username,
          email: registerData.email,
          passwordLength: registerData.password?.length,
        });
        
        const user = await authApi.register(registerData);
        
        // 登録成功時、直接ログイン成功として扱う
        // 注意: VercelのServerless Functionsでは、register.tsとlogin.tsが別々の関数として実行されるため、
        // グローバル変数が共有されない可能性があります。そのため、登録成功時に直接ログイン成功として扱います。
        console.log('Registration successful, logging in user:', user);
        
        // パスワードを含むユーザー情報を作成
        const userWithPassword = {
          ...user,
          password: registerData.password, // モック実装のため、パスワードも保存
        };
        
        // ユーザー情報をlocalStorageに保存（確実に保存するため、ここでも保存）
        // モック実装として、パスワードも保存する（本番環境では使用しないでください）
        try {
          const userJson = JSON.stringify(userWithPassword);
          console.log('Attempting to save user to localStorage:', {
            user: userWithPassword,
            userJson,
            localStorageAvailable: typeof localStorage !== 'undefined',
          });
          
          localStorage.setItem('user', userJson);
          
          // 保存後に確認
          const savedUser = localStorage.getItem('user');
          console.log('User saved to localStorage successfully');
          console.log('localStorage user key exists:', savedUser !== null);
          console.log('Saved user data:', savedUser);
          
          if (!savedUser) {
            console.error('Warning: User was not saved to localStorage even though setItem was called');
          } else {
            // 保存されたデータをパースして確認
            try {
              const parsedUser = JSON.parse(savedUser);
              console.log('Parsed saved user:', parsedUser);
              console.log('Password in saved user:', parsedUser.password ? 'YES' : 'NO');
            } catch (parseErr) {
              console.error('Failed to parse saved user:', parseErr);
            }
          }
        } catch (err) {
          console.error('Failed to save user to localStorage:', err);
          console.error('Error details:', {
            name: err?.name,
            message: err?.message,
            stack: err?.stack,
          });
        }
        
        // 登録成功したユーザー情報でログイン成功として扱う
        // パスワードを含むユーザー情報を渡す（handleLoginSuccessでパスワードが保持される）
        onLoginSuccess(userWithPassword);
      } else {
        // ログインAPIを呼び出し（MFAコードを含む）
        const loginCredentials: LoginCredentials = {
          ...credentials,
          ...(mfaCode ? { mfa_code: mfaCode } : {}),
          ...(backupCode ? { backup_code: backupCode } : {}),
        };
        const user = await authApi.login(loginCredentials);
        
        // ログイン成功時、localStorageからパスワードを含むユーザー情報を取得
        // これにより、パスワードが保持される
        let userWithPassword = user;
        try {
          const existingUserData = localStorage.getItem('user');
          if (existingUserData) {
            try {
              const parsedExistingUser = JSON.parse(existingUserData);
              // ユーザー名が一致し、パスワードが含まれている場合は、パスワードを含むユーザー情報を使用
              if (parsedExistingUser.username === user.username && parsedExistingUser.password) {
                userWithPassword = {
                  ...user,
                  password: parsedExistingUser.password,
                };
                console.log('Using user data with password from localStorage');
              }
            } catch (err) {
              console.error('Failed to parse existing user:', err);
            }
          }
          
          // パスワードを含むユーザー情報をlocalStorageに保存
          const userJson = JSON.stringify(userWithPassword);
          console.log('Attempting to save user to localStorage after login:', {
            user: userWithPassword,
            userJson,
            localStorageAvailable: typeof localStorage !== 'undefined',
            hasPassword: !!userWithPassword.password,
          });
          
          localStorage.setItem('user', userJson);
          
          // 保存後に確認
          const savedUserAfterLogin = localStorage.getItem('user');
          console.log('User saved to localStorage successfully after login');
          console.log('localStorage user key exists:', savedUserAfterLogin !== null);
          console.log('Saved user data:', savedUserAfterLogin);
          
          if (!savedUserAfterLogin) {
            console.error('Warning: User was not saved to localStorage even though setItem was called');
          } else {
            // 保存されたデータをパースして確認
            try {
              const parsedUser = JSON.parse(savedUserAfterLogin);
              console.log('Parsed saved user after login:', parsedUser);
              console.log('Password in saved user:', parsedUser.password ? 'YES' : 'NO');
            } catch (parseErr) {
              console.error('Failed to parse saved user:', parseErr);
            }
          }
        } catch (err) {
          console.error('Failed to save user to localStorage:', err);
          console.error('Error details:', {
            name: err?.name,
            message: err?.message,
            stack: err?.stack,
          });
        }
        // ログイン成功時にコールバックを実行（パスワードを含むユーザー情報を渡す）
        onLoginSuccess(userWithPassword);
        // MFA状態をリセット
        setMfaRequired(false);
        setMfaCode('');
        setBackupCode('');
        setUseBackupCode(false);
      }
    } catch (err: any) {
      // デバッグ用ログ
      console.log('Login error caught:', {
        err,
        mfa_required: err?.mfa_required,
        error_type: err instanceof Error,
        error_message: err?.message,
      });
      
      // MFAが必要な場合（複数の方法でチェック）
      const isMfaRequired = 
        err?.mfa_required === true || 
        (err instanceof Error && (err as any).mfa_required === true) ||
        (err?.response?.data?.mfa_required === true) ||
        (err?.response?.status === 401 && err?.response?.data?.mfa_required === true);
      
      console.log('Checking MFA requirement:', {
        err,
        mfa_required: err?.mfa_required,
        isMfaRequired,
        response_data: err?.response?.data,
        response_status: err?.response?.status,
      });
      
      if (isMfaRequired) {
        console.log('MFA required - showing MFA input');
        setMfaRequired(true);
        setError(null);
        // パスワードフィールドを無効化（MFA入力中）
        // credentialsは既に入力されているので、そのまま保持
      } else {
        // エラーを設定（詳細なエラーメッセージを表示）
        let errorMessage = '';
        
        // エラーメッセージを抽出（複数の形式に対応）
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (err?.response?.data) {
          // レスポンスデータがある場合
          const errorData = err.response.data;
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (typeof err === 'object' && err !== null) {
          // オブジェクトの場合、messageプロパティを確認
          if ('message' in err) {
          errorMessage = String(err.message);
          } else if ('error' in err) {
            errorMessage = String(err.error);
          } else {
            // オブジェクト全体を文字列化するのではなく、デフォルトメッセージを使用
            errorMessage = isRegisterMode ? 'Registration failed' : 'Login failed';
          }
        } else {
          errorMessage = isRegisterMode ? 'Registration failed' : 'Login failed';
        }
        
        // エラーメッセージが空の場合はデフォルトメッセージを使用
        if (!errorMessage || errorMessage === '[object Object]') {
          errorMessage = isRegisterMode ? t('registerFailed') : t('loginFailed');
        }
        
        // 登録エラーの場合、多言語メッセージに変換
        if (isRegisterMode) {
          if (errorMessage.includes('Username already exists') || errorMessage.includes('already exists')) {
            errorMessage = t('usernameAlreadyExists');
          } else if (errorMessage.includes('Email already exists')) {
            errorMessage = t('emailAlreadyExists');
          } else if (errorMessage.includes('Username must be at least')) {
            errorMessage = t('usernameMinLength');
          } else if (errorMessage.includes('Password must be at least')) {
            errorMessage = t('passwordMinLength');
          } else if (errorMessage.includes('Invalid email address')) {
            errorMessage = t('invalidEmail');
          }
        }
        
        // ログインエラーの場合、追加の情報を提供
        if (!isRegisterMode && errorMessage.includes('Invalid username or password')) {
          errorMessage = t('invalidCredentials');
        }
        
        console.error('Auth error:', err);
        setError(errorMessage);
        // MFA状態をリセット（エラーの場合）
        setMfaRequired(false);
        setMfaCode('');
        setBackupCode('');
        setUseBackupCode(false);
      }
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
            {isRegisterMode ? t('createAccount') : t('pleaseLogin')}
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
              {t('username')}
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
              placeholder={t('enterUsername')}
              required
              autoComplete="username"
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('email')}
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
                placeholder={t('enterEmail')}
                required
                autoComplete="email"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('password')}
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
              placeholder={isRegisterMode ? t('enterPasswordMin') : t('enterPassword')}
              required
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              minLength={isRegisterMode ? 8 : undefined}
              disabled={mfaRequired}
            />
          </div>

          {/* MFAコード入力（MFAが必要な場合） */}
          {mfaRequired && !isRegisterMode && (
            <div 
              className="space-y-4 p-4 rounded-lg border"
              key="mfa-input"
              style={{
                background: 'rgba(59, 130, 246, 0.05)',
                borderColor: 'rgba(59, 130, 246, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  {t('mfaCodeRequired')}
                </p>
                <button
                  type="button"
                  onClick={() => setUseBackupCode(!useBackupCode)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  {useBackupCode ? t('useMfaCode') : t('useBackupCode')}
                </button>
              </div>
              
              {!useBackupCode ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('mfaCode')}
                  </label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setMfaCode(value);
                    }}
                    className="w-full px-4 py-3 rounded-lg transition-all duration-300 text-center text-2xl font-mono tracking-widest"
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                    }}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {t('mfaCodeDescription')}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('backupCode')}
                  </label>
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                      setBackupCode(value);
                    }}
                    className="w-full px-4 py-3 rounded-lg transition-all duration-300 text-center text-lg font-mono tracking-wider"
                    style={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                    }}
                    placeholder="ABCD1234"
                    maxLength={8}
                    autoFocus
                  />
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {t('backupCodeDescription')}
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mfaRequired && !mfaCode && !backupCode)}
            className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
            }}
            onMouseEnter={(e) => {
              if (!loading && !(mfaRequired && !mfaCode && !backupCode)) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(37, 99, 235, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.4)';
            }}
            onMouseDown={(e) => {
              if (!loading && !(mfaRequired && !mfaCode && !backupCode)) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              if (!loading && !(mfaRequired && !mfaCode && !backupCode)) {
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {mfaRequired ? t('authenticating') : isRegisterMode ? t('registering') : t('loggingIn')}
              </span>
            ) : (
              mfaRequired ? t('loginWithMfa') : isRegisterMode ? t('register') : t('login')
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
            {isRegisterMode ? t('alreadyHaveAccount') : t('newRegistration')}
          </button>
        </div>
      </div>
    </div>
  );
}

