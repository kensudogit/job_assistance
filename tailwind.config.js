/**
 * Tailwind CSS設定ファイル
 * Tailwind CSSの設定とカスタムスタイルを定義
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind CSSがクラスを検索するファイルパス
  content: [
    './index.html',                           // エントリーポイントHTML
    './src/**/*.{js,ts,jsx,tsx}',            // srcディレクトリ内のすべてのファイル
    './components/**/*.{js,ts,jsx,tsx}',     // componentsディレクトリ内のすべてのファイル
    './lib/**/*.{js,ts,jsx,tsx}',            // libディレクトリ内のすべてのファイル
  ],
  
  // テーマの拡張設定
  theme: {
    extend: {
      // カスタムカラーパレット（プライマリカラー）
      colors: {
        primary: {
          50: '#eff6ff',   // 最も薄い色
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // ベースカラー
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',  // 最も濃い色
        },
      },
      
      // カスタム背景画像（グラデーション）
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',        // 放射状グラデーション
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',  // 円錐グラデーション
        'gradient-mesh': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',  // メッシュグラデーション
        'gradient-soft': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',  // ソフトグラデーション
      },
      
      // カスタムボックスシャドウ（グロー効果）
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',      // 標準グロー効果
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',   // 大きなグロー効果
      },
      
      // カスタムアニメーション
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',              // フェードインアニメーション
        'slide-up': 'slideUp 0.5s ease-out',            // スライドアップアニメーション
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',  // スローパルスアニメーション
      },
      
      // カスタムバックドロップブラー
      backdropBlur: {
        xs: '2px',  // 極小のブラー効果
      },
    },
  },
  
  // プラグイン（現在は使用していない）
  plugins: [],
};

