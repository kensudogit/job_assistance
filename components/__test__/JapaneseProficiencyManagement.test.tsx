/**
 * JapaneseProficiencyManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JapaneseProficiencyManagement from '../JapaneseProficiencyManagement';
import { japaneseProficiencyApi } from '@/lib/api';
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
  japaneseProficiencyApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('JapaneseProficiencyManagement', () => {
  const mockWorkerId = 1;
  const mockProficiencies = [
    {
      id: 1,
      worker_id: 1,
      test_date: '2024-01-01',
      test_type: 'JLPT',
      level: 'N3',
      total_score: 120,
      passed: true,
    },
    {
      id: 2,
      worker_id: 1,
      test_date: '2024-02-01',
      test_type: 'JLPT',
      level: 'N2',
      total_score: 90,
      passed: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (japaneseProficiencyApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <JapaneseProficiencyManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('日本語能力記録一覧を表示する', async () => {
    (japaneseProficiencyApi.getAll as any).mockResolvedValue(mockProficiencies);

    render(
      <TestWrapper>
        <JapaneseProficiencyManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/JLPT|N3|N2/i)).toBeInTheDocument();
    });
  });

  it('新規日本語能力記録を追加できる', async () => {
    (japaneseProficiencyApi.getAll as any).mockResolvedValue(mockProficiencies);
    (japaneseProficiencyApi.create as any).mockResolvedValue({
      id: 3,
      worker_id: 1,
      test_date: '2024-03-01',
      test_type: 'JLPT',
      level: 'N1',
      passed: false,
    });

    render(
      <TestWrapper>
        <JapaneseProficiencyManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/試験日|test date/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (japaneseProficiencyApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <JapaneseProficiencyManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

