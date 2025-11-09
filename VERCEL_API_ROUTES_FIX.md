# Vercel API Routes 修正ガイド

## 動的ルートのファイル名形式

Vercelでは、動的パラメータを含むAPI Routesは、以下の形式でファイル名を作成する必要があります：

### 正しい形式

- `/api/workers/[workerId]/dashboard/integrated.ts` → `/api/workers/:workerId/dashboard/integrated`
- `/api/training-menus/[menuId].ts` → `/api/training-menus/:menuId`

### 現在の構造

```
api/
├── admin/
│   └── summary.ts                    → /api/admin/summary ✅
├── auth/
│   ├── login.ts                      → /api/auth/login ✅
│   ├── current.ts                    → /api/auth/current ✅
│   └── logout.ts                     → /api/auth/logout ✅
├── health.ts                         → /api/health ✅
├── training-menus.ts                 → /api/training-menus ✅
├── training-menus/
│   └── [menuId].ts                   → /api/training-menus/:menuId ✅
├── workers.ts                        → /api/workers ✅
└── workers/
    └── [workerId]/
        └── dashboard/
            └── integrated.ts         → /api/workers/:workerId/dashboard/integrated ✅
```

## テスト方法

### 1. ヘルスチェック

```bash
curl -X GET "https://your-project.vercel.app/api/health"
```

### 2. 管理者サマリー

```bash
curl -X GET "https://your-project.vercel.app/api/admin/summary"
```

### 3. 訓練メニュー一覧

```bash
curl -X GET "https://your-project.vercel.app/api/training-menus"
```

### 4. 統合ダッシュボード

```bash
curl -X GET "https://your-project.vercel.app/api/workers/0/dashboard/integrated"
```

## トラブルシューティング

### 404エラーが発生する場合

1. **ファイル名を確認**: 動的パラメータは`[param]`形式で記述
2. **ディレクトリ構造を確認**: パスが正しく一致しているか
3. **デプロイを再実行**: `vercel --prod --yes`

### 405エラーが発生する場合

1. **HTTPメソッドを確認**: API Routesでサポートされているメソッドか
2. **ハンドラーの実装を確認**: `req.method`のチェックが正しいか

### 動的ルートが動作しない場合

1. **ファイル名の形式を確認**: `[param]`形式を使用
2. **`req.query`でパラメータを取得**: `const { param } = req.query;`
3. **デプロイログを確認**: `vercel logs`

## デプロイ後の確認

```bash
# デプロイ状態確認
vercel ls

# ログ確認
vercel logs

# 特定のデプロイのログ確認
vercel inspect <deployment-url> --logs
```

