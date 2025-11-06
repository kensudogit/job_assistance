'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { milestoneApi, type Milestone } from '@/lib/api';

interface MilestoneManagementProps {
  workerId: number;
}

export default function MilestoneManagement({ workerId }: MilestoneManagementProps) {
  const { t } = useTranslation();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  useEffect(() => {
    loadMilestones();
  }, [workerId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await milestoneApi.getAll(workerId);
      setMilestones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = () => {
    setEditingMilestone({
      worker_id: workerId,
      milestone_name: '',
      milestone_type: '',
      status: '未達成',
    });
    setShowForm(true);
  };

  const handleSaveMilestone = async (milestone: Milestone) => {
    try {
      await milestoneApi.create(milestone);
      setShowForm(false);
      setEditingMilestone(null);
      loadMilestones();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save milestone');
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
      <div className="p-6 bg-gradient-to-r from-yellow-600 to-amber-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('milestoneManagement')}</h2>
          </div>
          <button
            onClick={handleAddMilestone}
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

      {showForm && editingMilestone && (
        <div className="p-6 border-b bg-gray-50">
          <MilestoneForm
            milestone={editingMilestone}
            onSave={handleSaveMilestone}
            onCancel={() => {
              setShowForm(false);
              setEditingMilestone(null);
            }}
          />
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {milestones.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No milestones found</p>
          </div>
        ) : (
          milestones.map((milestone, index) => (
            <div key={milestone.id} className="p-5 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{milestone.milestone_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      milestone.status === '達成' ? 'bg-green-100 text-green-700' :
                      milestone.status === '保留' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {milestone.status}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {milestone.milestone_type}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                    {milestone.target_date && (
                      <div>
                        <span className="text-gray-600">{t('targetDate')}:</span>
                        <span className="ml-2 font-semibold">{new Date(milestone.target_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {milestone.achieved_date && (
                      <div>
                        <span className="text-gray-600">{t('achievedDate')}:</span>
                        <span className="ml-2 font-semibold text-green-700">{new Date(milestone.achieved_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {milestone.certificate_number && (
                      <div>
                        <span className="text-gray-600">{t('certificateNumber')}:</span>
                        <span className="ml-2 font-semibold">{milestone.certificate_number}</span>
                      </div>
                    )}
                  </div>
                  {milestone.notes && (
                    <div className="text-sm text-gray-600 mt-2">
                      {milestone.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface MilestoneFormProps {
  milestone: Milestone;
  onSave: (milestone: Milestone) => void;
  onCancel: () => void;
}

function MilestoneForm({ milestone, onSave, onCancel }: MilestoneFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Milestone>(milestone);

  const handleChange = (field: keyof Milestone, value: any) => {
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
            {t('milestoneName')} *
          </label>
          <input
            type="text"
            required
            value={formData.milestone_name}
            onChange={(e) => handleChange('milestone_name', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('milestoneType')} *
          </label>
          <select
            required
            value={formData.milestone_type}
            onChange={(e) => handleChange('milestone_type', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
          >
            <option value="">Select...</option>
            <option value="特定訓練コース修了">特定訓練コース修了</option>
            <option value="JLPT N3合格">JLPT N3合格</option>
            <option value="JLPT N2合格">JLPT N2合格</option>
            <option value="安全講習修了">安全講習修了</option>
            <option value="重機操作資格取得">重機操作資格取得</option>
            <option value="その他">その他</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('targetDate')}
          </label>
          <input
            type="date"
            value={formData.target_date || ''}
            onChange={(e) => handleChange('target_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('achievedDate')}
          </label>
          <input
            type="date"
            value={formData.achieved_date || ''}
            onChange={(e) => handleChange('achieved_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('status')}
          </label>
          <select
            value={formData.status || '未達成'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
          >
            <option value="未達成">{t('notAchieved')}</option>
            <option value="達成">{t('achieved')}</option>
            <option value="保留">{t('pending')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('certificateNumber')}
          </label>
          <input
            type="text"
            value={formData.certificate_number || ''}
            onChange={(e) => handleChange('certificate_number', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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

