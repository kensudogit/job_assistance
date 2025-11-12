/**
 * TrainingSessionDetail コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrainingSessionDetail from '../TrainingSessionDetail';
import { trainingSessionApi } from '@/lib/api';
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
  trainingSessionApi: {
    getAllByWorker: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('../ReplayViewer', () => ({
  default: ({ sessionId }: { sessionId: string }) => (
    <div data-testid="replay-viewer">ReplayViewer: {sessionId}</div>
  ),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('TrainingSessionDetail', () => {
  const mockWorkerId = 1;
  const mockSessions = [
    {
      session_id: 'session1',
      worker_id: 1,
      session_start_time: '2024-01-01T10:00:00Z',
      status: 'completed',
      duration_seconds: 3600,
    },
    {
      session_id: 'session2',
      worker_id: 1,
      session_start_time: '2024-01-02T10:00:00Z',
      status: 'completed',
      duration_seconds: 7200,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (trainingSessionApi.getAllByWorker as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <TrainingSessionDetail workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('訓練セッション一覧を表示する', async () => {
    (trainingSessionApi.getAllByWorker as any).mockResolvedValue(mockSessions);

    render(
      <TestWrapper>
        <TrainingSessionDetail workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/session1|session2/i)).toBeInTheDocument();
    });
  });

  it('セッションを選択すると詳細を表示する', async () => {
    (trainingSessionApi.getAllByWorker as any).mockResolvedValue(mockSessions);
    (trainingSessionApi.getById as any).mockResolvedValue({
      ...mockSessions[0],
      kpi: { overall_score: 85 },
    });

    render(
      <TestWrapper>
        <TrainingSessionDetail workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/session1/i)).toBeInTheDocument();
    });

    const sessionButton = screen.getByText(/session1/i);
    fireEvent.click(sessionButton);

    await waitFor(() => {
      expect(trainingSessionApi.getById).toHaveBeenCalledWith('session1');
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (trainingSessionApi.getAllByWorker as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <TrainingSessionDetail workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

