/**
 * ReplayViewer コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReplayViewer from '../ReplayViewer';
import { replayApi } from '@/lib/api';
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
  replayApi: {
    get: vi.fn(),
  },
}));

vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('ReplayViewer', () => {
  const mockSessionId = 'session1';
  const mockReplayData = {
    session_id: 'session1',
    worker_id: 1,
    session_start_time: '2024-01-01T10:00:00Z',
    session_end_time: '2024-01-01T11:00:00Z',
    duration_seconds: 3600,
    operation_logs: [
      {
        timestamp: '2024-01-01T10:00:00Z',
        operation_type: 'start',
        event_type: 'operation',
      },
    ],
    kpi_scores: {
      overall_score: 85,
      safety_score: 90,
      error_count: 2,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (replayApi.get as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <ReplayViewer sessionId={mockSessionId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('リプレイデータを表示する', async () => {
    (replayApi.get as any).mockResolvedValue(mockReplayData);

    render(
      <TestWrapper>
        <ReplayViewer sessionId={mockSessionId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/85|overall score/i)).toBeInTheDocument();
    });
  });

  it('再生ボタンが表示される', async () => {
    (replayApi.get as any).mockResolvedValue(mockReplayData);

    render(
      <TestWrapper>
        <ReplayViewer sessionId={mockSessionId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/再生|play/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (replayApi.get as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <ReplayViewer sessionId={mockSessionId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

