/**
 * Vitest設定ファイル
 * テストフレームワーク（Vitest）の設定を定義
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Reactプラグインを有効化
  plugins: [react()],
  
  // テスト設定
  test: {
    globals: true,                    // グローバルAPIを有効化（describe, it, expectなど）
    environment: 'jsdom',             // DOM環境をシミュレート（ブラウザ環境）
    setupFiles: './tests/setup.ts',   // テスト実行前に読み込むセットアップファイル
    css: true,                        // CSSファイルをテストでインポート可能にする
  },
  
  // パスエイリアスの設定（Viteと同じ設定）
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),              // プロジェクトルート
      '@components': path.resolve(__dirname, './components'),  // コンポーネントディレクトリ
      '@lib': path.resolve(__dirname, './lib'),        // ライブラリディレクトリ
    },
  },
});

