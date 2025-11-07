# Vercelクイックデプロイ手順

## 完全公開モードでデプロイ

### ステップ1: 初回デプロイ（プロジェクトリンク）

```bash
cd C:\devlop\job_assistance
vercel link
```

対話的な質問に答えます：
- **Set up and deploy "job_assistance"?** → `Y`
- **Which scope do you want to deploy to?** → 自分のアカウントを選択
- **Link to existing project?** → `N`（新規プロジェクトの場合）
- **What's your project's name?** → `job-assistance` または任意の名前
- **In which directory is your code located?** → `./`（現在のディレクトリ）

### ステップ2: 環境変数の設定

バックエンドAPIのURLを設定します：

```bash
vercel env add VITE_API_BASE_URL production
```

プロンプトでバックエンドAPIのURLを入力します。
例: `https://your-backend-api.railway.app` または `https://your-backend-api.render.com`

**注意**: バックエンドAPIがまだデプロイされていない場合は、先にバックエンドをデプロイしてください。

### ステップ3: 本番環境にデプロイ

```bash
vercel --prod
```

または、package.jsonのスクリプトを使用：

```bash
npm run deploy
```

### ステップ4: デプロイURLの確認

デプロイ後、以下のURLが表示されます：
- **本番環境**: `https://your-project.vercel.app`
- **プレビュー環境**: `https://your-project-git-branch.vercel.app`

## デプロイ済みプロジェクトの確認

```bash
vercel ls
```

## デプロイログの確認

```bash
vercel logs
```

## 環境変数の確認

```bash
vercel env ls
```

## 環境変数の削除

```bash
vercel env rm VITE_API_BASE_URL production
```

## トラブルシューティング

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

## 完全公開モード

デプロイ後、以下のURLで**完全に公開**されます：
- 認証やパスワード保護は適用されません
- すべてのユーザーがアクセス可能です
- 本番環境URL: `https://your-project.vercel.app`

