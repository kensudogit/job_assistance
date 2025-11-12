/**
 * WorkerList コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkerList from '../WorkerList';
import { workerApi } from '@/lib/api';
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

// workerApiをモック化
vi.mock('@/lib/api', () => ({
  workerApi: {
    getAll: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('WorkerList', () => {
  const mockOnSelectWorker = vi.fn();
  const mockWorkers = [
    { id: 1, name: 'テスト太郎', email: 'test1@example.com', current_status: '登録中' },
    { id: 2, name: 'テスト花子', email: 'test2@example.com', current_status: '訓練中' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (workerApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <WorkerList onSelectWorker={mockOnSelectWorker} selectedWorker={null} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('就労者一覧を表示する', async () => {
    (workerApi.getAll as any).mockResolvedValue(mockWorkers);

    render(
      <TestWrapper>
        <WorkerList onSelectWorker={mockOnSelectWorker} selectedWorker={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('テスト太郎')).toBeInTheDocument();
      expect(screen.getByText('テスト花子')).toBeInTheDocument();
    });
  });

  it('就労者をクリックするとonSelectWorkerが呼ばれる', async () => {
    (workerApi.getAll as any).mockResolvedValue(mockWorkers);

    render(
      <TestWrapper>
        <WorkerList onSelectWorker={mockOnSelectWorker} selectedWorker={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('テスト太郎')).toBeInTheDocument();
    });

    const workerCard = screen.getByText('テスト太郎').closest('div');
    if (workerCard) {
      fireEvent.click(workerCard);
      expect(mockOnSelectWorker).toHaveBeenCalledWith(1);
    }
  });

  it('選択された就労者がハイライト表示される', async () => {
    (workerApi.getAll as any).mockResolvedValue(mockWorkers);

    render(
      <TestWrapper>
        <WorkerList onSelectWorker={mockOnSelectWorker} selectedWorker={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('テスト太郎')).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (workerApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <WorkerList onSelectWorker={mockOnSelectWorker} selectedWorker={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });

  it('再読み込みボタンでデータを再取得する', async () => {
    (workerApi.getAll as any).mockResolvedValue(mockWorkers);

    render(
      <TestWrapper>
        <WorkerList onSelectWorker={mockOnSelectWorker} selectedWorker={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('テスト太郎')).toBeInTheDocument();
    });

    const reloadButton = screen.getByText(/再読み込み|reload|更新/i);
    fireEvent.click(reloadButton);

    await waitFor(() => {
      expect(workerApi.getAll).toHaveBeenCalledTimes(2);
    });
  });

  it('就労者が0件の場合、空のメッセージを表示する', async () => {
    (workerApi.getAll as any).mockResolvedValue([]);

    render(
      <TestWrapper>
        <WorkerList onSelectWorker={mockOnSelectWorker} selectedWorker={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/就労者がいません|no workers/i)).toBeInTheDocument();
    });
  });
});

