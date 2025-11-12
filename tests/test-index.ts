/**
 * テストインデックスファイル
 * すべてのテストを一元的に管理し、実行順序を制御
 * 
 * このファイルは、全テストスイートのエントリーポイントとして機能します。
 * vitestは自動的にテストを検出しますが、このファイルで明示的に管理できます。
 */

// テストスイートのインポート（実際のテストファイルは自動検出されるため、コメントアウト）
// 必要に応じて、特定のテストのみを実行する場合に使用

/**
 * テスト実行モード
 * - 'all': すべてのテストを実行（デフォルト）
 * - 'components': コンポーネントテストのみ
 * - 'lib': ライブラリテストのみ
 * - 'suite': テストスイートコントローラーのみ
 */
export const TEST_MODE = process.env.TEST_MODE || 'all';

/**
 * テスト実行設定
 */
export const TEST_CONFIG = {
  components: {
    enabled: TEST_MODE === 'all' || TEST_MODE === 'components',
    path: 'components/__test__',
    count: 27,
  },
  lib: {
    enabled: TEST_MODE === 'all' || TEST_MODE === 'lib',
    path: 'lib/__test__',
    count: 3,
  },
  suite: {
    enabled: TEST_MODE === 'suite',
    path: 'tests',
    files: ['test-suite.ts', 'test-controller.ts', 'test-summary.ts'],
  },
};

/**
 * テスト統計情報を取得
 */
export function getTestStatistics() {
  return {
    total: TEST_CONFIG.components.count + TEST_CONFIG.lib.count,
    components: TEST_CONFIG.components.count,
    lib: TEST_CONFIG.lib.count,
    mode: TEST_MODE,
  };
}

