# テスト実行順序

## 実行順序の説明

vitestはデフォルトで並列実行を行いますが、以下の順序でグループ化されています：

## Phase 1: ライブラリテスト（基盤）

1. `lib/__test__/api.test.ts` - APIクライアントの基本機能
2. `lib/__test__/i18n-config.test.ts` - i18n設定
3. `lib/__test__/mockUsers.test.ts` - モックユーザー管理

**理由**: これらのライブラリは他のコンポーネントの基盤となるため、最初に実行

## Phase 2: 基本コンポーネントテスト

4. `components/__test__/LanguageSelector.test.tsx` - 言語選択
5. `components/__test__/Login.test.tsx` - ログイン機能

**理由**: アプリケーションの基本機能

## Phase 3: 管理コンポーネントテスト

6. `components/__test__/AdminSummary.test.tsx` - 管理者サマリー
7. `components/__test__/ManagementPanel.test.tsx` - 管理パネル
8. `components/__test__/UserManagement.test.tsx` - ユーザー管理
9. `components/__test__/WorkerList.test.tsx` - 就労者一覧
10. `components/__test__/WorkerForm.test.tsx` - 就労者フォーム

**理由**: データ管理の基盤となるコンポーネント

## Phase 4: 進捗・訓練管理コンポーネントテスト

11. `components/__test__/ProgressManagement.test.tsx` - 進捗管理
12. `components/__test__/MilestoneManagement.test.tsx` - マイルストーン管理
13. `components/__test__/PreDepartureSupportManagement.test.tsx` - 来日前支援
14. `components/__test__/TrainingMenuManagement.test.tsx` - 訓練メニュー管理
15. `components/__test__/TrainingMenuAssignment.test.tsx` - 訓練メニュー割り当て
16. `components/__test__/TrainingSessionDetail.test.tsx` - 訓練セッション詳細

**理由**: 就労者の進捗と訓練を管理するコンポーネント

## Phase 5: 能力・キャリア管理コンポーネントテスト

17. `components/__test__/JapaneseProficiencyManagement.test.tsx` - 日本語能力管理
18. `components/__test__/JapaneseLearningRecordManagement.test.tsx` - 日本語学習記録
19. `components/__test__/SkillTrainingManagement.test.tsx` - 技能訓練管理
20. `components/__test__/CareerGoalManagement.test.tsx` - キャリア目標管理
21. `components/__test__/CareerPathTimeline.test.tsx` - キャリアパスタイムライン
22. `components/__test__/SpecificSkillTransitionManagement.test.tsx` - 特定技能移行管理

**理由**: 就労者の能力とキャリアを管理するコンポーネント

## Phase 6: シミュレーター・ダッシュボードコンポーネントテスト

23. `components/__test__/ConstructionSimulatorManagement.test.tsx` - 建設機械シミュレーター
24. `components/__test__/UnitySimulator.test.tsx` - Unityシミュレーター
25. `components/__test__/IntegratedDashboard.test.tsx` - 統合ダッシュボード
26. `components/__test__/IntegratedGrowthDashboard.test.tsx` - 統合成長ダッシュボード

**理由**: 統合的な機能を提供するコンポーネント

## Phase 7: メディア・証跡コンポーネントテスト

27. `components/__test__/ScreenshotCapture.test.tsx` - スクリーンショット撮影
28. `components/__test__/ScreenshotList.test.tsx` - スクリーンショット一覧
29. `components/__test__/ReplayViewer.test.tsx` - リプレイビューア
30. `components/__test__/EvidenceReport.test.tsx` - 証跡レポート

**理由**: メディアと証跡を管理するコンポーネント

## Phase 8: テストコントローラー

31. `tests/test-suite.ts` - テストスイート統合
32. `tests/test-controller.ts` - テスト実行制御
33. `tests/test-summary.ts` - テスト統計情報
34. `tests/test-master.ts` - テストマスターコントローラー

**理由**: テストの統合管理と統計情報

## 実行方法

### 全テストを順次実行
```bash
npm run test:run
```

### 特定のフェーズのみ実行
```bash
# ライブラリテストのみ
npm run test:lib

# コンポーネントテストのみ
npm run test:components
```

### テストマスターコントローラー実行
```bash
npm run test:master
```

