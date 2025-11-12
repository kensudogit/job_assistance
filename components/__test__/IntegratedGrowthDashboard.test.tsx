/**
 * IntegratedGrowthDashboard コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import IntegratedGrowthDashboard from '../IntegratedGrowthDashboard';
import { integratedGrowthApi, japaneseProficiencyApi, skillTrainingApi, constructionSimulatorTrainingApi } from '@/lib/api';
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
  integratedGrowthApi: {
    getAll: vi.fn(),
  },
  japaneseProficiencyApi: {
    getAll: vi.fn(),
  },
  skillTrainingApi: {
    getAll: vi.fn(),
  },
  constructionSimulatorTrainingApi: {
    getAll: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('IntegratedGrowthDashboard', () => {
  const mockWorkerId = 1;
  const mockGrowths = [
    {
      id: 1,
      worker_id: 1,
      assessment_date: '2024-01-01',
      japanese_level: 'N3',
      japanese_score: 75,
      skill_level: '中級',
      skill_score: 80,
      overall_growth_score: 77.5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (integratedGrowthApi.getAll as any).mockImplementation(() => new Promise(() => {}));
    (japaneseProficiencyApi.getAll as any).mockResolvedValue([]);
    (skillTrainingApi.getAll as any).mockResolvedValue([]);
    (constructionSimulatorTrainingApi.getAll as any).mockResolvedValue([]);

    render(
      <TestWrapper>
        <IntegratedGrowthDashboard workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('統合成長データを表示する', async () => {
    (integratedGrowthApi.getAll as any).mockResolvedValue(mockGrowths);
    (japaneseProficiencyApi.getAll as any).mockResolvedValue([]);
    (skillTrainingApi.getAll as any).mockResolvedValue([]);
    (constructionSimulatorTrainingApi.getAll as any).mockResolvedValue([]);

    render(
      <TestWrapper>
        <IntegratedGrowthDashboard workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/N3|成長|growth/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (integratedGrowthApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <IntegratedGrowthDashboard workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

