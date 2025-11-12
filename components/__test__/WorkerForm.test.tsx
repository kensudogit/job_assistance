/**
 * WorkerForm コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkerForm from '../WorkerForm';
import { workerApi } from '@/lib/api';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// i18nextの初期化
i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: {} },
    en: { translation: {} },
  },
  lng: 'ja',
  fallbackLng: 'ja',
  interpolation: { escapeValue: false },
});

// workerApiをモック化
vi.mock('@/lib/api', () => ({
  workerApi: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('WorkerForm', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('新規登録フォームが表示される', () => {
    render(
      <TestWrapper>
        <WorkerForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/名前|name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス|email/i)).toBeInTheDocument();
  });

  it('新規就労者を登録できる', async () => {
    const mockWorker = {
      id: 1,
      name: '新規太郎',
      email: 'new@example.com',
      current_status: '登録中',
    };
    (workerApi.create as any).mockResolvedValue(mockWorker);

    render(
      <TestWrapper>
        <WorkerForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/名前|name/i);
    const emailInput = screen.getByLabelText(/メールアドレス|email/i);
    const submitButton = screen.getByRole('button', { name: /登録|submit|保存/i });

    fireEvent.change(nameInput, { target: { value: '新規太郎' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(workerApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '新規太郎',
          email: 'new@example.com',
        })
      );
    });
  });

  it('既存就労者を更新できる', async () => {
    const existingWorker = {
      id: 1,
      name: '既存太郎',
      email: 'existing@example.com',
      current_status: '登録中',
    };
    const updatedWorker = { ...existingWorker, name: '更新太郎' };
    (workerApi.update as any).mockResolvedValue(updatedWorker);

    render(
      <TestWrapper>
        <WorkerForm onSuccess={mockOnSuccess} worker={existingWorker} />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/名前|name/i);
    const submitButton = screen.getByRole('button', { name: /更新|update|保存/i });

    fireEvent.change(nameInput, { target: { value: '更新太郎' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(workerApi.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: '更新太郎' }));
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    (workerApi.create as any).mockRejectedValue(new Error('登録に失敗しました'));

    render(
      <TestWrapper>
        <WorkerForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/名前|name/i);
    const emailInput = screen.getByLabelText(/メールアドレス|email/i);
    const submitButton = screen.getByRole('button', { name: /登録|submit|保存/i });

    fireEvent.change(nameInput, { target: { value: 'テスト太郎' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/登録に失敗しました|error/i)).toBeInTheDocument();
    });
  });

  it('成功時にonSuccessが呼ばれる', async () => {
    const mockWorker = {
      id: 1,
      name: '新規太郎',
      email: 'new@example.com',
    };
    (workerApi.create as any).mockResolvedValue(mockWorker);

    render(
      <TestWrapper>
        <WorkerForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const nameInput = screen.getByLabelText(/名前|name/i);
    const emailInput = screen.getByLabelText(/メールアドレス|email/i);
    const submitButton = screen.getByRole('button', { name: /登録|submit|保存/i });

    fireEvent.change(nameInput, { target: { value: '新規太郎' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});

