'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { integratedDashboardApi, IntegratedDashboardData, api } from '@/lib/api';
import AdminSummary from '@/components/AdminSummary';
import WorkerList from '@/components/WorkerList';
import TrainingMenuManagement from '@/components/TrainingMenuManagement';
import WorkerForm from '@/components/WorkerForm';

interface IntegratedDashboardProps {
  workerId: number;
}

function IntegratedDashboard({ workerId }: IntegratedDashboardProps) {
  console.log('[IntegratedDashboard] Component rendering, workerId:', workerId);
  
  // useTranslationを呼び出す（常に最初に呼び出す必要がある）
  const { t: tOriginal } = useTranslation();
  
  // 安全なt関数（初期化エラーを防ぐ）
  const t = React.useMemo(() => {
    if (typeof tOriginal === 'function') {
      return tOriginal;
    }
    return (key: string) => key;
  }, [tOriginal]);
  // 初期状態でデフォルト値を設定して、サマリー情報を常に表示できるようにする
  const defaultDashboardData: IntegratedDashboardData = {
    kpi_timeline: [],
    japanese_proficiency: [],
    summary: {
      total_sessions: 0,
      total_training_hours: 0,
      average_overall_score: undefined,
      latest_overall_score: undefined,
      total_milestones: 0,
      achieved_milestones: 0,
      milestone_achievement_rate: 0,
    },
    recent_milestones: [],
    recent_progress: [],
  };
  const [dashboardData, setDashboardData] = useState<IntegratedDashboardData>(defaultDashboardData);
  const [loading, setLoading] = useState(false); // 初期状態をfalseにして、すぐにサマリー情報を表示
  const [error, setError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [screenshotsLoading, setScreenshotsLoading] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<any | null>(null);
  const [showAdminSummary, setShowAdminSummary] = useState(false);
  const [showWorkerList, setShowWorkerList] = useState(false);
  const [showTrainingMenu, setShowTrainingMenu] = useState(false);
  const [showWorkerForm, setShowWorkerForm] = useState(false);

  const loadDashboardData = React.useCallback(async (id: number = workerId || 0) => {
    try {
      setLoading(true);
      setError(null);
      setRenderError(null);
      console.log('[IntegratedDashboard] Loading data for workerId:', id);
      const data = await integratedDashboardApi.get(id);
      console.log('[IntegratedDashboard] API response:', data);
      // データを安全に設定
      if (data) {
        const dashboardDataToSet = {
          kpi_timeline: Array.isArray(data.kpi_timeline) ? data.kpi_timeline : [],
          japanese_proficiency: Array.isArray(data.japanese_proficiency) ? data.japanese_proficiency : [],
          summary: data.summary || {
            total_sessions: 0,
            total_training_hours: 0,
            average_overall_score: undefined,
            latest_overall_score: undefined,
            total_milestones: 0,
            achieved_milestones: 0,
            milestone_achievement_rate: 0,
          },
          recent_milestones: Array.isArray(data.recent_milestones) ? data.recent_milestones : [],
          recent_progress: Array.isArray(data.recent_progress) ? data.recent_progress : [],
        };
        console.log('[IntegratedDashboard] Setting dashboard data:', dashboardDataToSet);
        setDashboardData(dashboardDataToSet);
      } else {
        console.log('[IntegratedDashboard] No data received, setting empty data');
        setDashboardData(defaultDashboardData);
      }
    } catch (err) {
      console.error('[IntegratedDashboard] Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setDashboardData(defaultDashboardData);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    console.log('[IntegratedDashboard] Component mounted/updated, workerId:', workerId);
    const safeWorkerId = workerId || 0;
    
    // ダッシュボードデータを読み込む
    loadDashboardData(safeWorkerId);
    
    // スクリーンショット一覧を取得
    const loadScreenshots = async (id: number) => {
      if (!id || id === 0) {
        setScreenshots([]);
        return;
      }
      try {
        setScreenshotsLoading(true);
        const response = await api.get(`/api/workers/${id}/documents`, {
          withCredentials: true,
        });
        if (response.data.success) {
          // スクリーンショットのみをフィルタリング
          const screenshotList = response.data.data.filter(
            (doc: any) => doc.document_type === 'screenshot'
          );
          setScreenshots(screenshotList);
        }
      } catch (err) {
        console.error('Screenshot fetch error:', err);
        setScreenshots([]);
      } finally {
        setScreenshotsLoading(false);
      }
    };
    
    loadScreenshots(safeWorkerId);
  }, [workerId, loadDashboardData]);

  /**
   * スクリーンショットのURLを取得
   */
  const getScreenshotUrl = (filePath: string) => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    return `${apiBaseUrl}/api/files/${filePath}`;
  };

  // loading中でもサマリー情報は表示する（初期状態ではloading=falseなので、すぐに表示される）
  // データロード中は、既存のデータを表示し続ける
  // loadingの早期リターンを削除して、常にコンテンツを表示する

  if (error && !dashboardData) {
    // エラーがあり、かつデータもない場合のみエラーを表示
    return (
      <div className="glass rounded-2xl p-6">
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  // エラーが発生した場合はエラーメッセージを表示
  if (renderError) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
          <p className="font-semibold">{t('dashboardError')}</p>
          <p className="text-sm mt-2">{t('switchedToSimpleMode')}</p>
        </div>
      </div>
    );
  }

  // デフォルト値を設定（APIレスポンスが不完全な場合に備える）
  // 配列であることを確認し、そうでない場合は空配列を設定
  // より安全な方法で初期化：確実に配列であることを保証
  // dashboardDataがnullまたはundefinedの場合も考慮
  // エラーが発生した場合に備えて、すべての処理をtry-catchで囲む
  let safeKpiTimelineFinal: any[] = [];
  let safeJapaneseProficiencyFinal: any[] = [];
  let safeRadarChartData: any[] = [];
  
  // dashboardDataは常にデフォルト値が設定されているため、nullチェックは不要
  const safeDashboardData = dashboardData;
  
  try {
    const kpiTimelineRaw = safeDashboardData?.kpi_timeline;
    const japaneseProficiencyRaw = safeDashboardData?.japanese_proficiency;
    
    // 確実に配列であることを保証（複数回チェック）
    if (kpiTimelineRaw && Array.isArray(kpiTimelineRaw)) {
      safeKpiTimelineFinal = kpiTimelineRaw;
    } else {
      safeKpiTimelineFinal = [];
    }
    
    if (japaneseProficiencyRaw && Array.isArray(japaneseProficiencyRaw)) {
      safeJapaneseProficiencyFinal = japaneseProficiencyRaw;
    } else {
      safeJapaneseProficiencyFinal = [];
    }
    
    // 最終的な安全チェック：確実に配列であることを保証
    if (!Array.isArray(safeKpiTimelineFinal)) {
      safeKpiTimelineFinal = [];
    }
    if (!Array.isArray(safeJapaneseProficiencyFinal)) {
      safeJapaneseProficiencyFinal = [];
    }

    // レーダーチャート用のデータ（最新のKPIデータ）
    // 安全にアクセスするために、配列であることを確認
    let latestKPI = null;
    if (safeKpiTimelineFinal && Array.isArray(safeKpiTimelineFinal)) {
      try {
        if (safeKpiTimelineFinal.length > 0) {
          latestKPI = safeKpiTimelineFinal[0];
        }
      } catch (err) {
        console.error('Error accessing safeKpiTimelineFinal length:', err);
        latestKPI = null;
      }
    }
    const radarChartData = latestKPI ? [
      { name: t('safetyScore'), value: latestKPI.safety_score || 0, max: 100 },
      { name: t('procedureCompliance'), value: latestKPI.procedure_compliance_rate || 0, max: 100 },
      { name: t('achievementRate'), value: latestKPI.achievement_rate || 0, max: 100 },
      { name: t('overallScore'), value: latestKPI.overall_score || 0, max: 100 },
    ] : [];
    // 確実に配列であることを保証
    safeRadarChartData = Array.isArray(radarChartData) ? radarChartData : [];
  } catch (err) {
    // エラーが発生した場合は空配列を設定
    console.error('IntegratedDashboard data processing error:', err);
    safeKpiTimelineFinal = [];
    safeJapaneseProficiencyFinal = [];
    safeRadarChartData = [];
  }

  // 最終的な安全チェック：確実に配列であることを保証
  if (!Array.isArray(safeKpiTimelineFinal)) {
    safeKpiTimelineFinal = [];
  }
  if (!Array.isArray(safeJapaneseProficiencyFinal)) {
    safeJapaneseProficiencyFinal = [];
  }
  if (!Array.isArray(safeRadarChartData)) {
    safeRadarChartData = [];
  }

  try {
    return (
      <div className="space-y-6">
      {/* 統合ダッシュボードヘッダー */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">{t('integratedDashboard')}</h2>
            </div>
            <button
              onClick={() => setShowWorkerForm(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 backdrop-blur-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('addWorker') || '就労者を追加'}
            </button>
          </div>
        </div>
      </div>

      {/* 管理機能ボタン */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="p-6 bg-white">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAdminSummary(!showAdminSummary)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                showAdminSummary
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showAdminSummary && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {t('adminSummary') || '管理者向けサマリー'}
            </button>
            <button
              onClick={() => setShowWorkerList(!showWorkerList)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                showWorkerList
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showWorkerList && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {t('allWorkersProgress') || '全作業員の進捗'}
            </button>
            <button
              onClick={() => setShowTrainingMenu(!showTrainingMenu)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                showTrainingMenu
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {showTrainingMenu && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {t('trainingMenuManagement') || '訓練メニュー管理'}
            </button>
          </div>
        </div>
      </div>

      {/* 管理者向けサマリー */}
      {showAdminSummary && (
        <div className="animate-fade-in">
          <AdminSummary />
        </div>
      )}

      {/* 全作業員の進捗 */}
      {showWorkerList && (
        <div className="animate-fade-in">
          <WorkerList
            onSelectWorker={(workerId) => {
              // 作業員選択時の処理（必要に応じて実装）
              console.log('Selected worker:', workerId);
            }}
            selectedWorker={workerId || null}
          />
        </div>
      )}

      {/* 訓練メニュー管理 */}
      {showTrainingMenu && (
        <div className="animate-fade-in">
          <TrainingMenuManagement />
        </div>
      )}

      {/* 就労者登録フォームモーダル */}
      {showWorkerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">{t('addWorker') || '就労者を追加'}</h3>
              <button
                onClick={() => setShowWorkerForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <WorkerForm
                onSuccess={() => {
                  setShowWorkerForm(false);
                  // 必要に応じてデータを再読み込み
                  if (workerId) {
                    loadDashboardData(workerId);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* サマリー情報 - 常に表示（最初に表示） */}
      {(() => {
        try {
          const summary = safeDashboardData?.summary || {
            total_sessions: 0,
            total_training_hours: 0,
            average_overall_score: undefined,
            latest_overall_score: undefined,
            total_milestones: 0,
            achieved_milestones: 0,
            milestone_achievement_rate: 0,
          };
          return (
            <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <h3 className="text-xl font-bold mb-4">{t('summary')}</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                    <div className="text-sm text-gray-600 mb-2">{t('totalSessions')}</div>
                    <div className="text-3xl font-bold text-blue-600">{summary.total_sessions || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                    <div className="text-sm text-gray-600 mb-2">{t('totalTrainingHours')}</div>
                    <div className="text-3xl font-bold text-green-600">{summary.total_training_hours || 0}h</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                    <div className="text-sm text-gray-600 mb-2">{t('averageScore')}</div>
                    <div className="text-3xl font-bold text-purple-600">
                      {summary.average_overall_score !== undefined ? summary.average_overall_score.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border-2 border-indigo-200">
                    <div className="text-sm text-gray-600 mb-2">{t('latestScore')}</div>
                    <div className="text-3xl font-bold text-indigo-600">
                      {summary.latest_overall_score !== undefined ? summary.latest_overall_score.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
                    <div className="text-sm text-gray-600 mb-2">{t('milestoneAchievementRate')}</div>
                    <div className="text-3xl font-bold text-orange-600">{summary.milestone_achievement_rate || 0}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border-2 border-yellow-200">
                    <div className="text-sm text-gray-600 mb-2">{t('totalMilestones')}</div>
                    <div className="text-3xl font-bold text-yellow-600">{summary.total_milestones || 0}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {t('achieved')}: {summary.achieved_milestones || 0}
                    </div>
                  </div>
                </div>
                {workerId === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded">
                    <p className="text-sm">{t('selectWorkerForDetails')}</p>
                  </div>
                )}
              </div>
            </div>
          );
        } catch (err) {
          console.error('Summary render error:', err);
          return null;
        }
      })()}

      {/* レーダーチャート（技能KPI） */}
      {(() => {
        try {
          if (safeRadarChartData && Array.isArray(safeRadarChartData)) {
            const length = safeRadarChartData.length;
            if (length > 0) {
              return (
            <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                <h3 className="text-xl font-bold mb-4">{t('skillKPIRadarChart')}</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {safeRadarChartData.map((item, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="text-sm text-gray-600 mb-2">{item.name}</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-blue-600">{item.value.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">/ {item.max}</div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(item.value / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
                </div>
              </div>
            </div>
          );
            }
          }
          return null;
        } catch (err) {
          console.error('Radar chart render error:', err);
          return null;
        }
      })()}

      {/* 時系列グラフ（KPI推移） */}
      {(() => {
        try {
          if (safeKpiTimelineFinal && Array.isArray(safeKpiTimelineFinal)) {
            const length = safeKpiTimelineFinal.length;
            if (length > 0) {
              const slicedData = safeKpiTimelineFinal.slice(0, 10);
              return (
            <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
              <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <h3 className="text-xl font-bold mb-4">{t('kpiTimeline')}</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {slicedData.map((kpi, index) => (
                <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-semibold text-gray-700">
                      {new Date(kpi.date).toLocaleDateString()}
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {kpi.overall_score?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {kpi.safety_score !== undefined && (
                      <div>
                        <span className="text-gray-600">{t('safetyScore')}:</span>
                        <span className="ml-2 font-semibold text-green-700">{kpi.safety_score.toFixed(1)}</span>
                      </div>
                    )}
                    {kpi.error_count !== undefined && (
                      <div>
                        <span className="text-gray-600">{t('errorCount')}:</span>
                        <span className="ml-2 font-semibold text-red-700">{kpi.error_count}</span>
                      </div>
                    )}
                    {kpi.procedure_compliance_rate !== undefined && (
                      <div>
                        <span className="text-gray-600">{t('procedureCompliance')}:</span>
                        <span className="ml-2 font-semibold text-blue-700">{kpi.procedure_compliance_rate.toFixed(1)}%</span>
                      </div>
                    )}
                    {kpi.achievement_rate !== undefined && (
                      <div>
                        <span className="text-gray-600">{t('achievementRate')}:</span>
                        <span className="ml-2 font-semibold text-purple-700">{kpi.achievement_rate.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
                </div>
              </div>
            </div>
          );
            }
          }
          return null;
        } catch (err) {
          console.error('KPI timeline render error:', err);
          return null;
        }
      })()}

      {/* ステップチャート（日本語能力推移） */}
      {(() => {
        try {
          if (safeJapaneseProficiencyFinal && Array.isArray(safeJapaneseProficiencyFinal)) {
            const length = safeJapaneseProficiencyFinal.length;
            if (length > 0) {
              return (
            <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
              <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <h3 className="text-xl font-bold mb-4">{t('japaneseProficiencyTimeline')}</h3>
              </div>
              <div className="p-6">
                <div className="relative">
                  {/* タイムライン */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 to-pink-300" />
                  
                  {/* ステップアイテム */}
                  <div className="space-y-6">
                    {safeJapaneseProficiencyFinal.map((proficiency, index) => (
                  <div key={index} className="relative flex items-start gap-4">
                    {/* ステップマーカー */}
                    <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                      proficiency.passed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
                      {proficiency.level || '?'}
                    </div>
                    
                    {/* ステップコンテンツ */}
                    <div className="flex-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{proficiency.test_type}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(proficiency.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {proficiency.passed ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                              {t('passed')}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                              {t('failed')}
                            </span>
                          )}
                          {proficiency.total_score && (
                            <span className="text-lg font-bold text-purple-600">
                              {proficiency.total_score}点
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
            }
          }
          return null;
        } catch (err) {
          console.error('Japanese proficiency render error:', err);
          return null;
        }
      })()}


      {/* 最近のマイルストーン - 常に表示 */}
      {(() => {
        try {
          const recentMilestones = safeDashboardData?.recent_milestones;
          const hasMilestones = recentMilestones && Array.isArray(recentMilestones) && recentMilestones.length > 0;
          return (
            <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
              <div className="p-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                <h3 className="text-xl font-bold mb-4">{t('recentMilestones')}</h3>
              </div>
              <div className="p-6">
                {hasMilestones ? (
                  <div className="space-y-3">
                    {recentMilestones.slice(0, 5).map((milestone) => (
                      <div key={milestone.id} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{milestone.milestone_name}</div>
                            <div className="text-sm text-gray-600">{milestone.milestone_type}</div>
                            {milestone.target_date && (
                              <div className="text-xs text-gray-500 mt-1">
                                {t('targetDate')}: {new Date(milestone.target_date).toLocaleDateString()}
                              </div>
                            )}
                            {milestone.achieved_date && (
                              <div className="text-xs text-green-600 mt-1">
                                {t('achievedDate')}: {new Date(milestone.achieved_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              milestone.status === '達成' 
                                ? 'bg-green-100 text-green-700' 
                                : milestone.status === '進行中'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {milestone.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">{t('noMilestoneData')}</p>
                    {workerId === 0 && (
                      <p className="text-xs mt-2">{t('selectWorkerForMilestones')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        } catch (err) {
          console.error('Recent milestones render error:', err);
          return null;
        }
      })()}

      {/* 最近の進捗記録 - 常に表示 */}
      {(() => {
        try {
          const recentProgress = safeDashboardData?.recent_progress;
          const hasProgress = recentProgress && Array.isArray(recentProgress) && recentProgress.length > 0;
          return (
            <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
              <div className="p-6 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                <h3 className="text-xl font-bold mb-4">{t('recentProgress')}</h3>
              </div>
              <div className="p-6">
                {hasProgress ? (
                  <div className="space-y-3">
                    {recentProgress.slice(0, 5).map((progress) => (
                      <div key={progress.id} className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border-2 border-teal-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{progress.title || progress.progress_type}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(progress.progress_date).toLocaleDateString()}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            progress.status === '完了' 
                              ? 'bg-green-100 text-green-700'
                              : progress.status === '進行中'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}>
                            {progress.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">{t('noProgressData')}</p>
                    {workerId === 0 && (
                      <p className="text-xs mt-2">{t('selectWorkerForProgress')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        } catch (err) {
          console.error('Recent progress render error:', err);
          return null;
        }
      })()}

      {/* スクリーンショット一覧 - スクリーンショットがある場合のみ表示 */}
      {(() => {
        try {
          const hasScreenshots = screenshots && Array.isArray(screenshots) && screenshots.length > 0;
          // スクリーンショットがない場合はセクション全体を非表示
          if (!hasScreenshots && !screenshotsLoading) {
            return null;
          }
          return (
            <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
              <div className="p-6 bg-gradient-to-r from-rose-600 to-pink-600 text-white">
                <h3 className="text-xl font-bold">{t('screenshots') || 'スクリーンショット'}</h3>
              </div>
              <div className="p-6">
                {screenshotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                  </div>
                ) : hasScreenshots ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {screenshots.slice(0, 6).map((screenshot) => (
                      <div
                        key={screenshot.id}
                        className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border-2 border-rose-200 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedScreenshot(screenshot)}
                      >
                        <div className="aspect-video bg-gray-100 rounded-lg mb-2 overflow-hidden">
                          <img
                            src={getScreenshotUrl(screenshot.file_path)}
                            alt={screenshot.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lm77niYfliqDovb3lpLHotKU8L3RleHQ+PC9zdmc+';
                            }}
                          />
                        </div>
                        <div className="text-sm font-medium truncate">{screenshot.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(screenshot.created_at).toLocaleString('ja-JP')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        } catch (err) {
          console.error('Screenshots render error:', err);
          return null;
        }
      })()}

      {/* スクリーンショットモーダル */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div className="max-w-4xl max-h-full relative">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={getScreenshotUrl(selectedScreenshot.file_path)}
              alt={selectedScreenshot.title}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 text-white text-center">
              <div className="font-semibold">{selectedScreenshot.title}</div>
              <div className="text-sm text-gray-300 mt-1">
                {new Date(selectedScreenshot.created_at).toLocaleString('ja-JP')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* データがない場合のメッセージ（サマリー情報は常に表示されるため、このメッセージは表示されない） */}
      {(() => {
        try {
          let hasKpiData = false;
          let hasJapaneseData = false;
          let hasRecentMilestones = false;
          let hasRecentProgress = false;
          if (safeKpiTimelineFinal && Array.isArray(safeKpiTimelineFinal)) {
            hasKpiData = safeKpiTimelineFinal.length > 0;
          }
          if (safeJapaneseProficiencyFinal && Array.isArray(safeJapaneseProficiencyFinal)) {
            hasJapaneseData = safeJapaneseProficiencyFinal.length > 0;
          }
          if (safeDashboardData?.recent_milestones && Array.isArray(safeDashboardData.recent_milestones)) {
            hasRecentMilestones = safeDashboardData.recent_milestones.length > 0;
          }
          if (safeDashboardData?.recent_progress && Array.isArray(safeDashboardData.recent_progress)) {
            hasRecentProgress = safeDashboardData.recent_progress.length > 0;
          }
          // サマリー情報は常に表示されるため、他のデータがない場合のみメッセージを表示
          if (!hasKpiData && !hasJapaneseData && !hasRecentMilestones && !hasRecentProgress) {
            return (
        <div className="glass rounded-2xl p-6 text-center">
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded">
            <p className="text-sm">{t('selectWorkerForDetailedData')}</p>
          </div>
        </div>
            );
          }
          return null;
        } catch (err) {
          console.error('No data check error:', err);
          return null;
        }
      })()}
      </div>
    );
  } catch (err) {
    // エラーが発生した場合は代替UIを表示
    console.error('IntegratedDashboard render error:', err);
    return (
      <div className="glass rounded-2xl p-6">
        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
          <p className="font-semibold">{t('dashboardError')}</p>
          <p className="text-sm mt-2">{t('switchedToSimpleMode')}</p>
        </div>
      </div>
    );
  }
}

// エラーバウンダリーコンポーネント
class IntegratedDashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('IntegratedDashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass rounded-2xl p-6">
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
            <p className="font-semibold">ダッシュボードの表示中にエラーが発生しました</p>
            <p className="text-sm mt-2">データを安全に表示するため、簡易表示モードに切り替えました。</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// エラーバウンダリーでラップしたコンポーネントをエクスポート
function IntegratedDashboardWithErrorBoundary(props: IntegratedDashboardProps) {
  return (
    <IntegratedDashboardErrorBoundary>
      <IntegratedDashboard {...props} />
    </IntegratedDashboardErrorBoundary>
  );
}

// デフォルトエクスポート（エラーバウンダリー付き）
export default IntegratedDashboardWithErrorBoundary;

// 名前付きエクスポート（エラーバウンダリーなし、テスト用）
export { IntegratedDashboard };

