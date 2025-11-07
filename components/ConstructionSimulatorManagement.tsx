'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { constructionSimulatorTrainingApi, type ConstructionSimulatorTraining } from '@/lib/api';
import UnitySimulator from '@/components/UnitySimulator';

interface ConstructionSimulatorManagementProps {
  workerId: number;
}

export default function ConstructionSimulatorManagement({ workerId }: ConstructionSimulatorManagementProps) {
  const { t } = useTranslation();
  const [trainings, setTrainings] = useState<ConstructionSimulatorTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<ConstructionSimulatorTraining | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<ConstructionSimulatorTraining | null>(null); // 選択された訓練記録

  useEffect(() => {
    loadTrainings();
  }, [workerId]);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError(null);
      // データベースから実際のデータを取得
      const data = await constructionSimulatorTrainingApi.getAll(workerId);
      setTrainings(data);
      
      // 選択された訓練記録がある場合、最新の情報で更新
      if (selectedTraining?.id) {
        const updatedTraining = data.find(t => t.id === selectedTraining.id);
        if (updatedTraining) {
          setSelectedTraining(updatedTraining);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load simulator trainings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTraining = () => {
    setEditingTraining({
      worker_id: workerId,
      machine_type: 'バックホー',
      training_start_date: new Date().toISOString().split('T')[0],
      status: '受講中',
      completion_rate: 0,
    });
    setShowForm(true);
  };

  const handleSaveTraining = async (training: ConstructionSimulatorTraining) => {
    try {
      // データベースに実際のデータを保存
      if (training.id) {
        await constructionSimulatorTrainingApi.update(workerId, training.id, training);
      } else {
        await constructionSimulatorTrainingApi.create(workerId, training);
      }
      
      // データベースから最新のデータを再取得
      await loadTrainings();
      setShowForm(false);
      setEditingTraining(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save training');
    }
  };

  const handleDeleteTraining = async (id: number) => {
    if (!confirm('この訓練記録を削除しますか？')) return;
    try {
      // データベースから実際のデータを削除
      await constructionSimulatorTrainingApi.delete(workerId, id);
      
      // データベースから最新のデータを再取得
      await loadTrainings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete training');
    }
  };

  const machineTypes = ['バックホー', 'ブルドーザー', 'クレーン', 'フォークリフト', 'ローダー', 'その他'];

  if (loading) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
        <div className="p-6 bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">建設機械シミュレーター訓練管理</h2>
            </div>
            <button
              onClick={handleAddTraining}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              + 訓練を追加
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass rounded-xl p-4 bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* フォーム */}
      {showForm && editingTraining && (
        <div className="glass rounded-2xl p-6 shadow-xl card-hover animate-slide-up">
          <h3 className="text-xl font-bold mb-4">{editingTraining.id ? '訓練を編集' : '新しい訓練を追加'}</h3>
          <TrainingForm
            training={editingTraining}
            onSave={handleSaveTraining}
            onCancel={() => {
              setShowForm(false);
              setEditingTraining(null);
            }}
            machineTypes={machineTypes}
          />
        </div>
      )}

      {/* Unityシミュレーター */}
      <div className="glass rounded-2xl p-6 shadow-xl card-hover">
        {selectedTraining ? (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-blue-900">選択された訓練記録</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-blue-600 font-semibold">機械タイプ:</span>
                <span className="ml-2 text-gray-700">{selectedTraining.machine_type}</span>
              </div>
              {selectedTraining.simulator_model && (
                <div>
                  <span className="text-blue-600 font-semibold">モデル:</span>
                  <span className="ml-2 text-gray-700">{selectedTraining.simulator_model}</span>
                </div>
              )}
              {selectedTraining.status && (
                <div>
                  <span className="text-blue-600 font-semibold">ステータス:</span>
                  <span className="ml-2 text-gray-700">{selectedTraining.status}</span>
                </div>
              )}
              {selectedTraining.total_training_hours !== undefined && (
                <div>
                  <span className="text-blue-600 font-semibold">訓練時間:</span>
                  <span className="ml-2 text-gray-700">{selectedTraining.total_training_hours.toFixed(1)}時間</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedTraining(null)}
              className="mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              選択を解除
            </button>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-yellow-800">
                訓練記録を選択すると、その訓練記録に関連付けてシミュレーターを実行できます。
              </p>
            </div>
          </div>
        )}
        <UnitySimulator
          workerId={workerId}
          trainingMenuId={selectedTraining?.id}
          onSessionComplete={async (sessionId, sessionData) => {
            console.log('Training session completed:', sessionId, sessionData);
            
            // 選択された訓練記録がある場合、スコアを更新
            if (selectedTraining?.id && sessionData.kpi_scores) {
              try {
                const updatedTraining: Partial<ConstructionSimulatorTraining> = {
                  safety_score: sessionData.kpi_scores.safety_score,
                  efficiency_score: sessionData.kpi_scores.efficiency_score,
                  accuracy_score: sessionData.kpi_scores.accuracy_score,
                  evaluation_score: sessionData.kpi_scores.overall_score,
                  // 訓練時間を更新
                  total_training_hours: (selectedTraining.total_training_hours || 0) + (sessionData.duration_seconds / 3600),
                };
                
                await constructionSimulatorTrainingApi.update(workerId, selectedTraining.id, updatedTraining);
                console.log('Training record updated with session scores');
              } catch (err) {
                console.error('Failed to update training record:', err);
              }
            }
            
            // 訓練記録を再読み込み
            await loadTrainings();
          }}
        />
      </div>

      {/* 訓練一覧 */}
      {trainings.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center card-hover">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">訓練記録がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trainings.map((training) => (
            <div key={training.id} className="glass rounded-2xl p-6 shadow-xl card-hover">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{training.machine_type}</h3>
                  {training.simulator_model && (
                    <p className="text-sm text-gray-600 mb-2">モデル: {training.simulator_model}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>開始日: {training.training_start_date}</span>
                    {training.training_end_date && (
                      <span>終了日: {training.training_end_date}</span>
                    )}
                    {training.total_training_hours && (
                      <span>総訓練時間: {training.total_training_hours}時間</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTraining(training)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                      selectedTraining?.id === training.id
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {selectedTraining?.id === training.id ? '選択中' : '選択'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingTraining(training);
                      setShowForm(true);
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => training.id && handleDeleteTraining(training.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>

              {/* スコア表示 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                {training.completion_rate !== undefined && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-600 mb-1">修了率</div>
                    <div className="text-2xl font-bold text-blue-700">{training.completion_rate.toFixed(1)}%</div>
                  </div>
                )}
                {training.evaluation_score !== undefined && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-purple-600 mb-1">総合評価</div>
                    <div className="text-2xl font-bold text-purple-700">{training.evaluation_score.toFixed(1)}</div>
                  </div>
                )}
                {training.safety_score !== undefined && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-xs text-green-600 mb-1">安全運転</div>
                    <div className="text-2xl font-bold text-green-700">{training.safety_score.toFixed(1)}</div>
                  </div>
                )}
                {training.efficiency_score !== undefined && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="text-xs text-yellow-600 mb-1">効率性</div>
                    <div className="text-2xl font-bold text-yellow-700">{training.efficiency_score.toFixed(1)}</div>
                  </div>
                )}
                {training.accuracy_score !== undefined && (
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <div className="text-xs text-indigo-600 mb-1">正確性</div>
                    <div className="text-2xl font-bold text-indigo-700">{training.accuracy_score.toFixed(1)}</div>
                  </div>
                )}
              </div>

              {training.status && (
                <div className="mt-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    training.status === '修了' ? 'bg-green-100 text-green-700' :
                    training.status === '受講中' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {training.status}
                  </span>
                </div>
              )}

              {training.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{training.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TrainingFormProps {
  training: ConstructionSimulatorTraining;
  onSave: (training: ConstructionSimulatorTraining) => void;
  onCancel: () => void;
  machineTypes: string[];
}

function TrainingForm({ training, onSave, onCancel, machineTypes }: TrainingFormProps) {
  const [formData, setFormData] = useState<ConstructionSimulatorTraining>(training);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">機械タイプ</label>
          <select
            value={formData.machine_type}
            onChange={(e) => setFormData({ ...formData, machine_type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {machineTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">シミュレーターモデル</label>
          <input
            type="text"
            value={formData.simulator_model || ''}
            onChange={(e) => setFormData({ ...formData, simulator_model: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">訓練開始日</label>
          <input
            type="date"
            value={formData.training_start_date}
            onChange={(e) => setFormData({ ...formData, training_start_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">訓練終了日</label>
          <input
            type="date"
            value={formData.training_end_date || ''}
            onChange={(e) => setFormData({ ...formData, training_end_date: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">総訓練時間（時間）</label>
          <input
            type="number"
            step="0.1"
            value={formData.total_training_hours || 0}
            onChange={(e) => setFormData({ ...formData, total_training_hours: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ステータス</label>
          <select
            value={formData.status || '受講中'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="未開始">未開始</option>
            <option value="受講中">受講中</option>
            <option value="修了">修了</option>
            <option value="中断">中断</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">修了率（%）</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.completion_rate || 0}
            onChange={(e) => setFormData({ ...formData, completion_rate: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">総合評価スコア</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.evaluation_score || ''}
            onChange={(e) => setFormData({ ...formData, evaluation_score: parseFloat(e.target.value) || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">安全運転スコア</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.safety_score || ''}
            onChange={(e) => setFormData({ ...formData, safety_score: parseFloat(e.target.value) || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">効率性スコア</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.efficiency_score || ''}
            onChange={(e) => setFormData({ ...formData, efficiency_score: parseFloat(e.target.value) || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">正確性スコア</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.accuracy_score || ''}
            onChange={(e) => setFormData({ ...formData, accuracy_score: parseFloat(e.target.value) || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">訓練場所</label>
          <input
            type="text"
            value={formData.training_location || ''}
            onChange={(e) => setFormData({ ...formData, training_location: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">指導者</label>
          <input
            type="text"
            value={formData.instructor || ''}
            onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">備考</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all duration-300"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}

