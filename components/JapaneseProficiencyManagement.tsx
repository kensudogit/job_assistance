'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { japaneseProficiencyApi, type JapaneseProficiency } from '@/lib/api';

interface JapaneseProficiencyManagementProps {
  workerId: number;
}

export default function JapaneseProficiencyManagement({ workerId }: JapaneseProficiencyManagementProps) {
  const { t } = useTranslation();
  const [proficiencies, setProficiencies] = useState<JapaneseProficiency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProficiency, setEditingProficiency] = useState<JapaneseProficiency | null>(null);

  useEffect(() => {
    loadProficiencies();
  }, [workerId]);

  const loadProficiencies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await japaneseProficiencyApi.getAll(workerId);
      setProficiencies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadProficiencies'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddProficiency = () => {
    setEditingProficiency({
      worker_id: workerId,
      test_date: new Date().toISOString().split('T')[0],
      test_type: 'JLPT',
      passed: false,
    });
    setShowForm(true);
  };

  const handleEditProficiency = (proficiency: JapaneseProficiency) => {
    setEditingProficiency(proficiency);
    setShowForm(true);
  };

  const handleSaveProficiency = async (proficiency: JapaneseProficiency) => {
    try {
      if (proficiency.id) {
        await japaneseProficiencyApi.update(workerId, proficiency.id, proficiency);
      } else {
        await japaneseProficiencyApi.create(proficiency);
      }
      setShowForm(false);
      setEditingProficiency(null);
      loadProficiencies();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToSaveProficiency'));
    }
  };

  const handleDeleteProficiency = async (proficiencyId: number) => {
    if (!confirm(t('confirmDeleteProficiency'))) return;
    
    try {
      await japaneseProficiencyApi.delete(workerId, proficiencyId);
      loadProficiencies();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToDeleteProficiency'));
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="text-center text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
      <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('japaneseProficiency')}</h2>
          </div>
          <button
            onClick={handleAddProficiency}
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

      {showForm && editingProficiency && (
        <div className="p-6 border-b bg-gray-50">
          <ProficiencyForm
            proficiency={editingProficiency}
            onSave={handleSaveProficiency}
            onCancel={() => {
              setShowForm(false);
              setEditingProficiency(null);
            }}
          />
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {proficiencies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">{t('noProficiencyRecordsFound')}</p>
          </div>
        ) : (
          proficiencies.map((proficiency, index) => (
            <div key={proficiency.id} className="p-5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      proficiency.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {proficiency.passed ? t('passed') : t('failed')}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {proficiency.test_type}
                    </span>
                    {proficiency.level && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {proficiency.level}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {t('testDate')}: {new Date(proficiency.test_date).toLocaleDateString()}
                  </div>
                  {proficiency.total_score && (
                    <div className="text-lg font-bold text-gray-900 mb-2">
                      {t('totalScore')}: {proficiency.total_score}{t('points')}
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {proficiency.reading_score !== null && proficiency.reading_score !== undefined && (
                      <div>
                        <span className="text-gray-600">{t('readingScore')}:</span>
                        <span className="ml-2 font-semibold">{proficiency.reading_score}</span>
                      </div>
                    )}
                    {proficiency.listening_score !== null && proficiency.listening_score !== undefined && (
                      <div>
                        <span className="text-gray-600">{t('listeningScore')}:</span>
                        <span className="ml-2 font-semibold">{proficiency.listening_score}</span>
                      </div>
                    )}
                    {proficiency.writing_score !== null && proficiency.writing_score !== undefined && (
                      <div>
                        <span className="text-gray-600">{t('writingScore')}:</span>
                        <span className="ml-2 font-semibold">{proficiency.writing_score}</span>
                      </div>
                    )}
                    {proficiency.speaking_score !== null && proficiency.speaking_score !== undefined && (
                      <div>
                        <span className="text-gray-600">{t('speakingScore')}:</span>
                        <span className="ml-2 font-semibold">{proficiency.speaking_score}</span>
                      </div>
                    )}
                  </div>
                  {proficiency.certificate_number && (
                    <div className="text-xs text-gray-500 mt-2">
                      {t('certificateNumber')}: {proficiency.certificate_number}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEditProficiency(proficiency)}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-all"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => proficiency.id && handleDeleteProficiency(proficiency.id)}
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

interface ProficiencyFormProps {
  proficiency: JapaneseProficiency;
  onSave: (proficiency: JapaneseProficiency) => void;
  onCancel: () => void;
}

function ProficiencyForm({ proficiency, onSave, onCancel }: ProficiencyFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<JapaneseProficiency>(proficiency);

  const handleChange = (field: keyof JapaneseProficiency, value: any) => {
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
            {t('testType')} *
          </label>
          <select
            required
            value={formData.test_type}
            onChange={(e) => handleChange('test_type', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          >
            <option value="JLPT">JLPT</option>
            <option value="JFT-Basic">JFT-Basic</option>
            <option value="BJT">BJT</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('testDate')} *
          </label>
          <input
            type="date"
            required
            value={formData.test_date}
            onChange={(e) => handleChange('test_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('testLevel')}
          </label>
          <select
            value={formData.level || ''}
            onChange={(e) => handleChange('level', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          >
            <option value="">{t('select')}</option>
            <option value="N1">N1</option>
            <option value="N2">N2</option>
            <option value="N3">N3</option>
            <option value="N4">N4</option>
            <option value="N5">N5</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('totalScore')}
          </label>
          <input
            type="number"
            value={formData.total_score || ''}
            onChange={(e) => handleChange('total_score', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('readingScore')}
          </label>
          <input
            type="number"
            value={formData.reading_score || ''}
            onChange={(e) => handleChange('reading_score', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('listeningScore')}
          </label>
          <input
            type="number"
            value={formData.listening_score || ''}
            onChange={(e) => handleChange('listening_score', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('writingScore')}
          </label>
          <input
            type="number"
            value={formData.writing_score || ''}
            onChange={(e) => handleChange('writing_score', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('speakingScore')}
          </label>
          <input
            type="number"
            value={formData.speaking_score || ''}
            onChange={(e) => handleChange('speaking_score', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('passed')} / {t('failed')}
          </label>
          <select
            value={formData.passed ? 'passed' : 'failed'}
            onChange={(e) => handleChange('passed', e.target.value === 'passed')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          >
            <option value="failed">{t('failed')}</option>
            <option value="passed">{t('passed')}</option>
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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

