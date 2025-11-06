'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { specificSkillTransitionApi, type SpecificSkillTransition } from '@/lib/api';

interface SpecificSkillTransitionManagementProps {
  workerId: number;
}

export default function SpecificSkillTransitionManagement({ workerId }: SpecificSkillTransitionManagementProps) {
  const { t } = useTranslation();
  const [transitions, setTransitions] = useState<SpecificSkillTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransition, setEditingTransition] = useState<SpecificSkillTransition | null>(null);

  useEffect(() => {
    loadTransitions();
  }, [workerId]);

  const loadTransitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await specificSkillTransitionApi.getAll(workerId);
      setTransitions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transitions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransition = () => {
    setEditingTransition({
      worker_id: workerId,
      transition_type: '育成就労→特定技能1号',
      status: '計画中',
    });
    setShowForm(true);
  };

  const handleSaveTransition = async (transition: SpecificSkillTransition) => {
    try {
      await specificSkillTransitionApi.create(workerId, transition);
      await loadTransitions();
      setShowForm(false);
      setEditingTransition(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transition');
    }
  };

  const transitionTypes = ['育成就労→特定技能1号', '特定技能1号→2号'];

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
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">特定技能移行支援</h2>
            </div>
            <button
              onClick={handleAddTransition}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
            >
              + 移行計画を追加
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
      {showForm && editingTransition && (
        <div className="glass rounded-2xl p-6 shadow-xl card-hover animate-slide-up">
          <h3 className="text-xl font-bold mb-4">移行計画を追加</h3>
          <TransitionForm
            transition={editingTransition}
            onSave={handleSaveTransition}
            onCancel={() => {
              setShowForm(false);
              setEditingTransition(null);
            }}
            transitionTypes={transitionTypes}
          />
        </div>
      )}

      {/* 移行計画一覧 */}
      {transitions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center card-hover">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">移行計画がありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transitions.map((transition) => (
            <div key={transition.id} className="glass rounded-2xl p-6 shadow-xl card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{transition.transition_type}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {transition.target_transition_date && (
                      <div>
                        <span className="text-gray-600">目標移行日:</span>
                        <span className="ml-2 font-semibold text-gray-900">{transition.target_transition_date}</span>
                      </div>
                    )}
                    {transition.actual_transition_date && (
                      <div>
                        <span className="text-gray-600">実際の移行日:</span>
                        <span className="ml-2 font-semibold text-gray-900">{transition.actual_transition_date}</span>
                      </div>
                    )}
                    {transition.status && (
                      <div>
                        <span className="text-gray-600">ステータス:</span>
                        <span className={`ml-2 font-semibold px-2 py-1 rounded ${
                          transition.status === '完了' ? 'bg-green-100 text-green-700' :
                          transition.status === '申請中' ? 'bg-yellow-100 text-yellow-700' :
                          transition.status === '準備中' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {transition.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* レベル比較 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">必要日本語レベル</div>
                      <div className="text-sm font-semibold text-gray-900">{transition.required_japanese_level || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">現在日本語レベル</div>
                      <div className="text-sm font-semibold text-gray-900">{transition.current_japanese_level || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">必要技能レベル</div>
                      <div className="text-sm font-semibold text-gray-900">{transition.required_skill_level || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">現在技能レベル</div>
                      <div className="text-sm font-semibold text-gray-900">{transition.current_skill_level || 'N/A'}</div>
                    </div>
                  </div>

                  {transition.readiness_assessment && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm font-semibold text-blue-700 mb-2">準備度評価</div>
                      <p className="text-sm text-gray-700">{transition.readiness_assessment}</p>
                    </div>
                  )}

                  {transition.required_documents && (
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2">必要書類</div>
                      <div className="flex flex-wrap gap-2">
                        {transition.required_documents.split(',').map((doc, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            {doc.trim()}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2">
                        <span className={`text-sm font-semibold ${
                          transition.documents_submitted ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transition.documents_submitted ? '✓ 書類提出済み' : '✗ 書類未提出'}
                        </span>
                      </div>
                    </div>
                  )}

                  {transition.application_submitted && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-semibold text-green-700 mb-2">申請情報</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {transition.application_date && (
                          <div>
                            <span className="text-gray-600">申請日:</span>
                            <span className="ml-2 font-semibold text-gray-900">{transition.application_date}</span>
                          </div>
                        )}
                        {transition.approval_date && (
                          <div>
                            <span className="text-gray-600">承認日:</span>
                            <span className="ml-2 font-semibold text-gray-900">{transition.approval_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {transition.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{transition.notes}</p>
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

interface TransitionFormProps {
  transition: SpecificSkillTransition;
  onSave: (transition: SpecificSkillTransition) => void;
  onCancel: () => void;
  transitionTypes: string[];
}

function TransitionForm({ transition, onSave, onCancel, transitionTypes }: TransitionFormProps) {
  const [formData, setFormData] = useState<SpecificSkillTransition>(transition);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">移行タイプ</label>
          <select
            value={formData.transition_type}
            onChange={(e) => setFormData({ ...formData, transition_type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {transitionTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">ステータス</label>
          <select
            value={formData.status || '計画中'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="計画中">計画中</option>
            <option value="準備中">準備中</option>
            <option value="申請中">申請中</option>
            <option value="完了">完了</option>
            <option value="保留">保留</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">目標移行日</label>
          <input
            type="date"
            value={formData.target_transition_date || ''}
            onChange={(e) => setFormData({ ...formData, target_transition_date: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">実際の移行日</label>
          <input
            type="date"
            value={formData.actual_transition_date || ''}
            onChange={(e) => setFormData({ ...formData, actual_transition_date: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">必要日本語レベル</label>
          <input
            type="text"
            value={formData.required_japanese_level || ''}
            onChange={(e) => setFormData({ ...formData, required_japanese_level: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="例: JLPT N3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">現在日本語レベル</label>
          <input
            type="text"
            value={formData.current_japanese_level || ''}
            onChange={(e) => setFormData({ ...formData, current_japanese_level: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="例: JLPT N4"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">必要技能レベル</label>
          <input
            type="text"
            value={formData.required_skill_level || ''}
            onChange={(e) => setFormData({ ...formData, required_skill_level: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">現在技能レベル</label>
          <input
            type="text"
            value={formData.current_skill_level || ''}
            onChange={(e) => setFormData({ ...formData, current_skill_level: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">必要書類（カンマ区切り）</label>
          <input
            type="text"
            value={formData.required_documents || ''}
            onChange={(e) => setFormData({ ...formData, required_documents: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="例: 在留カード, パスポート, 証明書"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">準備度評価</label>
          <textarea
            value={formData.readiness_assessment || ''}
            onChange={(e) => setFormData({ ...formData, readiness_assessment: e.target.value || undefined })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="準備度の評価を記入してください"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.documents_submitted || false}
              onChange={(e) => setFormData({ ...formData, documents_submitted: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-gray-700">書類提出済み</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.application_submitted || false}
              onChange={(e) => setFormData({ ...formData, application_submitted: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-gray-700">申請提出済み</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">申請日</label>
          <input
            type="date"
            value={formData.application_date || ''}
            onChange={(e) => setFormData({ ...formData, application_date: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">承認日</label>
          <input
            type="date"
            value={formData.approval_date || ''}
            onChange={(e) => setFormData({ ...formData, approval_date: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">担当スタッフ</label>
          <input
            type="text"
            value={formData.support_staff || ''}
            onChange={(e) => setFormData({ ...formData, support_staff: e.target.value || undefined })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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

