/**
 * i18n-config のテスト
 */
import { describe, it, expect } from 'vitest';
import i18n from '../i18n-config';

describe('i18n-config', () => {
  it('i18nインスタンスが作成される', () => {
    expect(i18n).toBeDefined();
    expect(i18n.isInitialized).toBe(true);
  });

  it('デフォルト言語が日本語である', () => {
    expect(i18n.language).toBe('ja');
  });

  it('フォールバック言語が日本語である', () => {
    expect(i18n.options.fallbackLng).toBe('ja');
  });

  it('複数の言語リソースが読み込まれる', () => {
    const resources = i18n.options.resources;
    expect(resources).toBeDefined();
    expect(resources?.ja).toBeDefined();
    expect(resources?.en).toBeDefined();
  });
});

