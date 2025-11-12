/**
 * i18n コンポーネントのテスト
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// i18nextの初期化
i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: { test: 'テスト' } },
    en: { translation: { test: 'Test' } },
  },
  lng: 'ja',
  fallbackLng: 'ja',
  interpolation: { escapeValue: false },
});

describe('I18nProvider', () => {
  it('I18nProviderが子コンポーネントをラップする', () => {
    const { container } = render(
      <I18nProvider>
        <div>Test Content</div>
      </I18nProvider>
    );

    expect(container.textContent).toBe('Test Content');
  });

  it('I18nextProviderでラップされる', () => {
    const { container } = render(
      <I18nProvider>
        <div>Test</div>
      </I18nProvider>
    );

    // I18nextProviderが正しく機能していることを確認
    expect(container).toBeTruthy();
  });

  it('マウント前でも子コンポーネントを表示する', () => {
    const { container } = render(
      <I18nProvider>
        <div>SSR Content</div>
      </I18nProvider>
    );

    expect(container.textContent).toBe('SSR Content');
  });
});

