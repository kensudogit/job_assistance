/**
 * MilestoneManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MilestoneManagement from '../MilestoneManagement';
import { milestoneApi } from '@/lib/api';
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
  milestoneApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('MilestoneManagement', () => {
  const mockWorkerId = 1;
  const mockMilestones = [
    { id: 1, worker_id: 1, milestone_name: '日本語N3取得', milestone_type: '資格', status: '達成' },
    { id: 2, worker_id: 1, milestone_name: '訓練完了', milestone_type: '訓練', status: '未達成' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (milestoneApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <MilestoneManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('マイルストーン一覧を表示する', async () => {
    (milestoneApi.getAll as any).mockResolvedValue(mockMilestones);

    render(
      <TestWrapper>
        <MilestoneManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('日本語N3取得')).toBeInTheDocument();
      expect(screen.getByText('訓練完了')).toBeInTheDocument();
    });
  });

  it('新規マイルストーンを追加できる', async () => {
    (milestoneApi.getAll as any).mockResolvedValue(mockMilestones);
    (milestoneApi.create as any).mockResolvedValue({
      id: 3,
      worker_id: 1,
      milestone_name: '新規マイルストーン',
      milestone_type: 'その他',
      status: '未達成',
    });

    render(
      <TestWrapper>
        <MilestoneManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/マイルストーン名|name/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (milestoneApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <MilestoneManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

