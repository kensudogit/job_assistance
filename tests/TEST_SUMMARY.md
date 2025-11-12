# テストサマリー

## テストファイル一覧

### Components テスト (27ファイル)

#### 管理系コンポーネント (5ファイル)
- ✅ `AdminSummary.test.tsx` - 管理者向けサマリー
- ✅ `ManagementPanel.test.tsx` - 管理パネル
- ✅ `UserManagement.test.tsx` - ユーザー管理
- ✅ `WorkerList.test.tsx` - 就労者一覧
- ✅ `WorkerForm.test.tsx` - 就労者フォーム

#### 進捗管理系コンポーネント (3ファイル)
- ✅ `ProgressManagement.test.tsx` - 進捗管理
- ✅ `MilestoneManagement.test.tsx` - マイルストーン管理
- ✅ `PreDepartureSupportManagement.test.tsx` - 来日前支援管理

#### 訓練系コンポーネント (3ファイル)
- ✅ `TrainingMenuManagement.test.tsx` - 訓練メニュー管理
- ✅ `TrainingMenuAssignment.test.tsx` - 訓練メニュー割り当て
- ✅ `TrainingSessionDetail.test.tsx` - 訓練セッション詳細

#### 日本語能力系コンポーネント (2ファイル)
- ✅ `JapaneseProficiencyManagement.test.tsx` - 日本語能力管理
- ✅ `JapaneseLearningRecordManagement.test.tsx` - 日本語学習記録管理

#### キャリア系コンポーネント (3ファイル)
- ✅ `CareerGoalManagement.test.tsx` - キャリア目標管理
- ✅ `CareerPathTimeline.test.tsx` - キャリアパスタイムライン
- ✅ `SpecificSkillTransitionManagement.test.tsx` - 特定技能移行管理

#### シミュレーター系コンポーネント (2ファイル)
- ✅ `ConstructionSimulatorManagement.test.tsx` - 建設機械シミュレーター管理
- ✅ `UnitySimulator.test.tsx` - Unityシミュレーター

#### ダッシュボード系コンポーネント (2ファイル)
- ✅ `IntegratedDashboard.test.tsx` - 統合ダッシュボード
- ✅ `IntegratedGrowthDashboard.test.tsx` - 統合成長ダッシュボード

#### メディア系コンポーネント (3ファイル)
- ✅ `ScreenshotCapture.test.tsx` - スクリーンショット撮影
- ✅ `ScreenshotList.test.tsx` - スクリーンショット一覧
- ✅ `ReplayViewer.test.tsx` - リプレイビューア

#### 証跡系コンポーネント (1ファイル)
- ✅ `EvidenceReport.test.tsx` - 証跡レポート

#### 認証系コンポーネント (2ファイル)
- ✅ `Login.test.tsx` - ログイン
- ✅ `LanguageSelector.test.tsx` - 言語選択

### Lib テスト (3ファイル)
- ✅ `api.test.ts` - APIクライアント
- ✅ `i18n-config.test.ts` - i18n設定
- ✅ `mockUsers.test.ts` - モックユーザー

### テストコントローラー (4ファイル)
- ✅ `test-suite.ts` - テストスイート統合
- ✅ `test-controller.ts` - テスト実行制御
- ✅ `test-summary.ts` - テスト統計情報
- ✅ `test-index.ts` - テストインデックス

## 合計
- **Components テスト**: 27ファイル
- **Lib テスト**: 3ファイル
- **テストコントローラー**: 4ファイル
- **総計**: 34テストファイル

## テスト実行コマンド

```bash
# すべてのテストを実行
npm test
npm run test:run

# 詳細な出力で実行
npm run test:all

# コンポーネントテストのみ
npm run test:components

# ライブラリテストのみ
npm run test:lib

# テストスイートコントローラー
npm run test:suite

# テスト統計情報
npm run test:summary

# UIモード
npm run test:ui

# カバレッジレポート
npm run test:coverage
```

