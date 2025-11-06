'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { careerGoalApi, type CareerGoal } from '@/lib/api';

interface CareerGoalManagementProps {
  workerId: number;
}

export default function CareerGoalManagement({ workerId }: CareerGoalManagementProps) {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CareerGoal | null>(null);

  useEffect(() => {
    loadGoals();
  }, [workerId]);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await careerGoalApi.getAll(workerId);
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = () => {
    setEditingGoal({
      worker_id: workerId,
      goal_name: '',
      goal_category: '日本語',
      status: '進行中',
      current_progress: 0,
    });
    setShowForm(true);
  };

  const handleSaveGoal = async (goal: CareerGoal) => {
    try {
      await careerGoalApi.create(workerId, goal);
      await loadGoals();
      setShowForm(false);
      setEditingGoal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal');
    }
  };

  const goalCategories = ['日本語', '技能', '資格', 'キャリア'];

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
        <div className="p-6 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">キャリア目標設定</h2>
            </div>
            <button
              onClick={handleAddGoal}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              + 目標を追加
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
      {showForm && editingGoal && (
        <div className="glass rounded-2xl p-6 shadow-xl card-hover animate-slide-up">
          <h3 className="text-xl font-bold mb-4">目標を追加</h3>
          <GoalForm
            goal={editingGoal}
            onSave={handleSaveGoal}
            onCancel={() => {
              setShowForm(false);
              setEditingGoal(null);
            }}
            goalCategories={goalCategories}
          />
        </div>
      )}

      {/* 目標一覧 */}
      {goals.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center card-hover">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">目標が設定されていません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="glass rounded-2xl p-6 shadow-xl card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{goal.goal_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      goal.goal_category === '日本語' ? 'bg-purple-100 text-purple-700' :
                      goal.goal_category === '技能' ? 'bg-green-100 text-green-700' :
                      goal.goal_category === '資格' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {goal.goal_category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      goal.status === '達成' ? 'bg-green-100 text-green-700' :
                      goal.status === '進行中' ? 'bg-blue-100 text-blue-700' :
                      goal.status === '保留' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {goal.status}
                    </span>
                  </div>

                  {goal.description && (
                    <p className="text-gray-700 mb-4">{goal.description}</p>
                  )}

                  {/* 進捗表示 */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">進捗</span>
                      <span className="text-sm font-bold text-gray-900">{goal.current_progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          goal.current_progress && goal.current_progress >= 80 ? 'bg-gradient-to-r from-green-500 to-teal-500' :
                          goal.current_progress && goal.current_progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-blue-500 to-indigo-500'
                        }`}
                        style={{ width: `${goal.current_progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {goal.target_date && (
                      <div>
                        <span className="text-gray-600">目標日:</span>
                        <span className="ml-2 font-semibold text-gray-900">{goal.target_date}</span>
                      </div>
                    )}
                    {goal.achieved_date && (
                      <div>
                        <span className="text-gray-600">達成日:</span>
                        <span className="ml-2 font-semibold text-gray-900">{goal.achieved_date}</span>
                      </div>
                    )}
                  </div>

                  {goal.success_criteria && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm font-semibold text-blue-700 mb-2">成功基準</div>
                      <p className="text-sm text-gray-700">{goal.success_criteria}</p>
                    </div>
                  )}

                  {goal.support_resources && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-semibold text-green-700 mb-2">支援リソース</div>
                      <p className="text-sm text-gray-700">{goal.support_resources}</p>
                    </div>
                  )}

                  {goal.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{goal.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface GoalFormProps {
  goal: CareerGoal;
  onSave: (goal: CareerGoal) => void;
  onCancel: () => void;
  goalCategories: string[];
}

function GoalForm({ goal, onSave, onCancel, goalCategories }: GoalFormProps) {
  const [formData, setFormData] = useState<CareerGoal>(goal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">目標名</label>
          <input
            type="text"
            value={formData.goal_name}
            onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">カテゴリ</label>
          <select
            value={formData.goal_category}
            onChange={(e) => setFormData({ ...formData, goal_category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {goalCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">目標日</label>
          <input
            type="date"
            value={formData.target_date || ''}
            onChange={(e) => setFormData({ ...formData, target_date: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">現在の進捗（%）</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.current_progress || 0}
            onChange={(e) => setFormData({ ...formData, current_progress: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ステータス</label>
          <select
            value={formData.status || '進行中'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="進行中">進行中</option>
            <option value="達成">達成</option>
            <option value="保留">保留</option>
            <option value="未達成">未達成</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">達成日</label>
          <input
            type="date"
            value={formData.achieved_date || ''}
            onChange={(e) => setFormData({ ...formData, achieved_date: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">目標説明</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">成功基準</label>
          <textarea
            value={formData.success_criteria || ''}
            onChange={(e) => setFormData({ ...formData, success_criteria: e.target.value || undefined })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="この目標を達成するための具体的な基準を記入してください"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">支援リソース</label>
          <textarea
            value={formData.support_resources || ''}
            onChange={(e) => setFormData({ ...formData, support_resources: e.target.value || undefined })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="目標達成のための支援リソースを記入してください"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">備考</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value || undefined })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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

