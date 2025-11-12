# テストスイート

このディレクトリには、プロジェクト全体のテストを管理するファイルが含まれています。

## ファイル構成

- `setup.ts` - テスト実行前のセットアップファイル
- `test-suite.ts` - 全テストスイート統合コントローラー
- `test-controller.ts` - テスト実行制御ファイル
- `run-all-tests.ts` - 全テスト実行コントローラー

## テスト実行方法

### すべてのテストを実行
```bash
npm test
# または
npm run test:run
```

### 詳細な出力で実行
```bash
npm run test:all
```

### テストスイートコントローラーを実行
```bash
npm run test:suite
```

### カバレッジレポートを生成
```bash
npm run test:coverage
```

### UIモードで実行
```bash
npm run test:ui
```

## テストファイルの配置

- `components/__test__/` - コンポーネントのテストファイル
- `lib/__test__/` - ライブラリのテストファイル

## テストスイート一覧

### Components テスト (27ファイル)
- AdminSummary.test.tsx
- CareerGoalManagement.test.tsx
- CareerPathTimeline.test.tsx
- ConstructionSimulatorManagement.test.tsx
- EvidenceReport.test.tsx
- IntegratedDashboard.test.tsx
- IntegratedGrowthDashboard.test.tsx
- JapaneseLearningRecordManagement.test.tsx
- JapaneseProficiencyManagement.test.tsx
- LanguageSelector.test.tsx
- Login.test.tsx
- ManagementPanel.test.tsx
- MilestoneManagement.test.tsx
- PreDepartureSupportManagement.test.tsx
- ProgressManagement.test.tsx
- ReplayViewer.test.tsx
- ScreenshotCapture.test.tsx
- ScreenshotList.test.tsx
- SkillTrainingManagement.test.tsx
- SpecificSkillTransitionManagement.test.tsx
- TrainingMenuAssignment.test.tsx
- TrainingMenuManagement.test.tsx
- TrainingSessionDetail.test.tsx
- UnitySimulator.test.tsx
- UserManagement.test.tsx
- WorkerForm.test.tsx
- WorkerList.test.tsx

### Lib テスト (3ファイル)
- api.test.ts
- i18n-config.test.ts
- mockUsers.test.ts

## テスト実行順序

vitestは自動的にテストファイルを検出し、並列実行します。
テストの実行順序を制御する必要がある場合は、`test-suite.ts`を参照してください。

