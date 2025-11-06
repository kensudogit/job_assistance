/**
 * アプリケーションエントリーポイント
 * ReactアプリケーションをDOMにマウントする
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { I18nProvider } from '../lib/i18n';

// root要素を取得してReactアプリケーションをマウント
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 国際化（i18n）プロバイダーでアプリをラップ */}
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>,
);

