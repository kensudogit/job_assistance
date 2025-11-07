/**
 * Unityシミュレーターコンポーネント
 * Unity WebGLビルドを埋め込み、訓練セッションを管理
 */
import { useEffect, useRef, useState } from 'react';
import { unityApi, type UnityTrainingSessionData } from '@/lib/api';

interface UnitySimulatorProps {
  workerId: number;
  trainingMenuId?: number;
  onSessionComplete?: (sessionId: string, sessionData: UnityTrainingSessionData) => void;
}

declare global {
  interface Window {
    createUnityInstance?: (canvas: HTMLCanvasElement, config: any, onProgress?: (progress: number) => void) => Promise<any>;
    UnityLoader?: any;
  }
}

export default function UnitySimulator({ workerId, trainingMenuId, onSessionComplete }: UnitySimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const unityInstanceRef = useRef<any>(null);
  const handleSessionStartRef = useRef<(() => void) | null>(null);
  const handleSessionEndRef = useRef<((sessionData?: any) => Promise<void>) | null>(null);
  const isInitializingRef = useRef(false); // 初期化中フラグ（重複実行を防ぐ）
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [operationLogs, setOperationLogs] = useState<any[]>([]);

  // セッションIDを生成
  const generateSessionId = () => {
    return `unity-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Unityインスタンスの初期化
  useEffect(() => {
    // 既に初期化中の場合は、重複実行を防ぐ
    if (isInitializingRef.current) {
      console.log('[UnitySimulator] 既に初期化中です。重複実行をスキップします。');
      return;
    }
    
    isInitializingRef.current = true;
    console.log('[UnitySimulator] useEffect開始');
    
    // canvasRefが利用可能になるまで待つ（最大10回、合計1秒まで待つ）
    let retryCount = 0;
    const maxRetries = 10;
    
    const checkCanvas = () => {
      if (!canvasRef.current) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`[UnitySimulator] canvasRefがまだ利用できません。再試行 ${retryCount}/${maxRetries}`);
          setTimeout(checkCanvas, 100);
          return;
        } else {
          console.error('[UnitySimulator] canvasRefが利用できませんでした。モックモードで動作します。');
          // モックモードに移行
          setLoadingProgress(100);
          setIsLoading(false);
          isInitializingRef.current = false;
          return;
        }
      }
      
      console.log('[UnitySimulator] canvasRefが利用可能になりました。初期化を開始します。');
      initUnity();
    };

    const initUnity = async () => {
      try {
        console.log('[UnitySimulator] 初期化処理を開始します');
        setIsLoading(true);
        setError(null);
        setLoadingProgress(5); // 初期進捗を5%に設定（存在確認中であることを示す）

        // Unity WebGLビルドのパス（実際のパスに置き換える必要があります）
        const buildUrl = '/unity-build';
        const loaderUrl = `${buildUrl}/Build.loader.js`;
        const config = {
          dataUrl: `${buildUrl}/Build.data`,
          frameworkUrl: `${buildUrl}/Build.framework.js`,
          codeUrl: `${buildUrl}/Build.wasm`,
          streamingAssetsUrl: 'StreamingAssets',
          companyName: 'JobAssistance',
          productName: 'ConstructionSimulator',
          productVersion: '1.0.0',
        };

        // Unity Loaderファイルの存在確認（HEADリクエストは信頼しない）
        // HEADリクエストが成功しても、実際のGETリクエストが失敗する場合があるため、
        // 直接GETリクエストを試行する
        console.log('[UnitySimulator] Unity Loaderの読み込みを試行します:', loaderUrl);
        setLoadingProgress(10); // 読み込み開始
        
        try {
          // Unity Loaderスクリプトを動的に読み込む（実際のGETリクエストを試行）
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = loaderUrl;
            
            // タイムアウトを設定（5秒）
            const timeoutId = setTimeout(() => {
              reject(new Error('Unity Loader script load timeout'));
            }, 5000);
            
            script.onload = () => {
              clearTimeout(timeoutId);
              console.log('[UnitySimulator] Unity Loader script loaded successfully');
              resolve();
            };
            
            script.onerror = (error) => {
              clearTimeout(timeoutId);
              // Unity Loader Scriptが見つからない場合は、警告ではなく情報メッセージとして扱う
              console.log('[UnitySimulator] Unity Loader script not found. This is expected if Unity build files are not deployed. Switching to mock mode.');
              reject(new Error(`Unity Loader script not found at ${loaderUrl}. Mock mode will be used.`));
            };
            
            document.head.appendChild(script);
          });

          // 少し待ってからUnityインスタンスを作成
          await new Promise(resolve => setTimeout(resolve, 100));

          if (window.UnityLoader) {
            unityInstanceRef.current = window.UnityLoader.instantiate(
              canvasRef.current!,
              loaderUrl,
              config
            );
          } else if (window.createUnityInstance) {
            // Unity 2020.1以降の新しいローダー
            unityInstanceRef.current = await window.createUnityInstance(
              canvasRef.current!,
              config,
              (progress: number) => {
                setLoadingProgress(Math.round(progress * 100));
              }
            );
          }

          // Unityからのメッセージを受信
          if (unityInstanceRef.current) {
            // Unityからメッセージを受信するリスナーを設定
            const messageHandler = (event: MessageEvent) => {
              if (event.data && event.data.type) {
                switch (event.data.type) {
                  case 'operation_log':
                    setOperationLogs(prev => [...prev, {
                      timestamp: new Date().toISOString(),
                      ...event.data.data
                    }]);
                    break;
                  case 'session_start':
                    if (handleSessionStartRef.current) {
                      handleSessionStartRef.current();
                    }
                    break;
                  case 'session_end':
                    if (handleSessionEndRef.current) {
                      handleSessionEndRef.current(event.data.data);
                    }
                    break;
                  case 'error':
                    setError(event.data.message);
                    break;
                  default:
                    console.log('Unknown Unity message:', event.data);
                }
              }
            };
            window.addEventListener('message', messageHandler);
            // クリーンアップ用に保存
            (window as any).__unityMessageHandler = messageHandler;
          }
          
          console.log('[UnitySimulator] Unityが正常に読み込まれました');
          setIsLoading(false);
          isInitializingRef.current = false; // 初期化完了
        } catch (loadError) {
          // Unity Loader Scriptが見つからない場合、モックモードに移行（これは正常な動作）
          console.log('[UnitySimulator] Unity Loader script not found. Switching to mock mode.');
          console.log('[UnitySimulator] Mock mode allows training session recording without Unity build files.');
          // Unity読み込みに失敗した場合、モックモードに移行
          setLoadingProgress(100);
          setIsLoading(false);
          isInitializingRef.current = false; // 初期化完了（モックモード）
          console.log('[UnitySimulator] モックモードに移行しました。訓練セッションの記録が可能です。isLoading:', false);
          return; // 早期リターンでモックモードに移行
        }
      } catch (err) {
        // Unity Loader Scriptが見つからない場合は、既にモックモードに移行しているので、エラーを設定しない
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Unity';
        if (errorMessage.includes('Unity Loader script not found') || errorMessage.includes('Mock mode')) {
          // Unity Loader Scriptが見つからない場合は、エラーを設定しない（モックモードで正常に動作）
          console.log('[UnitySimulator] Unity Loader script not found. Already in mock mode.');
          setIsLoading(false);
          setLoadingProgress(100);
          isInitializingRef.current = false; // 初期化完了（モックモード）
        } else {
          // 予期しないエラーの場合のみ、エラーを設定
          console.error('[UnitySimulator] Unity initialization error:', err);
          setError(errorMessage);
          setIsLoading(false);
          setLoadingProgress(100);
          isInitializingRef.current = false; // 初期化完了（エラー）
        }
      }
    };

    // canvasRefが利用可能になるまで待つ
    checkCanvas();

    return () => {
      console.log('[UnitySimulator] クリーンアップを実行します');
      isInitializingRef.current = false; // 初期化フラグをリセット
      // クリーンアップ
      if (unityInstanceRef.current) {
        try {
          unityInstanceRef.current.Quit();
        } catch (e) {
          console.error('[UnitySimulator] Error quitting Unity:', e);
        }
      }
      // メッセージハンドラーを削除
      if ((window as any).__unityMessageHandler) {
        window.removeEventListener('message', (window as any).__unityMessageHandler);
        delete (window as any).__unityMessageHandler;
      }
    };
  }, []);

  // Unityにメッセージを送信
  const sendMessageToUnity = (gameObjectName: string, methodName: string, value?: any) => {
    if (unityInstanceRef.current) {
      try {
        unityInstanceRef.current.SendMessage(gameObjectName, methodName, value);
      } catch (err) {
        console.error('Error sending message to Unity:', err);
      }
    }
  };

  // 訓練セッションを開始
  const handleSessionStart = () => {
    const newSessionId = generateSessionId();
    const startTime = new Date();
    setSessionId(newSessionId);
    setSessionStartTime(startTime);
    setOperationLogs([]);
    setIsRunning(true);

    // Unityにセッション開始を通知
    sendMessageToUnity('TrainingManager', 'StartSession', {
      sessionId: newSessionId,
      workerId: workerId,
      trainingMenuId: trainingMenuId
    });

    // 操作ログはUnityから送信されるか、実際の操作から記録される
    // モックデータは生成しない
  };

  // handleSessionStartをuseRefに保存
  handleSessionStartRef.current = handleSessionStart;

  // 訓練セッションを終了
  const handleSessionEnd = async (sessionData?: any) => {
    if (!sessionId || !sessionStartTime) return;

    try {
      const sessionEndTime = new Date();
      const duration = Math.floor((sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000);

      // workerIdのバリデーション（0の場合はnullに設定）
      const validWorkerId = workerId && workerId > 0 ? workerId : null;
      if (workerId === 0 || workerId === null) {
        console.warn('[UnitySimulator] workerId is 0 or null. Setting worker_id to null in training session data.');
      }

      // 訓練セッションデータを準備
      const trainingSessionData: UnityTrainingSessionData = {
        session_id: sessionId,
        worker_id: validWorkerId,  // nullまたは有効なworker_id
        training_menu_id: trainingMenuId,
        session_start_time: sessionStartTime.toISOString(),
        session_end_time: sessionEndTime.toISOString(),
        duration_seconds: duration,
        status: '完了',
        operation_logs: operationLogs,
        ai_evaluation: sessionData?.ai_evaluation || {
          overall_score: calculateOverallScore(),
          safety_score: calculateSafetyScore(),
          efficiency_score: calculateEfficiencyScore(),
          accuracy_score: calculateAccuracyScore(),
          feedback: '訓練が完了しました。'
        },
        kpi_scores: {
          safety_score: calculateSafetyScore(),
          error_count: operationLogs.filter(log => log.error_event).length,
          procedure_compliance_rate: calculateComplianceRate(),
          work_time_seconds: duration,
          achievement_rate: 100,
          accuracy_score: calculateAccuracyScore(),
          efficiency_score: calculateEfficiencyScore(),
          overall_score: calculateOverallScore(),
          notes: 'Unityシミュレーターからの訓練結果'
        }
      };

      // バックエンドAPIに送信
      try {
        setError(null); // エラーメッセージをクリア
        const result = await unityApi.submitTrainingSession(trainingSessionData);
        console.log('[UnitySimulator] Training session submitted successfully:', result);

        // 親コンポーネントに通知
        onSessionComplete?.(sessionId, trainingSessionData);

        // セッションをリセット
        setIsRunning(false);
        setSessionId(null);
        setSessionStartTime(null);
        setOperationLogs([]);
        
        // 成功メッセージを表示
        setSuccessMessage('訓練セッションが正常に送信されました。');
        console.log('[UnitySimulator] 訓練セッションが正常に送信されました。');
        
        // 3秒後に成功メッセージを自動的に非表示にする
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (apiError: any) {
        // APIエラーの詳細をログに記録
        console.error('[UnitySimulator] Failed to submit training session:', apiError);
        
        // 成功メッセージをクリア
        setSuccessMessage(null);
        
        // エラーメッセージを抽出
        let errorMessage = '訓練セッションの送信に失敗しました。';
        if (apiError?.response?.data?.error) {
          errorMessage = `訓練セッションの送信に失敗しました: ${apiError.response.data.error}`;
        } else if (apiError?.message) {
          errorMessage = `訓練セッションの送信に失敗しました: ${apiError.message}`;
        }
        
        setError(errorMessage);
        
        // セッションはリセットしない（ユーザーが再試行できるように）
        // ただし、エラーが解決された場合は手動でリセットする必要がある
      }
    } catch (err) {
      console.error('[UnitySimulator] Unexpected error in handleSessionEnd:', err);
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    }
  };

  // handleSessionEndをuseRefに保存
  handleSessionEndRef.current = handleSessionEnd;

  // スコア計算関数（モック）
  const calculateOverallScore = () => {
    if (operationLogs.length === 0) return 0;
    const errorCount = operationLogs.filter(log => log.error_event).length;
    const baseScore = 100 - (errorCount * 5);
    return Math.max(0, Math.min(100, baseScore));
  };

  const calculateSafetyScore = () => {
    if (operationLogs.length === 0) return 0;
    const errorCount = operationLogs.filter(log => log.error_event).length;
    const baseScore = 100 - (errorCount * 10);
    return Math.max(0, Math.min(100, baseScore));
  };

  const calculateEfficiencyScore = () => {
    if (operationLogs.length === 0) return 0;
    return Math.min(100, (operationLogs.length / 100) * 100);
  };

  const calculateAccuracyScore = () => {
    if (operationLogs.length === 0) return 0;
    const errorCount = operationLogs.filter(log => log.error_event).length;
    const accuracy = ((operationLogs.length - errorCount) / operationLogs.length) * 100;
    return Math.max(0, Math.min(100, accuracy));
  };

  const calculateComplianceRate = () => {
    if (operationLogs.length === 0) return 0;
    const compliantLogs = operationLogs.filter(log => !log.error_event);
    return (compliantLogs.length / operationLogs.length) * 100;
  };

  // 手動でセッションを開始
  const handleStartSession = () => {
    if (!isRunning) {
      handleSessionStart();
    }
  };

  // 手動でセッションを終了
  const handleEndSession = () => {
    if (isRunning) {
      handleSessionEnd();
    }
  };

  return (
    <div className="space-y-4">
      {/* コントロールパネル */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Unityシミュレーター</h3>
          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={handleStartSession}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                訓練開始
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                訓練終了
              </button>
            )}
          </div>
        </div>

        {/* セッション情報 */}
        {isRunning && sessionId && (
          <div className="text-sm text-gray-600 space-y-1">
            <p>セッションID: {sessionId}</p>
            <p>開始時刻: {sessionStartTime?.toLocaleString()}</p>
            <p>操作ログ数: {operationLogs.length}</p>
          </div>
        )}
      </div>

      {/* 成功メッセージ表示 */}
      {successMessage && (
        <div className="glass rounded-xl p-4 bg-green-50 border border-green-200 animate-slide-up">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-700 font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="glass rounded-xl p-4 bg-red-50 border border-red-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Unityキャンバス */}
      <div className="glass rounded-2xl p-4 overflow-hidden">
        <div className="relative">
          {/* canvas要素は常にレンダリング（非表示でもDOMに存在させる） */}
          <canvas
            ref={canvasRef}
            className="w-full h-auto bg-gray-900 rounded-lg"
            style={{ 
              minHeight: '400px',
              display: isLoading && loadingProgress < 100 ? 'none' : 'block'
            }}
          />
          
          {/* ローディング表示 */}
          {isLoading && loadingProgress < 100 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center min-h-[400px] bg-white/90 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Unityを読み込み中... {loadingProgress}%</p>
              {loadingProgress < 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  Unity WebGLビルドを確認中...
                </p>
              )}
              {loadingProgress >= 10 && loadingProgress < 20 && (
                <p className="text-sm text-gray-500 mt-2">
                  Unity Loaderを読み込み中...
                </p>
              )}
            </div>
          )}
          
          {/* モックモード表示 */}
          {!unityInstanceRef.current && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 rounded-lg">
              <div className="text-center text-white p-6 max-w-2xl">
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <p className="text-xl font-semibold mb-2">Unityシミュレーター（モックモード）</p>
                <p className="text-sm text-gray-300 mb-4">
                  Unity WebGLビルドを配置すると、ここにシミュレーターが表示されます。
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 text-left text-sm space-y-2 mb-4">
                  <p className="font-semibold text-blue-400 mb-2">Unity WebGLビルドの配置方法:</p>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Unity WebGLビルドを <code className="bg-gray-700 px-2 py-1 rounded">public/unity-build/</code> に配置</li>
                    <li>• 必要なファイル: Build.loader.js, Build.data, Build.framework.js, Build.wasm</li>
                    <li>• 現在はモックモードで動作中（訓練セッションの記録は可能）</li>
                  </ul>
                </div>
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-sm text-green-300">
                  <p className="font-semibold mb-1">✓ モックモードで動作中</p>
                  <p className="text-xs text-green-400">訓練セッションの開始・終了、操作ログの記録、APIへの送信が可能です。</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 操作ログ表示（デバッグ用） */}
      {operationLogs.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h4 className="font-semibold mb-2">操作ログ（最新10件）</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {operationLogs.slice(-10).map((log, index) => (
              <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                {' '}
                <span>{log.operation_type}: {log.operation_value}</span>
                {log.error_event && (
                  <span className="ml-2 text-red-600">⚠ エラー</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

