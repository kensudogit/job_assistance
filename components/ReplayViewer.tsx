/**
 * リプレイビューアコンポーネント
 * 訓練セッションの操作ログを再生し、AI評価とKPIを同期表示する
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { replayApi, type ReplayData } from '@/lib/api';
import html2canvas from 'html2canvas';

/**
 * リプレイビューアコンポーネントのプロパティ
 */
interface ReplayViewerProps {
  sessionId: string;  // 訓練セッションID
}

/**
 * リプレイビューアコンポーネント
 * 訓練セッションの操作ログを再生し、AI評価とKPIタイムラインを表示
 */
export default function ReplayViewer({ sessionId }: ReplayViewerProps) {
  const { t } = useTranslation();
  
  // 状態管理
  const [replayData, setReplayData] = useState<ReplayData | null>(null);  // リプレイデータ
  const [loading, setLoading] = useState(true);                            // ローディング状態
  const [error, setError] = useState<string | null>(null);                 // エラーメッセージ
  const [currentTime, setCurrentTime] = useState(0);                       // 現在の再生時刻（ミリ秒）
  const [isPlaying, setIsPlaying] = useState(false);                       // 再生状態
  const [playbackSpeed, setPlaybackSpeed] = useState(1);                   // 再生速度（0.5x, 1x, 1.5x, 2x）
  const [isRecording, setIsRecording] = useState(false);                   // 録画状態
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);  // メディアレコーダー
  const replayContainerRef = useRef<HTMLDivElement>(null);                 // リプレイコンテナの参照
  const drawIntervalRef = useRef<number | null>(null);                      // 描画インターバルの参照
  const isCapturingRef = useRef(false);                                    // キャプチャ中のフラグ
  const canvasRef = useRef<HTMLCanvasElement | null>(null);                // Canvasの参照
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);            // Canvasコンテキストの参照
  const isRecordingRef = useRef(false);                                     // 録画状態の参照
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);             // メディアレコーダーの参照

  // セッションIDが変更されたときにリプレイデータを読み込む
  useEffect(() => {
    loadReplayData();
  }, [sessionId]);

  /**
   * リプレイデータを読み込む
   * APIからリプレイデータ（操作ログ、AI評価、KPI）を取得
   */
  const loadReplayData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await replayApi.get(sessionId);
      setReplayData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'リプレイデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 再生状態に応じてタイマーを設定
  useEffect(() => {
    if (!isPlaying || !replayData) return;

    const duration = replayData.duration_seconds * 1000; // ミリ秒に変換
    // 100msごとに再生時刻を更新
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + (100 * playbackSpeed); // 再生速度に応じて時刻を進める
        if (next >= duration) {
          // 終了時は再生を停止
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
    }, 100);

    // クリーンアップ（タイマーをクリア）
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, replayData]);

  /**
   * 再生開始
   */
  const handlePlay = () => {
    setIsPlaying(true);
  };

  /**
   * 再生一時停止
   */
  const handlePause = () => {
    setIsPlaying(false);
  };

  /**
   * 再生位置をシーク（指定時刻に移動）
   * @param time - 移動先の時刻（ミリ秒）
   */
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    // シーク時は再生を停止
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  /**
   * 動画録画を開始
   * html2canvasを使用して画面をキャプチャし、MediaRecorder APIで動画として録画
   */
  const handleStartRecording = async () => {
    try {
      if (!replayContainerRef.current) {
        setError('録画対象の要素が見つかりません');
        return;
      }

      // 実際の要素のサイズを取得
      const rect = replayContainerRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 1280); // 最小幅1280px
      const height = Math.max(rect.height, 720); // 最小高さ720px

      // Canvasを作成してMediaRecorderに接続
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false }); // アルファチャンネルを無効化
      
      if (!ctx) {
        setError('Canvasコンテキストの取得に失敗しました');
        return;
      }

      // Canvasとコンテキストをrefに保存
      canvasRef.current = canvas;
      ctxRef.current = ctx;

      // 背景色を設定
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // MediaRecorder APIを使用して動画を録画
      const stream = canvas.captureStream(10); // 10fps（html2canvasの処理時間を考慮）
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : MediaRecorder.isTypeSupported('video/webm') 
        ? 'video/webm' 
        : 'video/mp4';
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5Mbps
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        // 描画インターバルをクリア
        if (drawIntervalRef.current) {
          clearInterval(drawIntervalRef.current);
          drawIntervalRef.current = null;
        }
        isCapturingRef.current = false;
        isRecordingRef.current = false;
        
        // Canvasとコンテキストをクリア
        canvasRef.current = null;
        ctxRef.current = null;
        mediaRecorderRef.current = null;
        
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
          a.download = `replay-${sessionId}-${Date.now()}.${extension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          console.log('[ReplayViewer] 動画の録画が完了しました。ファイルサイズ:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
          console.log('[ReplayViewer] 動画形式:', mimeType);
          console.log('[ReplayViewer] 動画チャンク数:', chunks.length);
        } else {
          setError('録画されたデータがありません。');
        }
        setIsRecording(false);
        setMediaRecorder(null);
      };

      recorder.start(100); // 100msごとにデータを取得
      setMediaRecorder(recorder);
      setIsRecording(true);
      isRecordingRef.current = true;
      mediaRecorderRef.current = recorder;

      // 再生を開始して録画
      if (!isPlaying) {
        setIsPlaying(true);
      }

      // 録画中は定期的にhtml2canvasで画面をキャプチャしてCanvasに描画
      const captureFrame = async () => {
        if (!replayContainerRef.current || !ctxRef.current || !canvasRef.current || isCapturingRef.current) return;
        
        isCapturingRef.current = true;
        try {
          // html2canvasを使用して画面をキャプチャ
          const canvasElement = await html2canvas(replayContainerRef.current, {
            width: width,
            height: height,
            scale: 1,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });
          
          // キャプチャした画像をCanvasに描画
          const ctx = ctxRef.current;
          const canvas = canvasRef.current;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(canvasElement, 0, 0, canvas.width, canvas.height);
        } catch (err) {
          console.error('画面キャプチャエラー:', err);
        } finally {
          isCapturingRef.current = false;
        }
      };

      // 最初のフレームをキャプチャ
      await captureFrame();

      // 定期的にフレームをキャプチャ（非同期処理を考慮して間隔を調整）
      // 前のフレームのキャプチャが完了してから次のフレームをキャプチャする
      const captureLoop = async () => {
        while (isRecordingRef.current && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          if (!isCapturingRef.current) {
            await captureFrame();
          }
          // 次のフレームまで待機（10fps = 100ms）
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      };

      // キャプチャループを開始
      captureLoop().catch(err => {
        console.error('キャプチャループエラー:', err);
        setIsRecording(false);
        isRecordingRef.current = false;
      });
    } catch (err) {
      console.error('録画開始エラー:', err);
      setError(err instanceof Error ? err.message : '録画の開始に失敗しました');
      setIsRecording(false);
    }
  };

  /**
   * 動画録画を停止
   */
  const handleStopRecording = () => {
    isRecordingRef.current = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    // 描画インターバルをクリア
    if (drawIntervalRef.current) {
      clearInterval(drawIntervalRef.current);
      drawIntervalRef.current = null;
    }
  };

  // クリーンアップ: コンポーネントのアンマウント時に録画を停止
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (drawIntervalRef.current) {
        clearInterval(drawIntervalRef.current);
      }
    };
  }, []); // コンポーネントのアンマウント時にのみクリーンアップ

  if (loading) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (error || !replayData) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-700 font-medium">{error || 'リプレイデータが見つかりません'}</p>
      </div>
    );
  }

  const currentTimeSeconds = currentTime / 1000;
  const durationSeconds = replayData.duration_seconds || 0;
  const progress = durationSeconds > 0 ? (currentTimeSeconds / durationSeconds) * 100 : 0;

  // 現在時刻の操作ログを取得
  const currentLogs = replayData.operation_logs?.filter(log => {
    const logTime = new Date(log.timestamp || log.timestamp).getTime();
    const startTime = new Date(replayData.session_start_time).getTime();
    return (logTime - startTime) / 1000 <= currentTimeSeconds;
  }) || [];

  // 現在時刻のKPIタイムラインを取得
  const currentKPI = replayData.kpi_timeline?.find(kpi => {
    const kpiTime = new Date(kpi.timestamp).getTime();
    const startTime = new Date(replayData.session_start_time).getTime();
    return (kpiTime - startTime) / 1000 <= currentTimeSeconds;
  });

  return (
    <div className="space-y-6" ref={replayContainerRef}>
      {/* ヘッダー */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">リプレイ再生</h2>
            <span className="ml-auto text-sm opacity-80">セッションID: {replayData.session_id}</span>
          </div>
        </div>
      </div>

      {/* 再生コントロール */}
      <div className="glass rounded-2xl p-6 shadow-xl card-hover">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={durationSeconds * 1000}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`,
              }}
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>{formatTime(currentTimeSeconds)}</span>
              <span>{formatTime(durationSeconds)}</span>
            </div>
          </div>

          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          {/* 録画ボタン */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              title="動画録画を開始"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="12" cy="12" r="4" fill="currentColor"/>
              </svg>
              録画開始
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="px-4 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition-colors flex items-center gap-2 animate-pulse"
              title="動画録画を停止"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <rect x="9" y="9" width="6" height="6" fill="currentColor"/>
              </svg>
              録画中...
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* リプレイビューア */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-xl card-hover">
          <h3 className="text-xl font-bold mb-4">操作ログ再生</h3>
          
          {/* Unityシミュレーション動画の説明 */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-semibold mb-1">Unityシミュレーション動画について</p>
                <p className="text-xs text-blue-700">
                  現在はモックモードで動作しているため、実際のUnityシミュレーション動画は再生されません。
                  Unity WebGLビルドを配置すると、ここにシミュレーション動画が表示されます。
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  • Unity WebGLビルドを <code className="bg-blue-100 px-1 rounded">public/unity-build/</code> に配置<br/>
                  • 必要なファイル: Build.loader.js, Build.data, Build.framework.js, Build.wasm<br/>
                  • 現在は操作ログのみを表示しています
                </p>
              </div>
            </div>
          </div>

          {/* 操作ログ表示 */}
          <div className="bg-gray-900 rounded-lg p-4 min-h-[400px] text-green-400 font-mono text-sm overflow-auto">
            {currentLogs.length > 0 ? (
              <div className="space-y-2">
                {currentLogs.slice(-20).map((log, index) => (
                  <div key={index} className="flex flex-col gap-1 p-2 bg-gray-800/50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{new Date(log.timestamp || '').toLocaleTimeString()}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        log.event_type === 'error' ? 'bg-red-900 text-red-300' :
                        log.event_type === 'achievement' ? 'bg-green-900 text-green-300' :
                        'bg-blue-900 text-blue-300'
                      }`}>
                        {log.event_type === 'error' ? 'エラー' :
                         log.event_type === 'achievement' ? '達成' :
                         '操作'}
                      </span>
                      <span className="text-blue-400">{log.operation_type || '操作'}</span>
                      {log.operation_value && (
                        <span className="text-yellow-400">: {log.operation_value}</span>
                      )}
                    </div>
                    {log.error_event && log.error_description && (
                      <div className="text-red-400 text-xs ml-4">⚠ エラー: {log.error_description}</div>
                    )}
                    {log.achievement_event && log.achievement_description && (
                      <div className="text-green-400 text-xs ml-4">✓ 達成: {log.achievement_description}</div>
                    )}
                    {log.state_log && (
                      <div className="text-gray-400 text-xs ml-4">
                        位置: ({log.state_log.position?.x?.toFixed(2) || 'N/A'}, {log.state_log.position?.y?.toFixed(2) || 'N/A'}, {log.state_log.position?.z?.toFixed(2) || 'N/A'})
                        {log.state_log.velocity !== undefined && (
                          <span className="ml-2">速度: {log.state_log.velocity.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-20">
                <p>操作ログがありません</p>
                <p className="text-xs mt-2 text-gray-400">
                  訓練セッション中に記録された操作ログがここに表示されます
                </p>
              </div>
            )}
          </div>
        </div>

        {/* KPI情報 */}
        <div className="space-y-6">
          {/* KPIスコア */}
          {replayData.kpi_scores && (
            <div className="glass rounded-2xl p-6 shadow-xl card-hover">
              <h3 className="text-xl font-bold mb-4">KPIスコア</h3>
              <div className="space-y-3">
                {replayData.kpi_scores.safety_score !== undefined && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">安全動作率</span>
                      <span className="text-sm font-bold text-gray-900">{replayData.kpi_scores.safety_score.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${replayData.kpi_scores.safety_score}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {replayData.kpi_scores.error_count !== undefined && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">エラー件数</span>
                      <span className="text-sm font-bold text-gray-900">{replayData.kpi_scores.error_count}件</span>
                    </div>
                  </div>
                )}
                {replayData.kpi_scores.procedure_compliance_rate !== undefined && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">手順遵守率</span>
                      <span className="text-sm font-bold text-gray-900">{replayData.kpi_scores.procedure_compliance_rate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${replayData.kpi_scores.procedure_compliance_rate}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {replayData.kpi_scores.overall_score !== undefined && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-700">総合スコア</span>
                      <span className="text-sm font-bold text-indigo-600">{replayData.kpi_scores.overall_score.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${replayData.kpi_scores.overall_score}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI評価 */}
          {replayData.ai_evaluation && (
            <div className="glass rounded-2xl p-6 shadow-xl card-hover">
              <h3 className="text-xl font-bold mb-4">AI評価</h3>
              <div className="space-y-2">
                {typeof replayData.ai_evaluation === 'object' ? (
                  Object.entries(replayData.ai_evaluation).map(([key, value]) => (
                    <div key={key} className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-semibold text-blue-700 mb-1">{key}</div>
                      <div className="text-sm text-gray-700">{String(value)}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-700">{String(replayData.ai_evaluation)}</p>
                )}
              </div>
            </div>
          )}

              {/* KPIタイムライン */}
              {replayData.kpi_timeline && replayData.kpi_timeline.length > 0 && (
                <div className="glass rounded-2xl p-6 shadow-xl card-hover">
                  <h3 className="text-xl font-bold mb-4">KPIタイムライン</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {replayData.kpi_timeline.map((kpi, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        kpi.error_event ? 'bg-red-50 border border-red-200' : 
                        kpi.achievement_event ? 'bg-green-50 border border-green-200' : 
                        'bg-gray-50'
                      }`}>
                        <div className="text-xs text-gray-600 mb-1">
                          {new Date(kpi.timestamp).toLocaleTimeString()}
                        </div>
                        {kpi.error_event && kpi.error_description && (
                          <div className="text-sm text-red-700 font-semibold">
                            ⚠ エラー: {kpi.error_description}
                          </div>
                        )}
                        {kpi.achievement_event && kpi.achievement_description && (
                          <div className="text-sm text-green-700 font-semibold">
                            ✓ 達成: {kpi.achievement_description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

