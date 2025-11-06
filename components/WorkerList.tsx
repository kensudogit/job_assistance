'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { workerApi, type Worker } from '@/lib/api';

interface WorkerListProps {
  onSelectWorker: (workerId: number | null) => void;
  selectedWorker: number | null;
}

export default function WorkerList({ onSelectWorker, selectedWorker }: WorkerListProps) {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workerApi.getAll();
      setWorkers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workers');
    } finally {
      setLoading(false);
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
          onClick={loadWorkers}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl shadow-xl overflow-hidden card-hover">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">{t('title')}</h2>
          <span className="ml-auto px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
            {workers.length}
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
        {workers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No workers found</p>
          </div>
        ) : (
          workers.map((worker, index) => (
            <div
              key={worker.id}
              onClick={() => onSelectWorker(worker.id || null)}
              className={`p-5 cursor-pointer transition-all duration-300 ${
                selectedWorker === worker.id
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 shadow-md'
                  : 'hover:bg-gray-50 hover:shadow-sm'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
                  selectedWorker === worker.id
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700'
                }`}>
                  {worker.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg text-gray-900 truncate">{worker.name}</h3>
                    {worker.japanese_level && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {worker.japanese_level}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
                    {worker.nationality && (
                      <span className="flex items-center gap-1">
                        <span className="text-base">🌍</span>
                        {worker.nationality}
                      </span>
                    )}
                    {worker.native_language && (
                      <span className="flex items-center gap-1">
                        <span className="text-base">💬</span>
                        {worker.native_language}
                      </span>
                    )}
                    {worker.current_status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        worker.current_status === '就労中' ? 'bg-green-100 text-green-700' :
                        worker.current_status === '面談中' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {worker.current_status}
                      </span>
                    )}
                  </div>
                  {worker.visa_expiry_date && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Visa Expiry: {new Date(worker.visa_expiry_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {selectedWorker === worker.id && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

