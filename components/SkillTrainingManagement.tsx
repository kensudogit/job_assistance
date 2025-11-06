'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { skillTrainingApi, type SkillTraining } from '@/lib/api';

interface SkillTrainingManagementProps {
  workerId: number;
}

export default function SkillTrainingManagement({ workerId }: SkillTrainingManagementProps) {
  const { t } = useTranslation();
  const [trainings, setTrainings] = useState<SkillTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<SkillTraining | null>(null);

  useEffect(() => {
    loadTrainings();
  }, [workerId]);

  const loadTrainings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await skillTrainingApi.getAll(workerId);
      setTrainings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trainings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTraining = () => {
    setEditingTraining({
      worker_id: workerId,
      skill_category: 'construction',
      skill_name: '',
      training_start_date: new Date().toISOString().split('T')[0],
      status: '受講中',
      training_hours: 0,
    });
    setShowForm(true);
  };

  const handleSaveTraining = async (training: SkillTraining) => {
    try {
      if (training.id) {
        await skillTrainingApi.update(workerId, training.id, training);
      } else {
        await skillTrainingApi.create(training);
      }
      setShowForm(false);
      setEditingTraining(null);
      loadTrainings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save training');
    }
  };

  const handleEditTraining = (training: SkillTraining) => {
    setEditingTraining(training);
    setShowForm(true);
  };

  const handleDeleteTraining = async (trainingId: number) => {
    if (!confirm('Delete this training record?')) return;
    
    try {
      await skillTrainingApi.delete(workerId, trainingId);
      loadTrainings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete training');
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
      <div className="p-6 bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('skillTraining')}</h2>
          </div>
          <button
            onClick={handleAddTraining}
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

      {showForm && editingTraining && (
        <div className="p-6 border-b bg-gray-50">
          <TrainingForm
            training={editingTraining}
            onSave={handleSaveTraining}
            onCancel={() => {
              setShowForm(false);
              setEditingTraining(null);
            }}
          />
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {trainings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No training records found</p>
          </div>
        ) : (
          trainings.map((training, index) => (
            <div key={training.id} className="p-5 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{training.skill_name}</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {training.skill_category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      training.status === '修了' ? 'bg-blue-100 text-blue-700' :
                      training.status === '受講中' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {training.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                    <div>
                      <span className="font-semibold">{t('trainingStartDate')}:</span>
                      <span className="ml-2">{new Date(training.training_start_date).toLocaleDateString()}</span>
                    </div>
                    {training.training_end_date && (
                      <div>
                        <span className="font-semibold">{t('trainingEndDate')}:</span>
                        <span className="ml-2">{new Date(training.training_end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {training.training_hours && (
                      <div>
                        <span className="font-semibold">{t('trainingHours')}:</span>
                        <span className="ml-2">{training.training_hours}時間</span>
                      </div>
                    )}
                  </div>
                  {training.completion_rate !== null && training.completion_rate !== undefined && (
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-700">{t('completionRate')}</span>
                        <span className="text-sm font-bold text-gray-900">{training.completion_rate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${training.completion_rate}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {training.evaluation_score !== null && training.evaluation_score !== undefined && (
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">{t('evaluationScore')}:</span>
                      <span className="ml-2 font-bold text-gray-900">{training.evaluation_score}点</span>
                    </div>
                  )}
                  {training.instructor && (
                    <div className="text-xs text-gray-500 mt-2">
                      {t('instructor')}: {training.instructor}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditTraining(training)}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-all"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => training.id && handleDeleteTraining(training.id)}
                    className="px-3 py-1 text-sm bg-red-200 text-red-700 rounded hover:bg-red-300 transition-all"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface TrainingFormProps {
  training: SkillTraining;
  onSave: (training: SkillTraining) => void;
  onCancel: () => void;
}

function TrainingForm({ training, onSave, onCancel }: TrainingFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<SkillTraining>(training);

  const handleChange = (field: keyof SkillTraining, value: any) => {
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
            {t('skillCategory')} *
          </label>
          <select
            required
            value={formData.skill_category}
            onChange={(e) => handleChange('skill_category', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          >
            <option value="construction">{t('construction')}</option>
            <option value="manufacturing">{t('manufacturing')}</option>
            <option value="care">{t('care')}</option>
            <option value="agriculture">{t('agriculture')}</option>
            <option value="foodService">{t('foodService')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('skillName')} *
          </label>
          <input
            type="text"
            required
            value={formData.skill_name}
            onChange={(e) => handleChange('skill_name', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('trainingStartDate')} *
          </label>
          <input
            type="date"
            required
            value={formData.training_start_date}
            onChange={(e) => handleChange('training_start_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('trainingEndDate')}
          </label>
          <input
            type="date"
            value={formData.training_end_date || ''}
            onChange={(e) => handleChange('training_end_date', e.target.value || undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('trainingHours')}
          </label>
          <input
            type="number"
            value={formData.training_hours || ''}
            onChange={(e) => handleChange('training_hours', e.target.value ? parseInt(e.target.value) : 0)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('trainingMethod')}
          </label>
          <select
            value={formData.training_method || ''}
            onChange={(e) => handleChange('training_method', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          >
            <option value="">Select...</option>
            <option value="practicalTraining">{t('practicalTraining')}</option>
            <option value="classroomTraining">{t('classroomTraining')}</option>
            <option value="online">{t('online')}</option>
            <option value="ojt">{t('ojt')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('status')}
          </label>
          <select
            value={formData.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          >
            <option value="未開始">未開始</option>
            <option value="受講中">受講中</option>
            <option value="修了">修了</option>
            <option value="中断">中断</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('completionRate')} (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.completion_rate || ''}
            onChange={(e) => handleChange('completion_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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

