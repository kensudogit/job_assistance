/**
 * TrainingMenuManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrainingMenuManagement from '../TrainingMenuManagement';
import { trainingMenuApi } from '@/lib/api';
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
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('TrainingMenuManagement', () => {
  const mockMenus = [
    {
      id: 1,
      menu_name: '基礎訓練',
      scenario_id: 'scenario1',
      equipment_type: '油圧ショベル',
      difficulty_level: '初級',
      is_active: true,
    },
    {
      id: 2,
      menu_name: '応用訓練',
      scenario_id: 'scenario2',
      equipment_type: 'ブルドーザー',
      difficulty_level: '中級',
      is_active: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (trainingMenuApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <TrainingMenuManagement />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('訓練メニュー一覧を表示する', async () => {
    (trainingMenuApi.getAll as any).mockResolvedValue(mockMenus);

    render(
      <TestWrapper>
        <TrainingMenuManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('基礎訓練')).toBeInTheDocument();
      expect(screen.getByText('応用訓練')).toBeInTheDocument();
    });
  });

  it('新規訓練メニューを追加できる', async () => {
    (trainingMenuApi.getAll as any).mockResolvedValue(mockMenus);
    (trainingMenuApi.create as any).mockResolvedValue({
      id: 3,
      menu_name: '新規訓練',
      scenario_id: 'scenario3',
      equipment_type: '油圧ショベル',
      difficulty_level: '初級',
      is_active: true,
    });

    render(
      <TestWrapper>
        <TrainingMenuManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/メニュー名|menu name/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (trainingMenuApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <TrainingMenuManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

