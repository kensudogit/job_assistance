/**
 * ProgressManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProgressManagement from '../ProgressManagement';
import { progressApi, workerApi } from '@/lib/api';
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

// APIをモック化
vi.mock('@/lib/api', () => ({
  progressApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  workerApi: {
    getById: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('ProgressManagement', () => {
  const mockWorkerId = 1;
  const mockWorker = {
    id: 1,
    name: 'テスト太郎',
    email: 'test@example.com',
  };
  const mockProgressList = [
    {
      id: 1,
      worker_id: 1,
      progress_date: '2024-01-01',
      progress_type: '面接',
      title: '面接実施',
      status: '完了',
    },
    {
      id: 2,
      worker_id: 1,
      progress_date: '2024-01-02',
      progress_type: '訓練',
      title: '訓練開始',
      status: '実施中',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (workerApi.getById as any).mockImplementation(() => new Promise(() => {}));
    (progressApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <ProgressManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('進捗一覧を表示する', async () => {
    (workerApi.getById as any).mockResolvedValue(mockWorker);
    (progressApi.getAll as any).mockResolvedValue(mockProgressList);

    render(
      <TestWrapper>
        <ProgressManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('面接実施')).toBeInTheDocument();
      expect(screen.getByText('訓練開始')).toBeInTheDocument();
    });
  });

  it('新規進捗追加ボタンが表示される', async () => {
    (workerApi.getById as any).mockResolvedValue(mockWorker);
    (progressApi.getAll as any).mockResolvedValue(mockProgressList);

    render(
      <TestWrapper>
        <ProgressManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });
  });

  it('新規進捗を追加できる', async () => {
    (workerApi.getById as any).mockResolvedValue(mockWorker);
    (progressApi.getAll as any).mockResolvedValue(mockProgressList);
    (progressApi.create as any).mockResolvedValue({
      id: 3,
      worker_id: 1,
      progress_date: '2024-01-03',
      progress_type: '面接',
      status: '実施中',
    });

    render(
      <TestWrapper>
        <ProgressManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/進捗日付|date/i)).toBeInTheDocument();
    });
  });

  it('進捗を削除できる', async () => {
    (workerApi.getById as any).mockResolvedValue(mockWorker);
    (progressApi.getAll as any).mockResolvedValue(mockProgressList);
    (progressApi.delete as any).mockResolvedValue(undefined);
    window.confirm = vi.fn(() => true);

    render(
      <TestWrapper>
        <ProgressManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('面接実施')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/削除|delete/i);
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      await waitFor(() => {
        expect(progressApi.delete).toHaveBeenCalled();
      });
    }
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (workerApi.getById as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <ProgressManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });

  it('workerIdが変更されるとデータを再取得する', async () => {
    (workerApi.getById as any).mockResolvedValue(mockWorker);
    (progressApi.getAll as any).mockResolvedValue(mockProgressList);

    const { rerender } = render(
      <TestWrapper>
        <ProgressManagement workerId={1} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(workerApi.getById).toHaveBeenCalledWith(1);
    });

    rerender(
      <TestWrapper>
        <ProgressManagement workerId={2} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(workerApi.getById).toHaveBeenCalledWith(2);
    });
  });
});

