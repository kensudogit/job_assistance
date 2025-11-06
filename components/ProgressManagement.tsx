'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { progressApi, workerApi, type WorkerProgress, type Worker } from '@/lib/api';

interface ProgressManagementProps {
  workerId: number;
}

export default function ProgressManagement({ workerId }: ProgressManagementProps) {
  const { t } = useTranslation();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [progressList, setProgressList] = useState<WorkerProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProgress, setEditingProgress] = useState<WorkerProgress | null>(null);

  useEffect(() => {
    loadData();
  }, [workerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [workerData, progressData] = await Promise.all([
        workerApi.getById(workerId),
        progressApi.getAll(workerId),
      ]);
      setWorker(workerData);
      setProgressList(progressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgress = () => {
    setEditingProgress({
      worker_id: workerId,
      progress_date: new Date().toISOString().split('T')[0],
      progress_type: '',
      status: '実施中',
    });
    setShowForm(true);
  };

  const handleEditProgress = (progress: WorkerProgress) => {
    setEditingProgress(progress);
    setShowForm(true);
  };

  const handleDeleteProgress = async (progressId: number) => {
    if (!confirm('Delete this progress record?')) return;

    try {
      await progressApi.delete(workerId, progressId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete progress');
    }
  };

  const handleSaveProgress = async (progress: WorkerProgress) => {
    try {
      if (progress.id) {
        await progressApi.update(workerId, progress.id, progress);
      } else {
        await progressApi.create(progress);
      }
      setShowForm(false);
      setEditingProgress(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500">Error: {error}</div>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover animate-slide-up">
      <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('progressManagement')}</h2>
              {worker && (
                <div className="text-sm text-white/90 mt-1 flex items-center gap-2">
                  <span>{worker.name}</span>
                  {worker.nationality && (
                    <>
                      <span>•</span>
                      <span>{worker.nationality}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleAddProgress}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 hover:scale-105 active:scale-95 font-semibold"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('addProgress')}
            </span>
          </button>
        </div>
      </div>

      {showForm && editingProgress && (
        <div className="p-4 border-b bg-gray-50">
          <ProgressForm
            progress={editingProgress}
            onSave={handleSaveProgress}
            onCancel={() => {
              setShowForm(false);
              setEditingProgress(null);
            }}
          />
        </div>
      )}

      <div className="divide-y">
        {progressList.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No progress records found</div>
        ) : (
          progressList.map((progress, index) => (
            <div 
              key={progress.id} 
              className="p-5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 border-l-4 border-transparent hover:border-indigo-500 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${
                      progress.status === '完了' ? 'bg-green-500' :
                      progress.status === '実施中' ? 'bg-blue-500 animate-pulse' :
                      progress.status === '保留' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}></div>
                    <h3 className="font-bold text-lg text-gray-900">{progress.title || progress.progress_type}</h3>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(progress.progress_date).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      progress.status === '完了' ? 'bg-green-100 text-green-700' :
                      progress.status === '実施中' ? 'bg-blue-100 text-blue-700' :
                      progress.status === '保留' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {progress.status}
                    </span>
                  </div>
                  {progress.description && (
                    <div className="text-sm text-gray-700 mt-2">{progress.description}</div>
                  )}
                  {progress.support_content && (
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>{t('supportContent')}:</strong> {progress.support_content}
                    </div>
                  )}
                  {progress.next_action && (
                    <div className="text-sm text-blue-600 mt-1">
                      <strong>{t('nextAction')}:</strong> {progress.next_action}
                      {progress.next_action_date && (
                        <span className="ml-2">
                          ({new Date(progress.next_action_date).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  )}
                  {progress.support_staff && (
                    <div className="text-xs text-gray-500 mt-1">
                      {t('supportStaff')}: {progress.support_staff}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditProgress(progress)}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => progress.id && handleDeleteProgress(progress.id)}
                    className="px-3 py-1 text-sm bg-red-200 text-red-700 rounded hover:bg-red-300"
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

interface ProgressFormProps {
  progress: WorkerProgress;
  onSave: (progress: WorkerProgress) => void;
  onCancel: () => void;
}

function ProgressForm({ progress, onSave, onCancel }: ProgressFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<WorkerProgress>(progress);

  const handleChange = (field: keyof WorkerProgress, value: any) => {
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('progressDate')} *
          </label>
          <input
            type="date"
            required
            value={formData.progress_date}
            onChange={(e) => handleChange('progress_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('progressType')} *
          </label>
          <input
            type="text"
            required
            value={formData.progress_type}
            onChange={(e) => handleChange('progress_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="面談、研修、就労開始など"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('titleField')}
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('status')}
          </label>
          <select
            value={formData.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="実施中">実施中</option>
            <option value="完了">完了</option>
            <option value="保留">保留</option>
            <option value="キャンセル">キャンセル</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('nextActionDate')}
          </label>
          <input
            type="date"
            value={formData.next_action_date || ''}
            onChange={(e) => handleChange('next_action_date', e.target.value || undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('supportStaff')}
          </label>
          <input
            type="text"
            value={formData.support_staff || ''}
            onChange={(e) => handleChange('support_staff', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('description')}
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('supportContent')}
        </label>
        <textarea
          value={formData.support_content || ''}
          onChange={(e) => handleChange('support_content', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('nextAction')}
        </label>
        <textarea
          value={formData.next_action || ''}
          onChange={(e) => handleChange('next_action', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}

