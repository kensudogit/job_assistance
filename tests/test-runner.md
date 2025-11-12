# テストランナーガイド

## 概要

このプロジェクトでは、vitestを使用してすべてのテストを実行します。
テストファイルは`__test__`フォルダに配置され、自動的に検出されます。

## テスト実行コマンド

### 基本的な実行方法

```bash
# ウォッチモードで実行（ファイル変更を監視）
npm test

# 一度だけ実行
npm run test:run

# 詳細な出力で実行
npm run test:all

# テストスイートコントローラーを実行
npm run test:suite
```

### UIモード

```bash
# ブラウザベースのUIでテストを実行
npm run test:ui
```

### カバレッジレポート

```bash
# カバレッジレポートを生成
npm run test:coverage
```

## テストファイル構成

### Components テスト (27ファイル)
```
components/__test__/
├── AdminSummary.test.tsx
├── CareerGoalManagement.test.tsx
├── CareerPathTimeline.test.tsx
├── ConstructionSimulatorManagement.test.tsx
├── EvidenceReport.test.tsx
├── IntegratedDashboard.test.tsx
├── IntegratedGrowthDashboard.test.tsx
├── JapaneseLearningRecordManagement.test.tsx
├── JapaneseProficiencyManagement.test.tsx
├── LanguageSelector.test.tsx
├── Login.test.tsx
├── ManagementPanel.test.tsx
├── MilestoneManagement.test.tsx
├── PreDepartureSupportManagement.test.tsx
├── ProgressManagement.test.tsx
├── ReplayViewer.test.tsx
├── ScreenshotCapture.test.tsx
├── ScreenshotList.test.tsx
├── SkillTrainingManagement.test.tsx
├── SpecificSkillTransitionManagement.test.tsx
├── TrainingMenuAssignment.test.tsx
├── TrainingMenuManagement.test.tsx
├── TrainingSessionDetail.test.tsx
├── UnitySimulator.test.tsx
├── UserManagement.test.tsx
├── WorkerForm.test.tsx
└── WorkerList.test.tsx
```

### Lib テスト (3ファイル)
```
lib/__test__/
├── api.test.ts
├── i18n-config.test.ts
└── mockUsers.test.ts
```

### テストコントローラー
```
tests/
├── setup.ts              # テストセットアップ
├── test-suite.ts         # テストスイート統合
├── test-controller.ts    # テスト実行制御
├── test-summary.ts       # テスト統計情報
└── run-all-tests.ts      # 全テスト実行
```

## テスト実行順序

vitestはデフォルトで並列実行しますが、以下の順序でグループ化されています：

1. **Lib テスト** - 基盤となるライブラリのテスト
2. **Components テスト** - コンポーネントのテスト

## テストカテゴリ

### 管理系
- AdminSummary
- ManagementPanel
- UserManagement
- WorkerList
- WorkerForm

### 進捗管理系
- ProgressManagement
- MilestoneManagement
- PreDepartureSupportManagement

### 訓練系
- TrainingMenuManagement
- TrainingMenuAssignment
- TrainingSessionDetail

### 日本語能力系
- JapaneseProficiencyManagement
- JapaneseLearningRecordManagement

### キャリア系
- CareerGoalManagement
- CareerPathTimeline
- SpecificSkillTransitionManagement

### シミュレーター系
- ConstructionSimulatorManagement
- UnitySimulator

### ダッシュボード系
- IntegratedDashboard
- IntegratedGrowthDashboard

### メディア系
- ScreenshotCapture
- ScreenshotList
- ReplayViewer

### 証跡系
- EvidenceReport

### 認証系
- Login
- LanguageSelector

## トラブルシューティング

### テストが実行されない場合

1. `node_modules`を再インストール
   ```bash
   npm install
   ```

2. vitestのキャッシュをクリア
   ```bash
   npm test -- --clearCache
   ```

3. テストファイルのパスを確認
   - `__test__`フォルダに配置されているか
   - ファイル名が`.test.tsx`または`.test.ts`で終わっているか

### タイムアウトエラーが発生する場合

`vitest.config.ts`の`testTimeout`を増やしてください。

### モックが正しく動作しない場合

各テストファイルで`vi.clearAllMocks()`を`beforeEach`で呼び出しているか確認してください。

