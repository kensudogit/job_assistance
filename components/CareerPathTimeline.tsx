'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { careerPathApi, type CareerPath } from '@/lib/api';

interface CareerPathTimelineProps {
  workerId: number;
}

export default function CareerPathTimeline({ workerId }: CareerPathTimelineProps) {
  const { t } = useTranslation();
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPath, setEditingPath] = useState<CareerPath | null>(null);

  useEffect(() => {
    loadCareerPaths();
  }, [workerId]);

  const loadCareerPaths = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await careerPathApi.getAll(workerId);
      setPaths(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load career paths');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPath = () => {
    setEditingPath({
      worker_id: workerId,
      path_stage: '育成就労',
      stage_start_date: new Date().toISOString().split('T')[0],
      status: '予定',
    });
    setShowForm(true);
  };

  const handleSavePath = async (path: CareerPath) => {
    try {
      await careerPathApi.create(path);
      setShowForm(false);
      setEditingPath(null);
      loadCareerPaths();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save career path');
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
      <div className="p-6 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('careerPathTimeline')}</h2>
          </div>
          <button
            onClick={handleAddPath}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 hover:scale-105 active:scale-95 font-semibold"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('add')}
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {showForm && editingPath && (
        <div className="p-6 border-b bg-gray-50">
          <CareerPathForm
            path={editingPath}
            onSave={handleSavePath}
            onCancel={() => {
              setShowForm(false);
              setEditingPath(null);
            }}
          />
        </div>
      )}

      <div className="p-6">
        {paths.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No career path data found</p>
          </div>
        ) : (
          <div className="relative">
            {/* タイムライン */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-300 to-cyan-300" />
            
            {/* キャリアパスステップ */}
            <div className="space-y-8">
              {paths.map((path, index) => (
                <div key={path.id} className="relative flex items-start gap-4">
                  {/* ステップマーカー */}
                  <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                    path.status === '完了' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    path.status === '進行中' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                    'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* ステップコンテンツ */}
                  <div className="flex-1 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{path.path_stage}</h3>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            path.status === '完了' ? 'bg-green-100 text-green-700' :
                            path.status === '進行中' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {path.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">{t('startDate')}:</span>
                        <div className="font-semibold text-gray-900">
                          {new Date(path.stage_start_date).toLocaleDateString()}
                        </div>
                      </div>
                      {path.stage_end_date && (
                        <div>
                          <span className="text-gray-600">{t('endDate')}:</span>
                          <div className="font-semibold text-gray-900">
                            {new Date(path.stage_end_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      {path.target_japanese_level && (
                        <div>
                          <span className="text-gray-600">{t('targetJapaneseLevel')}:</span>
                          <div className="font-semibold text-blue-700">{path.target_japanese_level}</div>
                        </div>
                      )}
                      {path.achieved_japanese_level && (
                        <div>
                          <span className="text-gray-600">{t('achievedJapaneseLevel')}:</span>
                          <div className="font-semibold text-green-700">{path.achieved_japanese_level}</div>
                        </div>
                      )}
                    </div>
                    
                    {path.target_skill_level && (
                      <div className="mb-2">
                        <span className="text-gray-600">{t('targetSkillLevel')}:</span>
                        <span className="ml-2 font-semibold">{path.target_skill_level}</span>
                      </div>
                    )}
                    
                    {path.achieved_skill_level && (
                      <div className="mb-2">
                        <span className="text-gray-600">{t('achievedSkillLevel')}:</span>
                        <span className="ml-2 font-semibold text-green-700">{path.achieved_skill_level}</span>
                      </div>
                    )}
                    
                    {path.transition_date && (
                      <div className="mb-2">
                        <span className="text-gray-600">{t('transitionDate')}:</span>
                        <span className="ml-2 font-semibold text-purple-700">
                          {new Date(path.transition_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {path.notes && (
                      <div className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
                        {path.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CareerPathFormProps {
  path: CareerPath;
  onSave: (path: CareerPath) => void;
  onCancel: () => void;
}

function CareerPathForm({ path, onSave, onCancel }: CareerPathFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CareerPath>(path);

  const handleChange = (field: keyof CareerPath, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('pathStage')} *
          </label>
          <select
            required
            value={formData.path_stage}
            onChange={(e) => handleChange('path_stage', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          >
            <option value="育成就労">育成就労</option>
            <option value="特定技能1号">特定技能1号</option>
            <option value="特定技能2号">特定技能2号</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('status')}
          </label>
          <select
            value={formData.status || '予定'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          >
            <option value="予定">{t('pending')}</option>
            <option value="進行中">{t('inProgress')}</option>
            <option value="完了">{t('completed')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('startDate')} *
          </label>
          <input
            type="date"
            required
            value={formData.stage_start_date}
            onChange={(e) => handleChange('stage_start_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('endDate')}
          </label>
          <input
            type="date"
            value={formData.stage_end_date || ''}
            onChange={(e) => handleChange('stage_end_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('targetJapaneseLevel')}
          </label>
          <select
            value={formData.target_japanese_level || ''}
            onChange={(e) => handleChange('target_japanese_level', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          >
            <option value="">Select...</option>
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('achievedJapaneseLevel')}
          </label>
          <select
            value={formData.achieved_japanese_level || ''}
            onChange={(e) => handleChange('achieved_japanese_level', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          >
            <option value="">Select...</option>
            <option value="N5">N5</option>
            <option value="N4">N4</option>
            <option value="N3">N3</option>
            <option value="N2">N2</option>
            <option value="N1">N1</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('targetSkillLevel')}
          </label>
          <input
            type="text"
            value={formData.target_skill_level || ''}
            onChange={(e) => handleChange('target_skill_level', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('achievedSkillLevel')}
          </label>
          <input
            type="text"
            value={formData.achieved_skill_level || ''}
            onChange={(e) => handleChange('achieved_skill_level', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('transitionDate')}
          </label>
          <input
            type="date"
            value={formData.transition_date || ''}
            onChange={(e) => handleChange('transition_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('notes')}
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}



