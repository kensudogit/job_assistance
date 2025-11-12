/**
 * Login コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../Login';
import { authApi } from '@/lib/api';
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

// authApiをモック化
vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

describe('Login', () => {
  const mockOnLoginSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ログインフォームが表示される', () => {
    render(
      <TestWrapper>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText(/ユーザー名|username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/パスワード|password/i)).toBeInTheDocument();
  });

  it('ログインが成功するとonLoginSuccessが呼ばれる', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'trainee' };
    (authApi.login as any).mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </TestWrapper>
    );

    const usernameInput = screen.getByPlaceholderText(/ユーザー名|username/i);
    const passwordInput = screen.getByPlaceholderText(/パスワード|password/i);
    const submitButton = screen.getByRole('button', { name: /ログイン|login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockUser);
    });
  });

  it('ログインエラー時にエラーメッセージを表示する', async () => {
    (authApi.login as any).mockRejectedValue(new Error('ログインに失敗しました'));

    render(
      <TestWrapper>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </TestWrapper>
    );

    const usernameInput = screen.getByPlaceholderText(/ユーザー名|username/i);
    const passwordInput = screen.getByPlaceholderText(/パスワード|password/i);
    const submitButton = screen.getByRole('button', { name: /ログイン|login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/ログインに失敗しました|error/i)).toBeInTheDocument();
    });
  });

  it('新規登録モードに切り替えられる', () => {
    render(
      <TestWrapper>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </TestWrapper>
    );

    const registerButton = screen.getByText(/新規登録|register/i);
    fireEvent.click(registerButton);

    expect(screen.getByPlaceholderText(/メールアドレス|email/i)).toBeInTheDocument();
  });

  it('新規登録が成功する', async () => {
    const mockUser = { id: 1, username: 'newuser', email: 'new@example.com', role: 'trainee' };
    (authApi.register as any).mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </TestWrapper>
    );

    // 新規登録モードに切り替え
    const registerButton = screen.getByText(/新規登録|register/i);
    fireEvent.click(registerButton);

    const usernameInput = screen.getByPlaceholderText(/ユーザー名|username/i);
    const emailInput = screen.getByPlaceholderText(/メールアドレス|email/i);
    const passwordInput = screen.getByPlaceholderText(/パスワード|password/i);
    const submitButton = screen.getByRole('button', { name: /登録|register/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });
    });
  });

  it('MFAコード入力が表示される', async () => {
    const mfaError = new Error('MFA code is required');
    (mfaError as any).mfa_required = true;
    (authApi.login as any).mockRejectedValue(mfaError);

    render(
      <TestWrapper>
        <Login onLoginSuccess={mockOnLoginSuccess} />
      </TestWrapper>
    );

    const usernameInput = screen.getByPlaceholderText(/ユーザー名|username/i);
    const passwordInput = screen.getByPlaceholderText(/パスワード|password/i);
    const submitButton = screen.getByRole('button', { name: /ログイン|login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/MFA|認証コード/i)).toBeInTheDocument();
    });
  });
});

