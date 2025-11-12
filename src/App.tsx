/**
 * メインアプリケーションコンポーネント
 * 外国人就労支援システムのメインUIコンポーネント
 * 認証、役割ベースアクセス制御、各種機能タブを統合
 */
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Login from '@/components/Login';
import { authApi, type User } from '@/lib/api';
import WorkerForm from '@/components/WorkerForm';
import ProgressManagement from '@/components/ProgressManagement';
import JapaneseProficiencyManagement from '@/components/JapaneseProficiencyManagement';
import SkillTrainingManagement from '@/components/SkillTrainingManagement';
import IntegratedDashboard from '@/components/IntegratedDashboard';
import MilestoneManagement from '@/components/MilestoneManagement';
import CareerPathTimeline from '@/components/CareerPathTimeline';
import EvidenceReport from '@/components/EvidenceReport';
import TrainingSessionDetail from '@/components/TrainingSessionDetail';
import TrainingMenuAssignmentComponent from '@/components/TrainingMenuAssignment';
import LanguageSelector from '@/components/LanguageSelector';
import ConstructionSimulatorManagement from '@/components/ConstructionSimulatorManagement';
import IntegratedGrowthDashboard from '@/components/IntegratedGrowthDashboard';
import SpecificSkillTransitionManagement from '@/components/SpecificSkillTransitionManagement';
import CareerGoalManagement from '@/components/CareerGoalManagement';
import UserManagement from '@/components/UserManagement';
import ManagementPanel from '@/components/ManagementPanel';

/**
 * タブタイプの定義
 * アプリケーション内で使用可能なすべてのタブを定義
 */
type TabType = 'progress' | 'japanese' | 'skill' | 'dashboard' | 'training' | 'milestone' | 'career' | 'report' | 'sessions' | 'assignment' | 'simulator' | 'growth' | 'transition' | 'goals' | 'users';

/**
 * メインアプリケーションコンポーネント
 */
