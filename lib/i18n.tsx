/**
 * 国際化（i18n）プロバイダーコンポーネント
 * アプリケーション全体に多言語対応を提供
 */
'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n-config';

/**
 * I18nProviderコンポーネント
 * i18nextプロバイダーでアプリケーションをラップし、多言語対応を有効化
 * 
 * @param children - 子コンポーネント
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  // マウント状態を管理（SSR対応）
  const [mounted, setMounted] = useState(false);

  // コンポーネントマウント時にマウント状態を更新
  useEffect(() => {
    setMounted(true);
  }, []);

  // マウント前は子コンポーネントをそのまま返す（SSR対応）
  if (!mounted) {
    return <>{children}</>;
  }

  // i18nextプロバイダーでラップ
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

