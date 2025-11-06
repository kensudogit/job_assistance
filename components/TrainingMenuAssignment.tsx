'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trainingMenuApi, trainingMenuAssignmentApi, type TrainingMenu, type TrainingMenuAssignment } from '@/lib/api';

interface TrainingMenuAssignmentProps {
  workerId: number;
}

export default function TrainingMenuAssignment({ workerId }: TrainingMenuAssignmentProps) {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState<TrainingMenuAssignment[]>([]);
  const [menus, setMenus] = useState<TrainingMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TrainingMenuAssignment | null>(null);

  useEffect(() => {
    loadData();
  }, [workerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assignmentsData, menusData] = await Promise.all([
        trainingMenuAssignmentApi.getAll(workerId),
        trainingMenuApi.getAll(true), // アクティブなメニューのみ
      ]);
      setAssignments(assignmentsData);
      setMenus(menusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = () => {
    setEditingAssignment({
      worker_id: workerId,
      training_menu_id: menus[0]?.id || 0,
      assigned_date: new Date().toISOString().split('T')[0],
      status: '未開始',
    });
    setShowForm(true);
  };

  const handleSaveAssignment = async (assignment: TrainingMenuAssignment) => {
    try {
      await trainingMenuAssignmentApi.create(assignment);
      setShowForm(false);
      setEditingAssignment(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assignment');
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
      <div className="p-6 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('trainingMenuAssignment')}</h2>
          </div>
          <button
            onClick={handleAddAssignment}
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

      {showForm && editingAssignment && (
        <div className="p-6 border-b bg-gray-50">
          <AssignmentForm
            assignment={editingAssignment}
            menus={menus}
            onSave={handleSaveAssignment}
            onCancel={() => {
              setShowForm(false);
              setEditingAssignment(null);
            }}
          />
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {assignments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No assignments found</p>
          </div>
        ) : (
          assignments.map((assignment, index) => (
            <div key={assignment.id} className="p-5 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{assignment.menu_name || t('trainingMenu')}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      assignment.status === '完了' ? 'bg-green-100 text-green-700' :
                      assignment.status === '実施中' ? 'bg-blue-100 text-blue-700' :
                      assignment.status === '中断' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {assignment.status}
                    </span>
                    {assignment.scenario_id && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {assignment.scenario_id}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-2">
                    {assignment.assigned_date && (
                      <div>
                        <span className="text-gray-600">{t('assignedDate')}:</span>
                        <span className="ml-2 font-semibold">{new Date(assignment.assigned_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {assignment.deadline && (
                      <div>
                        <span className="text-gray-600">{t('deadline')}:</span>
                        <span className="ml-2 font-semibold text-red-700">{new Date(assignment.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    {assignment.equipment_type && (
                      <div>
                        <span className="text-gray-600">{t('equipmentType')}:</span>
                        <span className="ml-2 font-semibold">{assignment.equipment_type}</span>
                      </div>
                    )}
                    {assignment.difficulty_level && (
                      <div>
                        <span className="text-gray-600">{t('difficultyLevel')}:</span>
                        <span className="ml-2 font-semibold">{assignment.difficulty_level}</span>
                      </div>
                    )}
                  </div>
                  {assignment.completed_at && (
                    <div className="text-sm text-green-700 font-semibold">
                      {t('completedAt')}: {new Date(assignment.completed_at).toLocaleString()}
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

interface AssignmentFormProps {
  assignment: TrainingMenuAssignment;
  menus: TrainingMenu[];
  onSave: (assignment: TrainingMenuAssignment) => void;
  onCancel: () => void;
}

function AssignmentForm({ assignment, menus, onSave, onCancel }: AssignmentFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<TrainingMenuAssignment>(assignment);

  const handleChange = (field: keyof TrainingMenuAssignment, value: any) => {
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
            {t('trainingMenu')} *
          </label>
          <select
            required
            value={formData.training_menu_id}
            onChange={(e) => handleChange('training_menu_id', parseInt(e.target.value))}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
          >
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.menu_name} ({menu.difficulty_level})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('assignedDate')} *
          </label>
          <input
            type="date"
            required
            value={formData.assigned_date}
            onChange={(e) => handleChange('assigned_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('deadline')}
          </label>
          <input
            type="date"
            value={formData.deadline || ''}
            onChange={(e) => handleChange('deadline', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('status')}
          </label>
          <select
            value={formData.status || '未開始'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
          >
            <option value="未開始">{t('notStarted')}</option>
            <option value="実施中">{t('inProgress')}</option>
            <option value="完了">{t('completed')}</option>
            <option value="中断">{t('interrupted')}</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('notes')}
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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



