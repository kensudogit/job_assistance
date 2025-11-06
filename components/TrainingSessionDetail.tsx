'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trainingSessionApi, type TrainingSession } from '@/lib/api';
import ReplayViewer from '@/components/ReplayViewer';

interface TrainingSessionDetailProps {
  workerId: number;
}

export default function TrainingSessionDetail({ workerId }: TrainingSessionDetailProps) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<any>(null);

  useEffect(() => {
    loadSessions();
  }, [workerId]);

  useEffect(() => {
    if (selectedSession) {
      loadSessionDetail(selectedSession);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await trainingSessionApi.getAllByWorker(workerId);
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load training sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetail = async (sessionId: string) => {
    try {
      setError(null);
      const data = await trainingSessionApi.getById(sessionId);
      setSessionDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session detail');
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">{t('trainingSessions')}</h2>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* セッション一覧 */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sessionList')}</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('noSessionsFound')}</p>
              </div>
            ) : (
              sessions.map((session, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedSession(session.session_id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedSession === session.session_id
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-500 shadow-lg'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-semibold text-gray-700">
                      {new Date(session.session_start_time).toLocaleString()}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      session.status === '完了' ? 'bg-green-100 text-green-700' :
                      session.status === '中断' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  {session.kpi && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">{t('safetyScore')}:</span>
                        <span className="ml-1 font-semibold">{session.kpi.safety_score?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('errorCount')}:</span>
                        <span className="ml-1 font-semibold text-red-700">{session.kpi.error_count || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('overallScore')}:</span>
                        <span className="ml-1 font-semibold text-blue-700">{session.kpi.overall_score?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                  )}
                  {session.duration_seconds && (
                    <div className="text-xs text-gray-500 mt-2">
                      {t('duration')}: {Math.floor(session.duration_seconds / 60)}分 {session.duration_seconds % 60}秒
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* セッション詳細 */}
        <div>
          {selectedSession && sessionDetail ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('sessionDetail')}</h3>
              
              {/* KPI詳細 */}
              {sessionDetail.kpi && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-3">{t('kpiDetails')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">{t('safetyScore')}:</span>
                      <span className="ml-2 font-bold text-blue-700">
                        {sessionDetail.kpi.safety_score?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('errorCount')}:</span>
                      <span className="ml-2 font-bold text-red-700">
                        {sessionDetail.kpi.error_count || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('procedureCompliance')}:</span>
                      <span className="ml-2 font-bold text-green-700">
                        {sessionDetail.kpi.procedure_compliance_rate?.toFixed(1) || 'N/A'}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('achievementRate')}:</span>
                      <span className="ml-2 font-bold text-purple-700">
                        {sessionDetail.kpi.achievement_rate?.toFixed(1) || 'N/A'}%
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">{t('overallScore')}:</span>
                      <span className="ml-2 font-bold text-xl text-indigo-700">
                        {sessionDetail.kpi.overall_score?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* セッション情報 */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <h4 className="font-bold text-gray-900 mb-3">{t('sessionInfo')}</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">{t('sessionId')}:</span>
                    <span className="ml-2 font-mono text-xs">{sessionDetail.session_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('startTime')}:</span>
                    <span className="ml-2">{new Date(sessionDetail.session_start_time).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('endTime')}:</span>
                    <span className="ml-2">{new Date(sessionDetail.session_end_time).toLocaleString()}</span>
                  </div>
                  {sessionDetail.duration_seconds && (
                    <div>
                      <span className="text-gray-600">{t('duration')}:</span>
                      <span className="ml-2">
                        {Math.floor(sessionDetail.duration_seconds / 60)}分 {sessionDetail.duration_seconds % 60}秒
                      </span>
                    </div>
                  )}
                  {sessionDetail.operation_logs_count && (
                    <div>
                      <span className="text-gray-600">{t('operationLogsCount')}:</span>
                      <span className="ml-2">{sessionDetail.operation_logs_count}件</span>
                    </div>
                  )}
                </div>
              </div>

              {/* リプレイ機能 */}
              {selectedSession && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
                  <h4 className="font-bold text-gray-900 mb-3">{t('replayFunction')}</h4>
                  <ReplayViewer sessionId={selectedSession} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p>{t('selectSessionToViewDetail')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



