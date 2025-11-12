/**
 * SkillTrainingManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SkillTrainingManagement from '../SkillTrainingManagement';
import { skillTrainingApi } from '@/lib/api';
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
  skillTrainingApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('SkillTrainingManagement', () => {
  const mockWorkerId = 1;
  const mockTrainings = [
    {
      id: 1,
      worker_id: 1,
      skill_category: 'construction',
      skill_name: '油圧ショベル操作',
      training_start_date: '2024-01-01',
      status: '受講中',
      training_hours: 40,
    },
    {
      id: 2,
      worker_id: 1,
      skill_category: 'construction',
      skill_name: 'ブルドーザー操作',
      training_start_date: '2024-02-01',
      status: '完了',
      training_hours: 60,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (skillTrainingApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <SkillTrainingManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('技能訓練記録一覧を表示する', async () => {
    (skillTrainingApi.getAll as any).mockResolvedValue(mockTrainings);

    render(
      <TestWrapper>
        <SkillTrainingManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/油圧ショベル|ブルドーザー/i)).toBeInTheDocument();
    });
  });

  it('新規技能訓練記録を追加できる', async () => {
    (skillTrainingApi.getAll as any).mockResolvedValue(mockTrainings);
    (skillTrainingApi.create as any).mockResolvedValue({
      id: 3,
      worker_id: 1,
      skill_category: 'construction',
      skill_name: '新規技能',
      training_start_date: '2024-03-01',
      status: '受講中',
      training_hours: 0,
    });

    render(
      <TestWrapper>
        <SkillTrainingManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/技能名|skill name/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (skillTrainingApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <SkillTrainingManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

