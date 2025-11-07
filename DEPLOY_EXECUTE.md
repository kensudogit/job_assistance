# Vercel完全公開モードデプロイ - 実行手順

## ✅ 準備完了

以下の設定が完了しています：
- ✅ `vercel.json` - Vercel設定ファイル（404エラー修正済み）
- ✅ `vite.config.ts` - Vite設定（baseパス設定済み）
- ✅ `package.json` - デプロイスクリプト追加済み

## 🚀 デプロイ実行（3ステップ）

### ステップ1: プロジェクトをリンク（初回のみ）

プロジェクトが初めての場合、まずリンクする必要があります：

```bash
cd C:\devlop\job_assistance
vercel link
```

対話的な質問に答えます：
- **Set up and deploy "job_assistance"?** → `Y`
- **Which scope?** → 自分のアカウントを選択
- **Link to existing project?** → `N`（新規プロジェクトの場合）
- **Project name?** → `job-assistance`（または任意の名前）
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

## 🌐 完全公開モード

デプロイ後、以下のURLで**完全に公開**されます：
- ✅ 認証やパスワード保護なし
- ✅ すべてのユーザーがアクセス可能
- ✅ 本番環境URL: `https://your-project.vercel.app`

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

### 404エラー

1. `vercel.json`の`rewrites`設定を確認
2. `vite.config.ts`の`base: '/'`設定を確認
3. ビルド出力（`dist/index.html`）が正しく生成されているか確認

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

