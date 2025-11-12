'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminSummaryApi, type AdminSummary } from '@/lib/api';

export default function AdminSummary() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminSummaryApi.get();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="text-center text-gray-500">{t('loadingWithDots')}</div>
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

  if (!summary) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="text-center text-gray-500">{t('noDataAvailable')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('adminSummary')}</h2>
          </div>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <div className="text-sm text-gray-600 mb-2">{t('totalWorkers')}</div>
          <div className="text-3xl font-bold text-indigo-600">{summary.total_workers}</div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <div className="text-sm text-gray-600 mb-2">{t('workersWithLowKPI')}</div>
          <div className="text-3xl font-bold text-red-600">{summary.workers_with_low_kpi}</div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <div className="text-sm text-gray-600 mb-2">{t('workersWithHighErrors')}</div>
          <div className="text-3xl font-bold text-orange-600">{summary.workers_with_high_errors}</div>
        </div>

        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <div className="text-sm text-gray-600 mb-2">{t('totalAlerts')}</div>
          <div className="text-3xl font-bold text-yellow-600">
            {summary.alerts && Array.isArray(summary.alerts) ? summary.alerts.length : 0}
          </div>
        </div>
      </div>

      {/* アラート */}
      {summary.alerts && Array.isArray(summary.alerts) && summary.alerts.length > 0 && (
        <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
          <div className="p-6 bg-gradient-to-r from-red-600 to-pink-600 text-white">
            <h3 className="text-xl font-bold mb-4">{t('alerts')}</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {summary.alerts.map((alert, index) => (
              <div key={index} className="p-5 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        alert.priority === 'high' ? 'bg-red-100 text-red-700' :
                        alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {alert.priority === 'high' ? t('high') : alert.priority === 'medium' ? t('medium') : t('low')}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {alert.type}
                      </span>
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">{alert.worker_name}</div>
                    <div className="text-sm text-gray-600">{alert.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 全訓練生の進捗一覧 */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
          <h3 className="text-xl font-bold mb-4">{t('allWorkersProgress')}</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {(!summary.summary || !Array.isArray(summary.summary) || summary.summary.length === 0) ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">{t('noWorkersFound')}</p>
            </div>
          ) : (
            summary.summary.map((worker, index) => (
              <div key={worker.worker_id} className="p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{worker.worker_name}</h3>
                      {worker.current_status && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                          {worker.current_status}
                        </span>
                      )}
                      {worker.latest_kpi?.overall_score && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          worker.latest_kpi.overall_score >= 80 ? 'bg-green-100 text-green-700' :
                          worker.latest_kpi.overall_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          KPI: {worker.latest_kpi.overall_score.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                      {worker.japanese_level && (
                        <div>
                          <span className="text-gray-600">{t('japaneseLevel')}:</span>
                          <span className="ml-2 font-semibold">{worker.japanese_level}</span>
                        </div>
                      )}
                      {worker.latest_kpi?.safety_score && (
                        <div>
                          <span className="text-gray-600">{t('safetyScore')}:</span>
                          <span className="ml-2 font-semibold">{worker.latest_kpi.safety_score.toFixed(1)}</span>
                        </div>
                      )}
                      {worker.latest_kpi?.error_count !== undefined && (
                        <div>
                          <span className="text-gray-600">{t('errorCount')}:</span>
                          <span className="ml-2 font-semibold text-red-700">{worker.latest_kpi.error_count}</span>
                        </div>
                      )}
                      {worker.milestones.total > 0 && (
                        <div>
                          <span className="text-gray-600">{t('milestones')}:</span>
                          <span className="ml-2 font-semibold">
                            {worker.milestones.achieved}/{worker.milestones.total} ({worker.milestones.achievement_rate.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                    {worker.latest_proficiency && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">{t('latestProficiency')}:</span>
                        <span className="ml-2">
                          {worker.latest_proficiency.test_type} {worker.latest_proficiency.level || ''} 
                          {worker.latest_proficiency.passed ? ` (${t('passed')})` : ` (${t('failed')})`}
                        </span>
                      </div>
                    )}
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



