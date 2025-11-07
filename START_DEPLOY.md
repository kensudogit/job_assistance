# Vercelデプロイ実行手順

## ✅ 準備完了

以下のファイルが作成されました：
- ✅ `vercel.json` - Vercel設定ファイル
- ✅ `.vercelignore` - デプロイ除外ファイル
- ✅ `package.json` - デプロイスクリプト追加済み
- ✅ `DEPLOY_VERCEL.md` - 詳細デプロイ手順
- ✅ `QUICK_DEPLOY.md` - クイックデプロイ手順
- ✅ `VERCEL_DEPLOY_NOW.md` - 実行手順

## 🚀 デプロイ実行（3ステップ）

### ステップ1: プロジェクトをリンク（初回のみ）

```bash
cd C:\devlop\job_assistance
vercel link
```

対話的な質問に答えます：
- **Set up and deploy "job_assistance"?** → `Y`
- **Which scope?** → 自分のアカウントを選択
- **Link to existing project?** → `N`（新規の場合）
- **Project name?** → `job-assistance`（または任意）
- **Directory?** → `./`

### ステップ2: 環境変数を設定（重要）

バックエンドAPIのURLを設定します：

```bash
vercel env add VITE_API_BASE_URL production
```

プロンプトでバックエンドAPIのURLを入力してください。
例: `https://your-backend-api.railway.app`

**注意**: バックエンドAPIがまだデプロイされていない場合は、先にバックエンドをデプロイしてください。

### ステップ3: 本番環境にデプロイ

```bash
vercel --prod
```

または、npmスクリプトを使用：

```bash
npm run deploy
```

## 📋 デプロイ後の確認

### デプロイURLの確認

デプロイ後、以下のような出力が表示されます：

```
✅  Production: https://job-assistance.vercel.app
```

### デプロイ状態の確認

```bash
vercel ls
```

### ログの確認

```bash
vercel logs
```

## 🔧 便利なコマンド

```bash
# デプロイ状態確認
vercel ls

# ログ確認
vercel logs

# 環境変数確認
vercel env ls

# 環境変数追加
vercel env add VITE_API_BASE_URL production

# 環境変数削除
vercel env rm VITE_API_BASE_URL production

# 本番デプロイ
vercel --prod

# プレビューデプロイ
vercel
```

## 🌐 完全公開モード

デプロイ後、以下のURLで**完全に公開**されます：
- ✅ 認証やパスワード保護なし
- ✅ すべてのユーザーがアクセス可能
- ✅ 本番環境URL: `https://your-project.vercel.app`

## ⚠️ トラブルシューティング

### ビルドエラー

1. ローカルでビルドを確認：
   ```bash
   npm run build
   ```

2. ビルドが成功する場合、Vercelのビルドログを確認：
   ```bash
   vercel logs
   ```

### 環境変数が反映されない

1. 環境変数が正しく設定されているか確認：
   ```bash
   vercel env ls
   ```

2. 環境変数設定後、再デプロイが必要：
   ```bash
   vercel --prod
   ```

### API接続エラー

1. `VITE_API_BASE_URL`が正しく設定されているか確認
2. バックエンドAPIが公開されているか確認
3. CORS設定がバックエンドで正しく設定されているか確認

## 📝 次のステップ

1. バックエンドAPIをデプロイ（Railway、Render、Fly.ioなど）
2. バックエンドAPIのURLを環境変数に設定
3. フロントエンドを再デプロイして接続を確認

