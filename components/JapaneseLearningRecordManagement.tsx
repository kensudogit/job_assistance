'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { japaneseLearningApi, type JapaneseLearningRecord } from '@/lib/api';

interface JapaneseLearningRecordManagementProps {
  workerId: number;
}

export default function JapaneseLearningRecordManagement({ workerId }: JapaneseLearningRecordManagementProps) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<JapaneseLearningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<JapaneseLearningRecord | null>(null);

  useEffect(() => {
    loadRecords();
  }, [workerId]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await japaneseLearningApi.getAll(workerId);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = () => {
    setEditingRecord({
      worker_id: workerId,
      learning_date: new Date().toISOString().split('T')[0],
      learning_type: 'classroom',
      learning_content: '',
    });
    setShowForm(true);
  };

  const handleSaveRecord = async (record: JapaneseLearningRecord) => {
    try {
      await japaneseLearningApi.create(record);
      setShowForm(false);
      setEditingRecord(null);
      loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save learning record');
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
      <div className="p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">{t('japaneseLearningRecords')}</h2>
          </div>
          <button
            onClick={handleAddRecord}
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

      {showForm && editingRecord && (
        <div className="p-6 border-b bg-gray-50">
          <LearningRecordForm
            record={editingRecord}
            onSave={handleSaveRecord}
            onCancel={() => {
              setShowForm(false);
              setEditingRecord(null);
            }}
          />
        </div>
      )}

      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {records.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No learning records found</p>
          </div>
        ) : (
          records.map((record, index) => (
            <div key={record.id} className="p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {record.learning_type}
                    </span>
                    {record.difficulty_level && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {record.difficulty_level}
                      </span>
                    )}
                    {record.duration_minutes && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        {record.duration_minutes}分
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {t('learningDate')}: {new Date(record.learning_date).toLocaleDateString()}
                  </div>
                  <div className="text-base font-semibold text-gray-900 mb-2">
                    {record.learning_content}
                  </div>
                  {record.topics_covered && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t('topicsCovered')}:</span> {record.topics_covered}
                    </div>
                  )}
                  {record.vocabulary_learned && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t('vocabularyLearned')}:</span> {record.vocabulary_learned}語
                    </div>
                  )}
                  {record.grammar_points && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t('grammarPoints')}:</span> {record.grammar_points}
                    </div>
                  )}
                  {record.self_rating && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">{t('selfRating')}:</span> {record.self_rating}/5
                    </div>
                  )}
                  {record.homework_completed && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {t('homeworkCompleted')}
                    </span>
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

interface LearningRecordFormProps {
  record: JapaneseLearningRecord;
  onSave: (record: JapaneseLearningRecord) => void;
  onCancel: () => void;
}

function LearningRecordForm({ record, onSave, onCancel }: LearningRecordFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<JapaneseLearningRecord>(record);

  const handleChange = (field: keyof JapaneseLearningRecord, value: any) => {
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
            {t('learningDate')} *
          </label>
          <input
            type="date"
            required
            value={formData.learning_date}
            onChange={(e) => handleChange('learning_date', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('learningType')} *
          </label>
          <select
            required
            value={formData.learning_type}
            onChange={(e) => handleChange('learning_type', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="classroom">{t('classroom')}</option>
            <option value="online">{t('online')}</option>
            <option value="self-study">{t('selfStudy')}</option>
            <option value="conversation">{t('conversation')}</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('learningContent')} *
          </label>
          <textarea
            required
            value={formData.learning_content}
            onChange={(e) => handleChange('learning_content', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('topicsCovered')}
          </label>
          <input
            type="text"
            value={formData.topics_covered || ''}
            onChange={(e) => handleChange('topics_covered', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('durationMinutes')}
          </label>
          <input
            type="number"
            value={formData.duration_minutes || ''}
            onChange={(e) => handleChange('duration_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('vocabularyLearned')}
          </label>
          <input
            type="number"
            value={formData.vocabulary_learned || ''}
            onChange={(e) => handleChange('vocabulary_learned', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('grammarPoints')}
          </label>
          <input
            type="text"
            value={formData.grammar_points || ''}
            onChange={(e) => handleChange('grammar_points', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('difficultyLevel')}
          </label>
          <select
            value={formData.difficulty_level || ''}
            onChange={(e) => handleChange('difficulty_level', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="">Select...</option>
            <option value="beginner">{t('beginner')}</option>
            <option value="intermediate">{t('intermediate')}</option>
            <option value="advanced">{t('advanced')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('selfRating')} (1-5)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.self_rating || ''}
            onChange={(e) => handleChange('self_rating', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('instructorFeedback')}
          </label>
          <textarea
            value={formData.instructor_feedback || ''}
            onChange={(e) => handleChange('instructor_feedback', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('homeworkAssigned')}
          </label>
          <input
            type="text"
            value={formData.homework_assigned || ''}
            onChange={(e) => handleChange('homework_assigned', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('homeworkCompleted')}
          </label>
          <select
            value={formData.homework_completed ? 'yes' : 'no'}
            onChange={(e) => handleChange('homework_completed', e.target.value === 'yes')}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          >
            <option value="no">{t('no')}</option>
            <option value="yes">{t('yes')}</option>
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
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
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

