/**
 * SpecificSkillTransitionManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SpecificSkillTransitionManagement from '../SpecificSkillTransitionManagement';
import { specificSkillTransitionApi } from '@/lib/api';
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
  specificSkillTransitionApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('SpecificSkillTransitionManagement', () => {
  const mockWorkerId = 1;
  const mockTransitions = [
    {
      id: 1,
      worker_id: 1,
      transition_type: '育成就労→特定技能1号',
      status: '計画中',
      target_transition_date: '2024-12-31',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (specificSkillTransitionApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <SpecificSkillTransitionManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('特定技能移行記録一覧を表示する', async () => {
    (specificSkillTransitionApi.getAll as any).mockResolvedValue(mockTransitions);

    render(
      <TestWrapper>
        <SpecificSkillTransitionManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/育成就労|特定技能/i)).toBeInTheDocument();
    });
  });

  it('新規特定技能移行記録を追加できる', async () => {
    (specificSkillTransitionApi.getAll as any).mockResolvedValue(mockTransitions);
    (specificSkillTransitionApi.create as any).mockResolvedValue({
      id: 2,
      worker_id: 1,
      transition_type: '育成就労→特定技能1号',
      status: '計画中',
    });

    render(
      <TestWrapper>
        <SpecificSkillTransitionManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/移行タイプ|transition type/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (specificSkillTransitionApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <SpecificSkillTransitionManagement workerId={mockWorkerId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

