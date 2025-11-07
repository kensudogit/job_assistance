# Vercel完全公開モードデプロイ - 最終手順

## ✅ 準備完了

以下の設定が完了しています：
- ✅ `vercel.json` - Vercel設定ファイル（404エラー修正済み）
- ✅ `vite.config.ts` - Vite設定（baseパス設定済み）
- ✅ `package.json` - デプロイスクリプト追加済み
- ✅ `.vercelignore` - デプロイ除外ファイル設定済み

## 🚀 デプロイ実行コマンド

### 方法1: 初回デプロイ（推奨）

```bash
cd C:\devlop\job_assistance

# 1. プロジェクトをリンク（初回のみ）
vercel link

# 2. 環境変数を設定（バックエンドAPIのURL）
vercel env add VITE_API_BASE_URL production

# 3. 本番環境にデプロイ
vercel --prod
```

### 方法2: npmスクリプトを使用

```bash
cd C:\devlop\job_assistance

# 1. プロジェクトをリンク（初回のみ）
vercel link

# 2. 環境変数を設定
vercel env add VITE_API_BASE_URL production

# 3. 本番デプロイ
npm run deploy
```

## 📋 デプロイ手順の詳細

### ステップ1: プロジェクトリンク

```bash
vercel link
```

対話的な質問に答えます：
- **Set up and deploy "job_assistance"?** → `Y`
- **Which scope?** → 自分のアカウントを選択
- **Link to existing project?** → `N`（新規プロジェクトの場合）
- **Project name?** → `job-assistance`（または任意の名前）
- **Directory?** → `./`

### ステップ2: 環境変数設定

```bash
vercel env add VITE_API_BASE_URL production
```

プロンプトでバックエンドAPIのURLを入力します。
例: `https://your-backend-api.railway.app`

**重要**: バックエンドAPIがまだデプロイされていない場合は、先にバックエンドをデプロイしてください。

### ステップ3: 本番デプロイ

```bash
vercel --prod
```

または

```bash
npm run deploy
```

デプロイ後、以下のような出力が表示されます：

```
✅  Production: https://job-assistance.vercel.app
```

## 🌐 完全公開モード

デプロイ後、以下のURLで**完全に公開**されます：
- ✅ 認証やパスワード保護なし
- ✅ すべてのユーザーがアクセス可能
- ✅ 本番環境URL: `https://your-project.vercel.app`

## 🔧 デプロイ後の確認

### デプロイURLの確認

```bash
vercel ls
```

### デプロイログの確認

```bash
vercel logs
```

### 環境変数の確認

```bash
vercel env ls
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

## 🎉 デプロイ完了後

デプロイが完了すると、以下のURLでアクセス可能になります：

- **本番環境**: `https://your-project.vercel.app`
- **プレビュー環境**: `https://your-project-git-branch.vercel.app`

デプロイURLは、Vercel Dashboardまたは`vercel ls`コマンドで確認できます。

