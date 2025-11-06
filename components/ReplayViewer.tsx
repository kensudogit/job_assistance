/**
 * リプレイビューアコンポーネント
 * 訓練セッションの操作ログを再生し、AI評価とKPIを同期表示する
 */
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { replayApi, type ReplayData } from '@/lib/api';

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
    <div className="space-y-6">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* リプレイビューア */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 shadow-xl card-hover">
          <h3 className="text-xl font-bold mb-4">操作ログ再生</h3>
          <div className="bg-gray-900 rounded-lg p-4 min-h-[400px] text-green-400 font-mono text-sm overflow-auto">
            {currentLogs.length > 0 ? (
              <div className="space-y-2">
                {currentLogs.slice(-20).map((log, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-500">{new Date(log.timestamp || '').toLocaleTimeString()}</span>
                    <span className="text-blue-400">{log.operation_type || '操作'}</span>
                    {log.error_event && (
                      <span className="text-red-400">⚠ エラー: {log.error_description}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-20">操作ログがありません</div>
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
                    kpi.error_event ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                  }`}>
                    <div className="text-xs text-gray-600 mb-1">
                      {new Date(kpi.timestamp).toLocaleTimeString()}
                    </div>
                    {kpi.error_event && (
                      <div className="text-sm text-red-700 font-semibold">
                        ⚠ {kpi.error_description}
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

