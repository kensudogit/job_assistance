/**
 * Vitest設定ファイル
 * テストフレームワーク（Vitest）の設定を定義
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Moduleで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Reactプラグインを有効化
  plugins: [react()],
  
  // テスト設定
  test: {
    globals: true,                    // グローバルAPIを有効化（describe, it, expectなど）
    environment: 'jsdom',             // DOM環境をシミュレート（ブラウザ環境）
    setupFiles: './tests/setup.ts',   // テスト実行前に読み込むセットアップファイル
    css: true,                        // CSSファイルをテストでインポート可能にする
    include: [
      '**/__test__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', // testsフォルダ内のテストも検索
    ],                                // __test__フォルダと通常のテストファイルを検索
    testTimeout: 10000,               // テストのタイムアウト時間（10秒）
    hookTimeout: 10000,               // フックのタイムアウト時間（10秒）
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

