/**
 * AdminSummary コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminSummary from '../AdminSummary';
import { adminSummaryApi } from '@/lib/api';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// i18nextの初期化
i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: {} },
    en: { translation: {} },
  },
  lng: 'ja',
  fallbackLng: 'ja',
  interpolation: { escapeValue: false },
});

// adminSummaryApiをモック化
vi.mock('@/lib/api', () => ({
  adminSummaryApi: {
    get: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('AdminSummary', () => {
  const mockSummary = {
    total_workers: 10,
    active_workers: 8,
    total_trainings: 5,
    active_trainings: 3,
    workers_with_low_kpi: 2,
    workers_with_high_errors: 1,
    alerts: [
      {
        worker_id: 1,
        worker_name: 'テスト太郎',
        type: 'low_kpi',
        message: 'KPIが低いです',
        priority: 'high',
      },
    ],
    summary: [
      {
        worker_id: 1,
        worker_name: 'テスト太郎',
        japanese_level: 'N3',
        current_status: '訓練中',
        latest_kpi: { overall_score: 75 },
        milestones: { achieved: 3, total: 5, achievement_rate: 60 },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (adminSummaryApi.get as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <AdminSummary />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('サマリー情報を表示する', async () => {
    (adminSummaryApi.get as any).mockResolvedValue(mockSummary);

    render(
      <TestWrapper>
        <AdminSummary />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/10|total workers/i)).toBeInTheDocument();
      expect(screen.getByText(/8|active workers/i)).toBeInTheDocument();
    });
  });

  it('アラート情報を表示する', async () => {
    (adminSummaryApi.get as any).mockResolvedValue(mockSummary);

    render(
      <TestWrapper>
        <AdminSummary />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/テスト太郎/i)).toBeInTheDocument();
      expect(screen.getByText(/KPIが低い|low_kpi/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (adminSummaryApi.get as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <AdminSummary />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });

  it('データが空の場合、適切なメッセージを表示する', async () => {
    const emptySummary = {
      total_workers: 0,
      active_workers: 0,
      total_trainings: 0,
      active_trainings: 0,
      workers_with_low_kpi: 0,
      workers_with_high_errors: 0,
      alerts: [],
      summary: [],
    };
    (adminSummaryApi.get as any).mockResolvedValue(emptySummary);

    render(
      <TestWrapper>
        <AdminSummary />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/0|no data/i)).toBeInTheDocument();
    });
  });
});

