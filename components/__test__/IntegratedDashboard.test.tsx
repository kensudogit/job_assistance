/**
 * IntegratedDashboard コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import IntegratedDashboard from '../IntegratedDashboard';
import { integratedDashboardApi } from '@/lib/api';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: { ja: { translation: {} }, en: { translation: {} } },
  lng: 'ja',
  fallbackLng: 'ja',
  interpolation: { escapeValue: false },
});

vi.mock('@/lib/api', () => ({
  integratedDashboardApi: {
    get: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('IntegratedDashboard', () => {
  const mockWorkerId = 1;
  const mockDashboardData = {
    kpi_timeline: [
      { date: '2024-01-01', overall_score: 75 },
      { date: '2024-01-02', overall_score: 80 },
    ],
    japanese_proficiency: [
      { date: '2024-01-01', test_type: 'JLPT', level: 'N3', passed: true },
    ],
    summary: {
      total_sessions: 10,
      total_training_hours: 100,
      average_overall_score: 77.5,
      latest_overall_score: 80,
      total_milestones: 5,
      achieved_milestones: 3,
      milestone_achievement_rate: 60,
    },
    recent_milestones: [
      { id: 1, milestone_name: '日本語N3取得', status: '達成' },
    ],
    recent_progress: [
      { id: 1, progress_date: '2024-01-01', progress_type: '面接', status: '完了' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ダッシュボードが表示される', async () => {
    (integratedDashboardApi.get as any).mockResolvedValue(mockDashboardData);

    render(
      <TestWrapper>
        <IntegratedDashboard workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/10|total sessions/i)).toBeInTheDocument();
    });
  });

  it('サマリー情報を表示する', async () => {
    (integratedDashboardApi.get as any).mockResolvedValue(mockDashboardData);

    render(
      <TestWrapper>
        <IntegratedDashboard workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/100|training hours/i)).toBeInTheDocument();
      expect(screen.getByText(/77.5|average score/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (integratedDashboardApi.get as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <IntegratedDashboard workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });

  it('データが空の場合でもデフォルト値を表示する', async () => {
    const emptyData = {
      kpi_timeline: [],
      japanese_proficiency: [],
      summary: {
        total_sessions: 0,
        total_training_hours: 0,
        total_milestones: 0,
        achieved_milestones: 0,
        milestone_achievement_rate: 0,
      },
      recent_milestones: [],
      recent_progress: [],
    };
    (integratedDashboardApi.get as any).mockResolvedValue(emptyData);

    render(
      <TestWrapper>
        <IntegratedDashboard workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/0|no data/i)).toBeInTheDocument();
    });
  });
});

