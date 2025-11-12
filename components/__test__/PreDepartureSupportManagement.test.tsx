/**
 * PreDepartureSupportManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PreDepartureSupportManagement from '../PreDepartureSupportManagement';
import { preDepartureSupportApi } from '@/lib/api';
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
  preDepartureSupportApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('PreDepartureSupportManagement', () => {
  const mockWorkerId = 1;
  const mockSupports = [
    {
      id: 1,
      worker_id: 1,
      support_date: '2024-01-01',
      support_type: 'visa',
      support_content: 'ビザ申請サポート',
      status: '完了',
    },
    {
      id: 2,
      worker_id: 1,
      support_date: '2024-02-01',
      support_type: 'document',
      support_content: '書類準備サポート',
      status: '実施中',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (preDepartureSupportApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <PreDepartureSupportManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('来日前支援記録一覧を表示する', async () => {
    (preDepartureSupportApi.getAll as any).mockResolvedValue(mockSupports);

    render(
      <TestWrapper>
        <PreDepartureSupportManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/ビザ申請|visa/i)).toBeInTheDocument();
      expect(screen.getByText(/書類準備|document/i)).toBeInTheDocument();
    });
  });

  it('新規来日前支援記録を追加できる', async () => {
    (preDepartureSupportApi.getAll as any).mockResolvedValue(mockSupports);
    (preDepartureSupportApi.create as any).mockResolvedValue({
      id: 3,
      worker_id: 1,
      support_date: '2024-03-01',
      support_type: 'housing',
      support_content: '住居サポート',
      status: 'pending',
    });

    render(
      <TestWrapper>
        <PreDepartureSupportManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/支援日|support date/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (preDepartureSupportApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <PreDepartureSupportManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

