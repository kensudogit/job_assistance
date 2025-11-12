/**
 * TrainingMenuAssignment コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrainingMenuAssignment from '../TrainingMenuAssignment';
import { trainingMenuApi, trainingMenuAssignmentApi } from '@/lib/api';
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
  trainingMenuApi: {
    getAll: vi.fn(),
  },
  trainingMenuAssignmentApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('TrainingMenuAssignment', () => {
  const mockWorkerId = 1;
  const mockAssignments = [
    {
      id: 1,
      worker_id: 1,
      training_menu_id: 1,
      assigned_date: '2024-01-01',
      status: '進行中',
      menu_name: '基礎訓練',
    },
  ];
  const mockMenus = [
    { id: 1, menu_name: '基礎訓練', scenario_id: 'scenario1', is_active: true },
    { id: 2, menu_name: '応用訓練', scenario_id: 'scenario2', is_active: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (trainingMenuAssignmentApi.getAll as any).mockImplementation(() => new Promise(() => {}));
    (trainingMenuApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <TrainingMenuAssignment workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('訓練メニュー割り当て一覧を表示する', async () => {
    (trainingMenuAssignmentApi.getAll as any).mockResolvedValue(mockAssignments);
    (trainingMenuApi.getAll as any).mockResolvedValue(mockMenus);

    render(
      <TestWrapper>
        <TrainingMenuAssignment workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('基礎訓練')).toBeInTheDocument();
    });
  });

  it('新規訓練メニュー割り当てを追加できる', async () => {
    (trainingMenuAssignmentApi.getAll as any).mockResolvedValue(mockAssignments);
    (trainingMenuApi.getAll as any).mockResolvedValue(mockMenus);
    (trainingMenuAssignmentApi.create as any).mockResolvedValue({
      id: 2,
      worker_id: 1,
      training_menu_id: 2,
      assigned_date: '2024-02-01',
      status: '未開始',
    });

    render(
      <TestWrapper>
        <TrainingMenuAssignment workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/割り当て日|assigned date/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (trainingMenuAssignmentApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <TrainingMenuAssignment workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

