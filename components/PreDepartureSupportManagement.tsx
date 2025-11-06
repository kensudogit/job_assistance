'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { preDepartureSupportApi, type PreDepartureSupport } from '@/lib/api';

interface PreDepartureSupportManagementProps {
  workerId: number;
}

export default function PreDepartureSupportManagement({ workerId }: PreDepartureSupportManagementProps) {
  const { t } = useTranslation();
  const [supports, setSupports] = useState<PreDepartureSupport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSupport, setEditingSupport] = useState<PreDepartureSupport | null>(null);

  useEffect(() => {
    loadSupports();
  }, [workerId]);

  const loadSupports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await preDepartureSupportApi.getAll(workerId);
      setSupports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pre-departure supports');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupport = () => {
    setEditingSupport({
      worker_id: workerId,
      support_date: new Date().toISOString().split('T')[0],
      support_type: 'visa',
      support_content: '',
      status: 'pending',
    });
    setShowForm(true);
  };

  const handleSaveSupport = async (support: PreDepartureSupport) => {
    try {
      await preDepartureSupportApi.create(support);
      setShowForm(false);
      setEditingSupport(null);
      loadSupports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pre-departure support');
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
      <div className="p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('preDepartureSupport')}</h2>
          </div>
          <button
            onClick={handleAddSupport}
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

      {showForm && editingSupport && (
        <div className="p-6 border-b bg-gray-50">
          <SupportForm
            support={editingSupport}
            onSave={handleSaveSupport}
            onCancel={() => {
              setShowForm(false);
              setEditingSupport(null);
            }}
          />
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {supports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No pre-departure support records found</p>
          </div>
        ) : (
          supports.map((support, index) => (
            <div key={support.id} className="p-5 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {support.support_type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      support.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      support.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {support.status}
                    </span>
                    {support.documents_submitted && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {t('documentsSubmitted')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {t('supportDate')}: {new Date(support.support_date).toLocaleDateString()}
                  </div>
                  <div className="text-base font-semibold text-gray-900 mb-2">
                    {support.support_content}
                  </div>
                  {support.required_documents && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t('requiredDocuments')}:</span> {support.required_documents}
                    </div>
                  )}
                  {support.support_staff && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t('supportStaff')}:</span> {support.support_staff}
                    </div>
                  )}
                  {support.next_action && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t('nextAction')}:</span> {support.next_action}
                    </div>
                  )}
                  {support.next_action_date && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t('nextActionDate')}:</span> {new Date(support.next_action_date).toLocaleDateString()}
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

interface SupportFormProps {
  support: PreDepartureSupport;
  onSave: (support: PreDepartureSupport) => void;
  onCancel: () => void;
}

function SupportForm({ support, onSave, onCancel }: SupportFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PreDepartureSupport>(support);

  const handleChange = (field: keyof PreDepartureSupport, value: any) => {
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
            {t('supportDate')} *
          </label>
          <input
            type="date"
            required
            value={formData.support_date}
            onChange={(e) => handleChange('support_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('supportType')} *
          </label>
          <select
            required
            value={formData.support_type}
            onChange={(e) => handleChange('support_type', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          >
            <option value="visa">{t('visa')}</option>
            <option value="documentation">{t('documentation')}</option>
            <option value="orientation">{t('orientation')}</option>
            <option value="language">{t('language')}</option>
            <option value="cultural">{t('cultural')}</option>
            <option value="other">{t('other')}</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('supportContent')} *
          </label>
          <textarea
            required
            value={formData.support_content}
            onChange={(e) => handleChange('support_content', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('status')}
          </label>
          <select
            value={formData.status || 'pending'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          >
            <option value="pending">{t('pending')}</option>
            <option value="in_progress">{t('inProgress')}</option>
            <option value="completed">{t('completed')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('documentsSubmitted')}
          </label>
          <select
            value={formData.documents_submitted ? 'yes' : 'no'}
            onChange={(e) => handleChange('documents_submitted', e.target.value === 'yes')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          >
            <option value="no">{t('no')}</option>
            <option value="yes">{t('yes')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('requiredDocuments')}
          </label>
          <input
            type="text"
            value={formData.required_documents || ''}
            onChange={(e) => handleChange('required_documents', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('supportStaff')}
          </label>
          <input
            type="text"
            value={formData.support_staff || ''}
            onChange={(e) => handleChange('support_staff', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('nextAction')}
          </label>
          <input
            type="text"
            value={formData.next_action || ''}
            onChange={(e) => handleChange('next_action', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('nextActionDate')}
          </label>
          <input
            type="date"
            value={formData.next_action_date || ''}
            onChange={(e) => handleChange('next_action_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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

