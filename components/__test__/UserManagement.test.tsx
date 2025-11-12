/**
 * UserManagement コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagement from '../UserManagement';
import { userApi, workerApi } from '@/lib/api';
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
  userApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
  workerApi: {
    getAll: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('UserManagement', () => {
  const mockUsers = [
    { id: 1, username: 'admin', email: 'admin@example.com', role: 'administrator' },
    { id: 2, username: 'user1', email: 'user1@example.com', role: 'trainee' },
  ];
  const mockWorkers = [
    { id: 1, name: 'テスト太郎', email: 'test@example.com' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ローディング状態を表示する', () => {
    (userApi.getAll as any).mockImplementation(() => new Promise(() => {}));
    (workerApi.getAll as any).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <UserManagement />
      </TestWrapper>
    );

    expect(screen.getByText(/Loading|読み込み中/i)).toBeInTheDocument();
  });

  it('ユーザー一覧を表示する', async () => {
    (userApi.getAll as any).mockResolvedValue(mockUsers);
    (workerApi.getAll as any).mockResolvedValue(mockWorkers);

    render(
      <TestWrapper>
        <UserManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
  });

  it('新規ユーザーを作成できる', async () => {
    (userApi.getAll as any).mockResolvedValue(mockUsers);
    (workerApi.getAll as any).mockResolvedValue(mockWorkers);
    (userApi.create as any).mockResolvedValue({
      id: 3,
      username: 'newuser',
      email: 'new@example.com',
      role: 'trainee',
    });

    render(
      <TestWrapper>
        <UserManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/追加|add|新規/i)).toBeInTheDocument();
    });

    const addButton = screen.getByText(/追加|add|新規/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/ユーザー名|username/i)).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (userApi.getAll as any).mockRejectedValue(new Error('取得に失敗しました'));

    render(
      <TestWrapper>
        <UserManagement />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/取得に失敗しました|Error/i)).toBeInTheDocument();
    });
  });
});