function App() {
  const { t } = useTranslation();
  
  // 状態管理
  const [user, setUser] = useState<User | null>(null);              // 現在のユーザー情報
  const [loading, setLoading] = useState(true);                     // ローディング状態
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);  // 選択中の就労者ID
  const [showForm, setShowForm] = useState(false);                   // フォーム表示フラグ
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');  // アクティブなタブ
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);  // タブ切り替え中フラグ

  // タブの変更を監視（デバッグ用）
  useEffect(() => {
    console.log('アクティブなタブが変更されました:', activeTab);
    console.log('現在のactiveTabステート:', activeTab);
  }, [activeTab]);

  // コンポーネントマウント時に認証状態をチェック
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * 認証状態をチェック
   * localStorageからユーザー情報を読み込み、APIで認証状態を確認
   */
  const checkAuth = async () => {
    try {
      // まずlocalStorageからユーザー情報を読み込む（モック実装用）
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setUser(user);
          // 訓練生の場合は自分のworker_idを自動選択
          if (user.role === 'trainee' && user.worker_id) {
            setSelectedWorker(user.worker_id);
          }
          setLoading(false);
          return;
        } catch (err) {
          console.error('Failed to parse saved user:', err);
          localStorage.removeItem('user');
        }
      }
      
      // localStorageにユーザー情報がない場合、APIで認証状態を確認
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      // 訓練生の場合は自分のworker_idを自動選択
      if (currentUser.role === 'trainee' && currentUser.worker_id) {
        setSelectedWorker(currentUser.worker_id);
      }
    } catch (err) {
      // 認証されていない場合はログイン画面を表示
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ログイン成功時のハンドラ
   * ユーザー情報を設定し、localStorageに保存、訓練生の場合はworker_idを自動選択
   */
  const handleLoginSuccess = (loggedInUser: User & { password?: string }) => {
    setUser(loggedInUser);
    // ユーザー情報をlocalStorageに保存（モック実装用）
    // 注意: パスワードが含まれている場合は、それを保持する
    try {
      let userToSave = loggedInUser;
      
      // loggedInUserにパスワードが含まれていない場合、既存のlocalStorageから取得を試みる
      if (!(loggedInUser as any).password) {
        const existingUser = localStorage.getItem('user');
        if (existingUser) {
          try {
            const existingUserData = JSON.parse(existingUser);
            // 既存のユーザー情報にパスワードが含まれている場合は、それを保持
            if (existingUserData.password && existingUserData.username === loggedInUser.username) {
              userToSave = {
                ...loggedInUser,
                password: existingUserData.password,
              } as User & { password: string };
              console.log('User saved to localStorage with password from existing data');
            }
          } catch (err) {
            console.error('Failed to parse existing user:', err);
          }
        }
      } else {
        // loggedInUserにパスワードが含まれている場合は、それを優先
        console.log('User saved to localStorage with password from loggedInUser');
      }
      
      // パスワードを含むユーザー情報をlocalStorageに保存
      localStorage.setItem('user', JSON.stringify(userToSave));
      console.log('User saved to localStorage:', {
        username: userToSave.username,
        hasPassword: !!(userToSave as any).password,
      });
    } catch (err) {
      console.error('Failed to save user to localStorage:', err);
    }
    if (loggedInUser.role === 'trainee' && loggedInUser.worker_id) {
      setSelectedWorker(loggedInUser.worker_id);
    }
  };

  /**
   * ローカルストレージから認証関連のデータを削除するヘルパー関数
   */
  const clearAuthDataFromStorage = () => {
    try {
      // まず、すべてのキーを取得
      const allKeys = Object.keys(localStorage);
      
      // 認証関連のキーを削除
      const authKeys = ['user', 'auth_token', 'token', 'isAuthenticated', 'loginHistory', 'registeredUsers'];
      authKeys.forEach(key => {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          console.log(`Removed key: ${key}`);
        }
      });
      
      // その他の認証関連のキーも削除（存在する場合）
      allKeys.forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('auth') || lowerKey.includes('token') || lowerKey.includes('user') || lowerKey.includes('login')) {
          localStorage.removeItem(key);
          console.log(`Removed auth-related key: ${key}`);
        }
      });
      
      // 削除後の確認
      const remainingKeys = Object.keys(localStorage);
      console.log('Remaining localStorage keys after cleanup:', remainingKeys);
      console.log('Logout: All authentication data removed from localStorage');
    } catch (storageErr) {
      console.error('Failed to clear localStorage:', storageErr);
    }
  };

  /**
   * ログアウト処理
   * セッションをクリアし、ログイン画面に戻る
   * ローカルストレージから認証関連のデータを削除
   */
  const handleLogout = async () => {
    // まず、ローカルストレージをクリア（API呼び出しの前に行う）
    clearAuthDataFromStorage();
    
    // ユーザー状態を即座にクリア
    setUser(null);
    setSelectedWorker(null);
    
    // その後、APIを呼び出す（エラーが発生しても問題ない）
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout API error (ignored):', err);
      // APIエラーは無視（ローカルストレージは既にクリア済み）
    }
    
    // 念のため、再度クリア（二重チェック）
    clearAuthDataFromStorage();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 認証されていない場合はログイン画面を表示
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <main 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom right, #f8fafc, #eff6ff, #eef2ff)',
        minHeight: '100vh',
      }}
    >
      {/* 背景装飾 */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            background: '#60a5fa',
            animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        ></div>
        <div 
          className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            background: '#a78bfa',
            animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: '2s',
          }}
        ></div>
        <div 
          className="absolute bottom-0 left-1/2 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{
            background: '#818cf8',
            animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            animationDelay: '4s',
          }}
        ></div>
      </div>

      {/* ヘッダー */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/PC.png" 
                alt="Logo" 
                className="w-16 h-16 rounded-xl object-contain shadow-lg"
                onError={(e) => {
                  // 画像が読み込めない場合、代替パスを試す
                  const target = e.currentTarget;
                  const currentSrc = target.src;
                  if (!currentSrc.includes('PC.png')) {
                    // まずpublicフォルダを試す
                    target.src = '/PC.png';
                  } else if (!currentSrc.includes('/public/')) {
                    // srcフォルダを試す
                    target.src = '/src/PC.png';
                  } else {
                    // 画像が表示できない場合、ロゴアイコンを表示
                    target.style.display = 'none';
                  }
                }}
              />
              <h1 
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(to right, #2563eb, #9333ea, #4f46e5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('title')}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-semibold">{user.username}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'administrator' ? 'bg-blue-100 text-blue-700' :
                  user.role === 'auditor' ? 'bg-purple-100 text-purple-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {user.role === 'administrator' ? '管理者' :
                   user.role === 'auditor' ? '監査担当者' :
                   '訓練生'}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* サイドバーとメインコンテンツのレイアウト */}
      <div className="flex relative mt-[88px]">
        {/* サイドバー */}
        {user ? (
          <aside 
            className="w-72 fixed left-0 overflow-y-auto z-40"
            style={{
              top: '88px',  // ヘッダーの高さ分下に配置
              height: 'calc(100vh - 88px)',  // ビューポートの高さからヘッダーの高さを引く
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRight: '1px solid rgba(226, 232, 240, 0.8)',
              boxShadow: '4px 0 24px -4px rgba(0, 0, 0, 0.08), 2px 0 8px -2px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div className="p-6 space-y-1">
              {/* メニュー項目のヘルパー関数 */}
              {(() => {
                const menuItems = [
                  { id: 'dashboard', label: t('integratedDashboard'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
                  { id: 'progress', label: t('progressManagement'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
                  { id: 'japanese', label: t('japaneseProficiency'), icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)' },
                  { id: 'skill', label: t('skillTraining'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' },
                  { id: 'milestone', label: t('milestoneManagement'), icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
                  { id: 'career', label: t('careerPathTimeline'), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)' },
                  { id: 'report', label: t('evidenceReport'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
                  { id: 'sessions', label: t('trainingSessions'), icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
                  { id: 'assignment', label: t('trainingMenuAssignment'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', gradient: 'linear-gradient(135deg, #ec4899 0%, #ef4444 100%)' },
                  { id: 'simulator', label: t('constructionSimulator'), icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', gradient: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' },
                  { id: 'growth', label: t('integratedGrowthManagement'), icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
                  { id: 'transition', label: t('specificSkillTransition'), icon: 'M17 8l4 4m0 0l-4 4m4-4H3', gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' },
                  { id: 'goals', label: t('careerGoals'), icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', gradient: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)' },
                ];

                return menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const handleTabClick = (e: React.MouseEvent<HTMLButtonElement>) => {
                    try {
                      e.preventDefault();
                      e.stopPropagation();
                      const newTab = item.id as TabType;
                      
                      // 同じタブをクリックした場合は何もしない
                      if (newTab === activeTab) {
                        return;
                      }
                      
                      console.log('タブを切り替えます:', newTab, '現在のタブ:', activeTab);
                      
                      // 画面を一旦クリア
                      setIsTabTransitioning(true);
                      
                      // 短い遅延の後、新しいタブを設定
                      setTimeout(() => {
                        try {
                          console.log('新しいタブを設定します:', newTab);
                          setActiveTab(newTab);
                          setIsTabTransitioning(false);
                        } catch (error) {
                          console.error('タブ切り替えエラー:', error);
                          setIsTabTransitioning(false);
                        }
                      }, 100);  // 100ms後に新しいタブを表示
                    } catch (error) {
                      console.error('タブクリックエラー:', error);
                      setIsTabTransitioning(false);
                    }
                  };
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={handleTabClick}
                      className={`group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-sm ${
                        isActive
                          ? 'text-white shadow-lg scale-[1.02]'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      style={isActive ? {
                        background: item.gradient,
                        boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4), 0 4px 8px -2px rgba(99, 102, 241, 0.2)',
                      } : {}}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(249, 250, 251, 0.8)';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      {/* アクティブインジケーター */}
                      {isActive && (
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                          style={{
                            background: 'rgba(255, 255, 255, 0.9)',
                            boxShadow: '2px 0 8px rgba(255, 255, 255, 0.5)',
                          }}
                        />
                      )}
                      
                      {/* アイコン */}
                      <svg 
                        className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                          isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                        }`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      
                      {/* ラベル */}
                      <span className="flex-1 text-left">{item.label}</span>
                      
                      {/* アクティブ時のチェックマーク */}
                      {isActive && (
                        <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </aside>
        ) : null}

        {/* メインコンテンツエリア */}
        <main className="flex-1 min-h-screen ml-72">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* アクションボタン */}
            {(user.role === 'administrator' || user.role === 'auditor') && (
              <div className="mb-8 animate-slide-up">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="group relative inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                    boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 15px 35px -5px rgba(37, 99, 235, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(37, 99, 235, 0.4)';
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                    </svg>
                    {showForm ? t('hideForm') : t('addWorker')}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            )}

            {/* フォーム */}
            {showForm && (
              <div className="mb-8 animate-slide-up">
                <WorkerForm
                  onSuccess={() => {
                    setShowForm(false);
                  }}
                />
              </div>
            )}

            {/* メインコンテンツ */}
            <div className="space-y-8">
              {/* 管理パネル（管理者向けサマリー、全作業員の進捗、訓練メニュー管理を統合） */}
              {(user.role === 'administrator' || user.role === 'auditor') && (
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <ManagementPanel
                    selectedWorker={selectedWorker}
                    onSelectWorker={setSelectedWorker}
                    userRole={user.role}
                  />
                </div>
              )}

              {/* 外国人就労支援システムのメインコンテンツ */}
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="space-y-6" key={activeTab}>
                    {/* タブコンテンツ - 切り替え中は画面をクリア、その後新しいタブを表示 */}
                    {isTabTransitioning ? (
                      <div className="glass rounded-2xl p-6 min-h-[400px] flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-sm">読み込み中...</p>
                        </div>
                      </div>
                    ) : (() => {
                      try {
                        console.log('タブコンテンツをレンダリングします。activeTab:', activeTab);
                        const workerId = selectedWorker || user?.worker_id || 0;
                        
                        switch (activeTab) {
                          case 'dashboard':
                            return <IntegratedDashboard key={`dashboard-${activeTab}`} workerId={workerId} />;
                          case 'progress':
                            // 進捗管理はworkerIdが0の場合でもエラーにならないようにする
                            if (workerId === 0) {
                              return (
                                <div key={`progress-${activeTab}`} className="glass rounded-2xl p-6">
                                  <div className="text-center text-gray-500">
                                    <p>就労者を選択してください。</p>
                                  </div>
                                </div>
                              );
                            }
                            return <ProgressManagement key={`progress-${activeTab}`} workerId={workerId} />;
                        case 'japanese':
                          return <JapaneseProficiencyManagement key={`japanese-${activeTab}`} workerId={workerId} />;
                        case 'skill':
                          return <SkillTrainingManagement key={`skill-${activeTab}`} workerId={workerId} />;
                        case 'milestone':
                          return <MilestoneManagement key={`milestone-${activeTab}`} workerId={workerId} />;
                        case 'career':
                          return <CareerPathTimeline key={`career-${activeTab}`} workerId={workerId} />;
                        case 'report':
                          if (user.role === 'administrator' || user.role === 'auditor') {
                            return <EvidenceReport key={`report-${activeTab}`} workerId={selectedWorker || 0} />;
                          }
                          return null;
                        case 'sessions':
                          return <TrainingSessionDetail key={`sessions-${activeTab}`} workerId={workerId} />;
                        case 'assignment':
                          return <TrainingMenuAssignmentComponent key={`assignment-${activeTab}`} workerId={workerId} />;
                        case 'simulator':
                          return <ConstructionSimulatorManagement key={`simulator-${activeTab}`} workerId={workerId} />;
                        case 'growth':
                          return <IntegratedGrowthDashboard key={`growth-${activeTab}`} workerId={workerId} />;
                        case 'transition':
                          return <SpecificSkillTransitionManagement key={`transition-${activeTab}`} workerId={workerId} />;
                        case 'goals':
                          return <CareerGoalManagement key={`goals-${activeTab}`} workerId={workerId} />;
                        case 'users':
                          if (user.role === 'administrator') {
                            return <UserManagement key={`users-${activeTab}`} />;
                          }
                          return null;
                        default:
                          return (
                            <div key={`fallback-${activeTab}`} className="glass rounded-2xl p-6">
                              <div className="text-center text-gray-500">
                                <p>タブ「{activeTab}」のコンテンツが見つかりません。</p>
                                <p className="text-sm mt-2">現在のタブ: {activeTab}</p>
                              </div>
                            </div>
                          );
                      }
                      } catch (error) {
                        console.error('タブコンテンツレンダリングエラー:', error);
                        return (
                          <div key={`error-${activeTab}`} className="glass rounded-2xl p-6">
                            <div className="text-center text-red-500">
                              <p className="font-semibold">エラーが発生しました</p>
                              <p className="text-sm mt-2">{error instanceof Error ? error.message : '不明なエラー'}</p>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
            </div>
          </div>
        </main>
      </div>
    </main>
  );
}

export default App;

