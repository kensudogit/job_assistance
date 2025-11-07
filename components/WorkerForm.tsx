'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { workerApi, type Worker } from '@/lib/api';

interface WorkerFormProps {
  onSuccess?: () => void;
  worker?: Worker;
}

export default function WorkerForm({ onSuccess, worker }: WorkerFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Worker>>(
    worker || {
      name: '',
      email: '',
      current_status: '登録中',
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedData, setSavedData] = useState<Worker | null>(null);  // 保存されたデータを保持

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSavedData(null);

    try {
      let savedWorker: Worker;
      if (worker?.id) {
        savedWorker = await workerApi.update(worker.id, formData);
        console.log('就労者情報を更新しました:', savedWorker);
      } else {
        savedWorker = await workerApi.create(formData as Worker);
        console.log('就労者情報を登録しました:', savedWorker);
      }
      
      // 保存されたデータを画面に表示するために保持
      setSavedData(savedWorker);
      
      // コンソールログに詳細情報を出力
      console.log('=== 登録/更新された就労者情報 ===');
      console.log('ID:', savedWorker.id);
      console.log('名前:', savedWorker.name);
      console.log('カナ名:', savedWorker.name_kana);
      console.log('メールアドレス:', savedWorker.email);
      console.log('電話番号:', savedWorker.phone);
      console.log('国籍:', savedWorker.nationality);
      console.log('母国語:', savedWorker.native_language);
      console.log('在留資格:', savedWorker.visa_status);
      console.log('在留期限:', savedWorker.visa_expiry_date);
      console.log('日本語レベル:', savedWorker.japanese_level);
      console.log('現在のステータス:', savedWorker.current_status);
      console.log('スキル:', savedWorker.skills);
      console.log('備考:', savedWorker.notes);
      console.log('作成日時:', savedWorker.created_at);
      console.log('更新日時:', savedWorker.updated_at);
      console.log('================================');
      
      onSuccess?.();
      if (!worker) {
        setFormData({
          name: '',
          email: '',
          current_status: '登録中',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save worker');
      console.error('保存エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Worker, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="glass rounded-2xl shadow-xl p-8 card-hover animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={worker ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
          </svg>
        </div>
        <h2 className="text-2xl font-bold gradient-text">
          {worker ? t('edit') : t('addWorker')}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-md animate-slide-up">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {savedData && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-800 px-4 py-4 rounded-lg shadow-md animate-slide-up">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-green-900">
                  {worker?.id ? '就労者情報を更新しました' : '就労者情報を登録しました'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-green-900">ID:</span>
                      <span className="ml-2 text-green-700">{savedData.id}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-900">名前:</span>
                      <span className="ml-2 text-green-700">{savedData.name}</span>
                    </div>
                    {savedData.name_kana && (
                      <div>
                        <span className="font-semibold text-green-900">カナ名:</span>
                        <span className="ml-2 text-green-700">{savedData.name_kana}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-green-900">メールアドレス:</span>
                      <span className="ml-2 text-green-700">{savedData.email}</span>
                    </div>
                    {savedData.phone && (
                      <div>
                        <span className="font-semibold text-green-900">電話番号:</span>
                        <span className="ml-2 text-green-700">{savedData.phone}</span>
                      </div>
                    )}
                    {savedData.nationality && (
                      <div>
                        <span className="font-semibold text-green-900">国籍:</span>
                        <span className="ml-2 text-green-700">{savedData.nationality}</span>
                      </div>
                    )}
                    {savedData.native_language && (
                      <div>
                        <span className="font-semibold text-green-900">母国語:</span>
                        <span className="ml-2 text-green-700">{savedData.native_language}</span>
                      </div>
                    )}
                    {savedData.visa_status && (
                      <div>
                        <span className="font-semibold text-green-900">在留資格:</span>
                        <span className="ml-2 text-green-700">{savedData.visa_status}</span>
                      </div>
                    )}
                    {savedData.visa_expiry_date && (
                      <div>
                        <span className="font-semibold text-green-900">在留期限:</span>
                        <span className="ml-2 text-green-700">{savedData.visa_expiry_date}</span>
                      </div>
                    )}
                    {savedData.japanese_level && (
                      <div>
                        <span className="font-semibold text-green-900">日本語レベル:</span>
                        <span className="ml-2 text-green-700">{savedData.japanese_level}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-green-900">現在のステータス:</span>
                      <span className="ml-2 text-green-700">{savedData.current_status}</span>
                    </div>
                    {savedData.skills && (
                      <div className="md:col-span-2">
                        <span className="font-semibold text-green-900">スキル:</span>
                        <span className="ml-2 text-green-700">{savedData.skills}</span>
                      </div>
                    )}
                    {savedData.notes && (
                      <div className="md:col-span-2">
                        <span className="font-semibold text-green-900">備考:</span>
                        <span className="ml-2 text-green-700">{savedData.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
              {t('workerName')} *
            </label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 hover:border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('nameKana')}
            </label>
            <input
              type="text"
              value={formData.name_kana || ''}
              onChange={(e) => handleChange('name_kana', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('email')} *
            </label>
            <input
              type="email"
              required
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('phone')}
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('nationality')}
            </label>
            <input
              type="text"
              value={formData.nationality || ''}
              onChange={(e) => handleChange('nationality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('nativeLanguage')}
            </label>
            <input
              type="text"
              value={formData.native_language || ''}
              onChange={(e) => handleChange('native_language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('visaStatus')}
            </label>
            <input
              type="text"
              value={formData.visa_status || ''}
              onChange={(e) => handleChange('visa_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('visaExpiryDate')}
            </label>
            <input
              type="date"
              value={formData.visa_expiry_date || ''}
              onChange={(e) => handleChange('visa_expiry_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('japaneseLevel')}
            </label>
            <select
              value={formData.japanese_level || ''}
              onChange={(e) => handleChange('japanese_level', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              <option value="N1">N1</option>
              <option value="N2">N2</option>
              <option value="N3">N3</option>
              <option value="N4">N4</option>
              <option value="N5">N5</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('currentStatus')}
            </label>
            <select
              value={formData.current_status || ''}
              onChange={(e) => handleChange('current_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="登録中">登録中</option>
              <option value="面談中">面談中</option>
              <option value="就労中">就労中</option>
              <option value="休職中">休職中</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('skills')}
          </label>
          <textarea
            value={formData.skills || ''}
            onChange={(e) => handleChange('skills', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('notes')}
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="group flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('save')}
                </>
              )}
            </span>
          </button>
          {onSuccess && (
            <button
              type="button"
              onClick={onSuccess}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {t('cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

