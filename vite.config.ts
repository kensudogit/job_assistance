/**
 * Vite設定ファイル
 * フロントエンドのビルドツール（Vite）の設定を定義
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Moduleで__dirnameを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  // Reactプラグインを有効化
  plugins: [react()],
  
  // パスエイリアスの設定（@/ でプロジェクトルートを参照）
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),              // プロジェクトルート
      '@components': path.resolve(__dirname, './components'),  // コンポーネントディレクトリ
      '@lib': path.resolve(__dirname, './lib'),        // ライブラリディレクトリ
    },
  },
  
  // 開発サーバーの設定
  server: {
    port: 3000,  // 開発サーバーのポート番号
    proxy: {
      // APIリクエストをバックエンドにプロキシ
      '/api': {
        target: 'http://localhost:5000',  // バックエンドAPIのURL
        changeOrigin: true,  // オリジンを変更
      },
    },
  },
  
  // ビルド設定
  build: {
    outDir: 'dist',          // 出力ディレクトリ
    sourcemap: false,        // ソースマップを無効化（本番環境）
    minify: 'esbuild',       // ミニファイにesbuildを使用
    emptyOutDir: true,       // 出力ディレクトリをクリア
  },
  // ベースパス（Vercelではルートパスを使用）
  base: '/',
});

