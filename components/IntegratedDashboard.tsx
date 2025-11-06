'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { integratedDashboardApi, IntegratedDashboardData } from '@/lib/api';

interface IntegratedDashboardProps {
  workerId: number;
}

export default function IntegratedDashboard({ workerId }: IntegratedDashboardProps) {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<IntegratedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [workerId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await integratedDashboardApi.get(workerId);
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    );
  }

  // レーダーチャート用のデータ（最新のKPIデータ）
  const latestKPI = dashboardData.kpi_timeline[0];
  const radarChartData = latestKPI ? [
    { name: t('safetyScore'), value: latestKPI.safety_score || 0, max: 100 },
    { name: t('procedureCompliance'), value: latestKPI.procedure_compliance_rate || 0, max: 100 },
    { name: t('achievementRate'), value: latestKPI.achievement_rate || 0, max: 100 },
    { name: t('overallScore'), value: latestKPI.overall_score || 0, max: 100 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* 統合ダッシュボードヘッダー */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('integratedDashboard')}</h2>
          </div>
        </div>
      </div>

      {/* レーダーチャート（技能KPI） */}
      {radarChartData.length > 0 && (
        <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <h3 className="text-xl font-bold mb-4">{t('skillKPIRadarChart')}</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {radarChartData.map((item, index) => (
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
      )}

      {/* 時系列グラフ（KPI推移） */}
      {dashboardData.kpi_timeline.length > 0 && (
        <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
          <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <h3 className="text-xl font-bold mb-4">{t('kpiTimeline')}</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.kpi_timeline.slice(0, 10).map((kpi, index) => (
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
      )}

      {/* ステップチャート（日本語能力推移） */}
      {dashboardData.japanese_proficiency.length > 0 && (
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
                {dashboardData.japanese_proficiency.map((proficiency, index) => (
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
      )}

      {/* データがない場合 */}
      {dashboardData.kpi_timeline.length === 0 && dashboardData.japanese_proficiency.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No dashboard data available</p>
        </div>
      )}
    </div>
  );
}

