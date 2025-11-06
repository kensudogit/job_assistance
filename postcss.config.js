/**
 * PostCSS設定ファイル
 * CSSの処理設定（Tailwind CSSとAutoprefixer）
 */
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},  // Tailwind CSS v4のPostCSSプラグイン
    autoprefixer: {},            // ベンダープレフィックスを自動追加
  },
};

