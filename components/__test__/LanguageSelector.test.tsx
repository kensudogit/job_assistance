/**
 * LanguageSelector コンポーネントのテスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageSelector from '../LanguageSelector';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// i18nextの初期化
i18n
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: {} },
      en: { translation: {} },
      zh: { translation: {} },
      vi: { translation: {} },
    },
    lng: 'ja',
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('言語選択ドロップダウンを表示する', () => {
    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('すべての言語オプションを表示する', () => {
    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    expect(screen.getByText(/🇯🇵 日本語/)).toBeInTheDocument();
    expect(screen.getByText(/🇺🇸 English/)).toBeInTheDocument();
    expect(screen.getByText(/🇨🇳 中文/)).toBeInTheDocument();
    expect(screen.getByText(/🇻🇳 Tiếng Việt/)).toBeInTheDocument();
  });

  it('言語を変更すると、i18nの言語が変更される', async () => {
    const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');

    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });

    await waitFor(() => {
      expect(changeLanguageSpy).toHaveBeenCalledWith('en');
    });
  });

  it('デフォルトで日本語が選択されている', async () => {
    // i18nの言語をリセット
    await i18n.changeLanguage('ja');

    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    await waitFor(() => {
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('ja');
    });
  });
});

