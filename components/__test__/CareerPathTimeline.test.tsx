/**
 * CareerPathTimeline コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CareerPathTimeline from '../CareerPathTimeline';
import { careerPathApi } from '@/lib/api';
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
  careerPathApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('CareerPathTimeline', () => {
  const mockWorkerId = 1;
  const mockPaths = [
    {
      id: 1,
      worker_id: 1,
      path_stage: '育成就労',
      stage_start_date: '2024-01-01',
      status: '進行中',
    },
    {
      id: 2,
      worker_id: 1,
      path_stage: '特定技能1号',
      stage_start_date: '2024-12-01',
      status: '予定',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (careerPathApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <CareerPathTimeline workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('キャリアパスタイムラインを表示する', async () => {
    (careerPathApi.getAll as any).mockResolvedValue(mockPaths);

    render(
      <TestWrapper>
        <CareerPathTimeline workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/育成就労|特定技能/i)).toBeInTheDocument();
    });
  });

  it('新規キャリアパスを追加できる', async () => {
    (careerPathApi.getAll as any).mockResolvedValue(mockPaths);
    (careerPathApi.create as any).mockResolvedValue({
      id: 3,
      worker_id: 1,
      path_stage: '特定技能2号',
      stage_start_date: '2025-01-01',
      status: '予定',
    });

    render(
      <TestWrapper>
        <CareerPathTimeline workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/ステージ|stage/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (careerPathApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <CareerPathTimeline workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

