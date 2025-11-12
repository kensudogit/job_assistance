/**
 * CareerGoalManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CareerGoalManagement from '../CareerGoalManagement';
import { careerGoalApi } from '@/lib/api';
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
  careerGoalApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('CareerGoalManagement', () => {
  const mockWorkerId = 1;
  const mockGoals = [
    {
      id: 1,
      worker_id: 1,
      goal_name: '日本語N2取得',
      goal_category: '日本語',
      status: '進行中',
      current_progress: 50,
    },
    {
      id: 2,
      worker_id: 1,
      goal_name: '技能訓練完了',
      goal_category: '技能',
      status: '完了',
      current_progress: 100,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (careerGoalApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <CareerGoalManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('キャリア目標一覧を表示する', async () => {
    (careerGoalApi.getAll as any).mockResolvedValue(mockGoals);

    render(
      <TestWrapper>
        <CareerGoalManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('日本語N2取得')).toBeInTheDocument();
      expect(screen.getByText('技能訓練完了')).toBeInTheDocument();
    });
  });

  it('新規キャリア目標を追加できる', async () => {
    (careerGoalApi.getAll as any).mockResolvedValue(mockGoals);
    (careerGoalApi.create as any).mockResolvedValue({
      id: 3,
      worker_id: 1,
      goal_name: '新規目標',
      goal_category: 'その他',
      status: '進行中',
      current_progress: 0,
    });

    render(
      <TestWrapper>
        <CareerGoalManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/目標名|goal name/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (careerGoalApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <CareerGoalManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

