/**
 * 管理パネルコンポーネント
 * 管理者向けサマリー、全作業員の進捗、訓練メニュー管理を統合表示
 */
import { useState } from 'react';
import AdminSummary from '@/components/AdminSummary';
import WorkerList from '@/components/WorkerList';
import TrainingMenuManagement from '@/components/TrainingMenuManagement';

interface ManagementPanelProps {
  selectedWorker: number | null;
  onSelectWorker: (workerId: number | null) => void;
  userRole: string;
}

export default function ManagementPanel({ selectedWorker, onSelectWorker, userRole }: ManagementPanelProps) {
  const [showAdminSummary, setShowAdminSummary] = useState(true);
  const [showWorkerList, setShowWorkerList] = useState(true);
  const [showTrainingMenu, setShowTrainingMenu] = useState(true);

  return (
    <div className="space-y-6">
      {/* 表示/非表示切り替えボタン */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap gap-3">
          {(userRole === 'administrator' || userRole === 'auditor') && (
            <button
              onClick={() => setShowAdminSummary(!showAdminSummary)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                showAdminSummary
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showAdminSummary ? '✓' : '○'} 管理者向けサマリー
            </button>
          )}
          {(userRole === 'administrator' || userRole === 'auditor') && (
            <button
              onClick={() => setShowWorkerList(!showWorkerList)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                showWorkerList
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showWorkerList ? '✓' : '○'} 全作業員の進捗
            </button>
          )}
          {userRole === 'administrator' && (
            <button
              onClick={() => setShowTrainingMenu(!showTrainingMenu)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                showTrainingMenu
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showTrainingMenu ? '✓' : '○'} 訓練メニュー管理
            </button>
          )}
        </div>
      </div>

      {/* 管理者向けサマリー */}
      {(userRole === 'administrator' || userRole === 'auditor') && showAdminSummary && (
        <div className="animate-fade-in">
          <AdminSummary />
        </div>
      )}

      {/* 全作業員の進捗 */}
      {(userRole === 'administrator' || userRole === 'auditor') && showWorkerList && (
        <div className="animate-fade-in">
          <WorkerList
            onSelectWorker={onSelectWorker}
            selectedWorker={selectedWorker}
          />
        </div>
      )}

      {/* 訓練メニュー管理 */}
      {userRole === 'administrator' && showTrainingMenu && (
        <div className="animate-fade-in">
          <TrainingMenuManagement />
        </div>
      )}
    </div>
  );
}

