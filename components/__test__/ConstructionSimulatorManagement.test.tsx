/**
 * ConstructionSimulatorManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConstructionSimulatorManagement from '../ConstructionSimulatorManagement';
import { constructionSimulatorTrainingApi } from '@/lib/api';
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
  constructionSimulatorTrainingApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../UnitySimulator', () => ({
  default: () => <div data-testid="unity-simulator">UnitySimulator</div>,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('ConstructionSimulatorManagement', () => {
  const mockWorkerId = 1;
  const mockTrainings = [
    {
      id: 1,
      worker_id: 1,
      machine_type: 'バックホー',
      training_start_date: '2024-01-01',
      status: '受講中',
      total_training_hours: 40,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (constructionSimulatorTrainingApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <ConstructionSimulatorManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('建設機械シミュレーター訓練記録一覧を表示する', async () => {
    (constructionSimulatorTrainingApi.getAll as any).mockResolvedValue(mockTrainings);

    render(
      <TestWrapper>
        <ConstructionSimulatorManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/バックホー/i)).toBeInTheDocument();
    });
  });

  it('新規訓練記録を追加できる', async () => {
    (constructionSimulatorTrainingApi.getAll as any).mockResolvedValue(mockTrainings);
    (constructionSimulatorTrainingApi.create as any).mockResolvedValue({
      id: 2,
      worker_id: 1,
      machine_type: 'ブルドーザー',
      training_start_date: '2024-02-01',
      status: '受講中',
    });

    render(
      <TestWrapper>
        <ConstructionSimulatorManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/機械タイプ|machine type/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (constructionSimulatorTrainingApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <ConstructionSimulatorManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

