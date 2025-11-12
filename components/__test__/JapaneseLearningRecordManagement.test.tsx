/**
 * JapaneseLearningRecordManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JapaneseLearningRecordManagement from '../JapaneseLearningRecordManagement';
import { japaneseLearningApi } from '@/lib/api';
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
  japaneseLearningApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('JapaneseLearningRecordManagement', () => {
  const mockWorkerId = 1;
  const mockRecords = [
    {
      id: 1,
      worker_id: 1,
      learning_date: '2024-01-01',
      learning_type: 'classroom',
      learning_content: '日本語基礎',
      duration_minutes: 60,
    },
    {
      id: 2,
      worker_id: 1,
      learning_date: '2024-01-02',
      learning_type: 'online',
      learning_content: '日本語応用',
      duration_minutes: 90,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (japaneseLearningApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <JapaneseLearningRecordManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('日本語学習記録一覧を表示する', async () => {
    (japaneseLearningApi.getAll as any).mockResolvedValue(mockRecords);

    render(
      <TestWrapper>
        <JapaneseLearningRecordManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/日本語基礎|日本語応用/i)).toBeInTheDocument();
    });
  });

  it('新規日本語学習記録を追加できる', async () => {
    (japaneseLearningApi.getAll as any).mockResolvedValue(mockRecords);
    (japaneseLearningApi.create as any).mockResolvedValue({
      id: 3,
      worker_id: 1,
      learning_date: '2024-01-03',
      learning_type: 'classroom',
      learning_content: '新規学習',
      duration_minutes: 60,
    });

    render(
      <TestWrapper>
        <JapaneseLearningRecordManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/学習日|learning date/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (japaneseLearningApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <JapaneseLearningRecordManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

