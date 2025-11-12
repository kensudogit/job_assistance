'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import WorkerList from '@/components/WorkerList';
import WorkerForm from '@/components/WorkerForm';
import ProgressManagement from '@/components/ProgressManagement';
import JapaneseProficiencyManagement from '@/components/JapaneseProficiencyManagement';
import SkillTrainingManagement from '@/components/SkillTrainingManagement';
import IntegratedDashboard from '@/components/IntegratedDashboard';
import TrainingMenuManagement from '@/components/TrainingMenuManagement';
import MilestoneManagement from '@/components/MilestoneManagement';
import CareerPathTimeline from '@/components/CareerPathTimeline';
import EvidenceReport from '@/components/EvidenceReport';
import AdminSummary from '@/components/AdminSummary';
import TrainingSessionDetail from '@/components/TrainingSessionDetail';
import TrainingMenuAssignmentComponent from '@/components/TrainingMenuAssignment';
import LanguageSelector from '@/components/LanguageSelector';

type TabType = 'progress' | 'japanese' | 'skill' | 'dashboard' | 'milestone' | 'career' | 'report' | 'sessions' | 'assignment';

export default function Home() {
  const { t } = useTranslation();
  const [selectedWorker, setSelectedWorker] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* ヘッダー */}
      <header className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">就</span>
              </div>
              <h1 className="text-3xl font-bold gradient-text">
                {t('title')}
              </h1>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* アクションボタン */}
        <div className="mb-8 animate-slide-up">
          <button
            onClick={() => setShowForm(!showForm)}
            className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-glow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
              </svg>
              {showForm ? t('hideForm') : t('addWorker')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* フォーム */}
        {showForm && (
          <div className="mb-8 animate-slide-up">
            <WorkerForm
              onSuccess={() => {
                setShowForm(false);
              }}
            />
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="space-y-8">
          {/* 管理者向けサマリー（全員共通） */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <AdminSummary />
          </div>

          {/* 訓練メニュー管理（全員共通） */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <TrainingMenuManagement />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <WorkerList
                onSelectWorker={setSelectedWorker}
                selectedWorker={selectedWorker}
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="space-y-6">
                {/* タブナビゲーション */}
                <div className="glass rounded-xl p-2 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                      activeTab === 'dashboard'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                        : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                    }`}
                  >
                    {t('integratedDashboard')}
                  </button>
                  {selectedWorker && (
                    <>
                      <button
                        onClick={() => setActiveTab('progress')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                          activeTab === 'progress'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                            : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                        }`}
                      >
                        {t('progressManagement')}
                      </button>
                    <button
                      onClick={() => setActiveTab('japanese')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                        activeTab === 'japanese'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                      }`}
                    >
                      {t('japaneseProficiency')}
                    </button>
                    <button
                      onClick={() => setActiveTab('skill')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                        activeTab === 'skill'
                          ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                      }`}
                    >
                      {t('skillTraining')}
                    </button>
                    <button
                      onClick={() => setActiveTab('milestone')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                        activeTab === 'milestone'
                          ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                      }`}
                    >
                      {t('milestoneManagement')}
                    </button>
                    <button
                      onClick={() => setActiveTab('career')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                        activeTab === 'career'
                          ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                      }`}
                    >
                      {t('careerPathTimeline')}
                    </button>
                    <button
                      onClick={() => setActiveTab('report')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                        activeTab === 'report'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                      }`}
                    >
                      {t('evidenceReport')}
                    </button>
                    <button
                      onClick={() => setActiveTab('sessions')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                        activeTab === 'sessions'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                      }`}
                    >
                      {t('trainingSessions')}
                    </button>
                      <button
                        onClick={() => setActiveTab('assignment')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                          activeTab === 'assignment'
                            ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg scale-105'
                            : 'text-gray-700 hover:bg-gray-100 hover:scale-105'
                        }`}
                      >
                        {t('trainingMenuAssignment')}
                      </button>
                    </>
                  )}
                </div>

                {/* タブコンテンツ */}
                <div className="animate-fade-in">
                  {activeTab === 'dashboard' && (
                    <IntegratedDashboard key={`dashboard-${selectedWorker || 0}`} workerId={selectedWorker || 0} />
                  )}
                  {selectedWorker && (
                    <>
                      {activeTab === 'progress' && (
                        <ProgressManagement workerId={selectedWorker} />
                      )}
                      {activeTab === 'japanese' && (
                        <JapaneseProficiencyManagement workerId={selectedWorker} />
                      )}
                      {activeTab === 'skill' && (
                        <SkillTrainingManagement workerId={selectedWorker} />
                      )}
                      {activeTab === 'milestone' && (
                        <MilestoneManagement workerId={selectedWorker} />
                      )}
                      {activeTab === 'career' && (
                        <CareerPathTimeline workerId={selectedWorker} />
                      )}
                      {activeTab === 'report' && (
                        <EvidenceReport workerId={selectedWorker} />
                      )}
                      {activeTab === 'sessions' && (
                        <TrainingSessionDetail workerId={selectedWorker} />
                      )}
                      {activeTab === 'assignment' && (
                        <TrainingMenuAssignmentComponent workerId={selectedWorker} />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
