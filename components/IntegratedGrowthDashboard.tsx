'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { integratedGrowthApi, type IntegratedGrowth } from '@/lib/api';
import { japaneseProficiencyApi, type JapaneseProficiency } from '@/lib/api';
import { skillTrainingApi, type SkillTraining } from '@/lib/api';
import { constructionSimulatorTrainingApi, type ConstructionSimulatorTraining } from '@/lib/api';

interface IntegratedGrowthDashboardProps {
  workerId: number;
}

export default function IntegratedGrowthDashboard({ workerId }: IntegratedGrowthDashboardProps) {
  const { t } = useTranslation();
  const [growths, setGrowths] = useState<IntegratedGrowth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [japaneseData, setJapaneseData] = useState<JapaneseProficiency[]>([]);
  const [skillData, setSkillData] = useState<SkillTraining[]>([]);
  const [simulatorData, setSimulatorData] = useState<ConstructionSimulatorTraining[]>([]);

  useEffect(() => {
    loadAllData();
  }, [workerId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [growthsData, japaneseDataRes, skillDataRes, simulatorDataRes] = await Promise.all([
        integratedGrowthApi.getAll(workerId),
        japaneseProficiencyApi.getAll(workerId).catch(() => []),
        skillTrainingApi.getAll(workerId).catch(() => []),
        constructionSimulatorTrainingApi.getAll(workerId).catch(() => []),
      ]);
      setGrowths(growthsData);
      setJapaneseData(japaneseDataRes);
      setSkillData(skillDataRes);
      setSimulatorData(simulatorDataRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallScore = () => {
    if (growths.length === 0) return null;
    const latest = growths[0];
    return latest.overall_growth_score || null;
  };

  const calculateJapaneseScore = () => {
    if (japaneseData.length === 0) return null;
    const latest = japaneseData[0];
    return latest.total_score || null;
  };

  const calculateSkillScore = () => {
    if (skillData.length === 0) return null;
    const avgScore = skillData
      .filter(t => t.evaluation_score !== undefined && t.evaluation_score !== null)
      .reduce((sum, t) => sum + (t.evaluation_score || 0), 0) / skillData.filter(t => t.evaluation_score !== undefined && t.evaluation_score !== null).length;
    return isNaN(avgScore) ? null : avgScore;
  };

  const calculateSimulatorScore = () => {
    if (simulatorData.length === 0) return null;
    const avgScore = simulatorData
      .filter(t => t.evaluation_score !== undefined && t.evaluation_score !== null)
      .reduce((sum, t) => sum + (t.evaluation_score || 0), 0) / simulatorData.filter(t => t.evaluation_score !== undefined && t.evaluation_score !== null).length;
    return isNaN(avgScore) ? null : avgScore;
  };

  const handleCreateAssessment = async () => {
    try {
      const japaneseScore = calculateJapaneseScore();
      const skillScore = calculateSkillScore();
      const simulatorScore = calculateSimulatorScore();
      const overallScore = japaneseScore && skillScore && simulatorScore
        ? (japaneseScore * 0.4 + skillScore * 0.3 + simulatorScore * 0.3)
        : null;

      const newGrowth: Omit<IntegratedGrowth, 'id' | 'worker_id'> = {
        assessment_date: new Date().toISOString().split('T')[0],
        japanese_level: japaneseData[0]?.level || undefined,
        japanese_score: japaneseScore || undefined,
        skill_level: skillData[0]?.skill_level || undefined,
        skill_score: skillScore || undefined,
        simulator_score: simulatorScore || undefined,
        overall_growth_score: overallScore || undefined,
        growth_trend: growths.length > 0 && overallScore && growths[0].overall_growth_score
          ? (overallScore > growths[0].overall_growth_score ? '向上' : overallScore < growths[0].overall_growth_score ? '低下' : '維持')
          : undefined,
        readiness_for_transition: overallScore && overallScore >= 70 ? '準備完了' : overallScore && overallScore >= 50 ? '準備中' : '未準備',
        target_achievement_rate: overallScore || undefined,
      };

      await integratedGrowthApi.create(workerId, newGrowth);
      await loadAllData();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assessment');
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

  const overallScore = calculateOverallScore();
  const japaneseScore = calculateJapaneseScore();
  const skillScore = calculateSkillScore();
  const simulatorScore = calculateSimulatorScore();

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">統合成長管理ダッシュボード</h2>
            </div>
            <button
              onClick={handleCreateAssessment}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              + 評価を作成
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass rounded-xl p-4 bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 統合スコア表示 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <div className="text-sm text-gray-600 mb-2">統合成長スコア</div>
          <div className="text-4xl font-bold text-indigo-600 mb-2">
            {overallScore !== null ? overallScore.toFixed(1) : 'N/A'}
          </div>
          {growths.length > 0 && growths[0].growth_trend && (
            <div className={`text-sm font-semibold ${
              growths[0].growth_trend === '向上' ? 'text-green-600' :
              growths[0].growth_trend === '低下' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {growths[0].growth_trend === '向上' ? '↑ 向上' :
               growths[0].growth_trend === '低下' ? '↓ 低下' :
               '→ 維持'}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <div className="text-sm text-gray-600 mb-2">日本語スコア</div>
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {japaneseScore !== null ? japaneseScore.toFixed(1) : 'N/A'}
          </div>
          {japaneseData.length > 0 && japaneseData[0].level && (
            <div className="text-sm font-semibold text-gray-600">
              {japaneseData[0].level}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <div className="text-sm text-gray-600 mb-2">技能スコア</div>
          <div className="text-4xl font-bold text-green-600 mb-2">
            {skillScore !== null ? skillScore.toFixed(1) : 'N/A'}
          </div>
          {skillData.length > 0 && skillData[0].skill_level && (
            <div className="text-sm font-semibold text-gray-600">
              {skillData[0].skill_level}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <div className="text-sm text-gray-600 mb-2">シミュレータースコア</div>
          <div className="text-4xl font-bold text-orange-600 mb-2">
            {simulatorScore !== null ? simulatorScore.toFixed(1) : 'N/A'}
          </div>
          {simulatorData.length > 0 && (
            <div className="text-sm font-semibold text-gray-600">
              {simulatorData.length}件の訓練
            </div>
          )}
        </div>
      </div>

      {/* 成長推移グラフ */}
      {growths.length > 0 && (
        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <h3 className="text-xl font-bold mb-4">成長推移</h3>
          <div className="space-y-4">
            {growths.slice(0, 5).map((growth, index) => (
              <div key={growth.id} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(growth.assessment_date).toLocaleDateString()}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-700">統合成長スコア</span>
                    <span className="text-sm font-bold text-gray-900">
                      {growth.overall_growth_score !== undefined ? growth.overall_growth_score.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${growth.overall_growth_score || 0}%` }}
                    ></div>
                  </div>
                </div>
                {growth.growth_trend && (
                  <div className={`text-sm font-semibold w-20 text-right ${
                    growth.growth_trend === '向上' ? 'text-green-600' :
                    growth.growth_trend === '低下' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {growth.growth_trend}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 移行準備度 */}
      {growths.length > 0 && growths[0].readiness_for_transition && (
        <div className="glass rounded-2xl p-6 shadow-xl card-hover">
          <h3 className="text-xl font-bold mb-4">移行準備度</h3>
          <div className="flex items-center gap-4">
            <div className={`px-4 py-3 rounded-lg font-semibold text-lg ${
              growths[0].readiness_for_transition === '準備完了' ? 'bg-green-100 text-green-700' :
              growths[0].readiness_for_transition === '準備中' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {growths[0].readiness_for_transition}
            </div>
            {growths[0].next_milestone && (
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">次のマイルストーン</div>
                <div className="text-lg font-semibold text-gray-900">{growths[0].next_milestone}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 評価履歴 */}
      {growths.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center card-hover">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">評価記録がありません</p>
          <button
            onClick={handleCreateAssessment}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
          >
            最初の評価を作成
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <h3 className="text-xl font-bold">評価履歴</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {growths.map((growth) => (
              <div key={growth.id} className="p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-900">
                        {new Date(growth.assessment_date).toLocaleDateString()}
                      </span>
                      {growth.growth_trend && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          growth.growth_trend === '向上' ? 'bg-green-100 text-green-700' :
                          growth.growth_trend === '低下' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {growth.growth_trend}
                        </span>
                      )}
                      {growth.readiness_for_transition && (
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          growth.readiness_for_transition === '準備完了' ? 'bg-blue-100 text-blue-700' :
                          growth.readiness_for_transition === '準備中' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {growth.readiness_for_transition}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {growth.japanese_score !== undefined && (
                        <div>
                          <span className="text-gray-600">日本語:</span>
                          <span className="ml-2 font-bold text-gray-900">{growth.japanese_score.toFixed(1)}</span>
                        </div>
                      )}
                      {growth.skill_score !== undefined && (
                        <div>
                          <span className="text-gray-600">技能:</span>
                          <span className="ml-2 font-bold text-gray-900">{growth.skill_score.toFixed(1)}</span>
                        </div>
                      )}
                      {growth.simulator_score !== undefined && (
                        <div>
                          <span className="text-gray-600">シミュレーター:</span>
                          <span className="ml-2 font-bold text-gray-900">{growth.simulator_score.toFixed(1)}</span>
                        </div>
                      )}
                      {growth.overall_growth_score !== undefined && (
                        <div>
                          <span className="text-gray-600">統合:</span>
                          <span className="ml-2 font-bold text-indigo-600">{growth.overall_growth_score.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {growth.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{growth.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

