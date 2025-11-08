# Vercel完全公開モードデプロイ手順

## 概要

このドキュメントでは、Vercelに完全公開モードでデプロイする手順を説明します。

## 前提条件

1. **Vercelアカウント**: [https://vercel.com](https://vercel.com) でアカウントを作成
2. **Vercel CLI**: インストール済み（`npm install -g vercel`）
3. **Gitリポジトリ**: プロジェクトがGitリポジトリにプッシュされていること

## デプロイ手順

### 方法1: バッチファイルを使用（Windows）

```bash
deploy-vercel-public.bat
```

### 方法2: 手動でコマンドを実行

#### ステップ1: Vercel CLIにログイン

```bash
vercel login
```

#### ステップ2: プロジェクトをリンク（初回のみ）

```bash
vercel link
```

対話的な質問に答えます：
- **Set up and deploy "job_assistance"?** → `Y`
- **Which scope do you want to deploy to?** → 自分のアカウントを選択
- **Link to existing project?** → `N`（新規プロジェクトの場合）
- **What's your project's name?** → `job-assistance` または任意の名前
- **In which directory is your code located?** → `./`（現在のディレクトリ）

#### ステップ3: 環境変数の設定

バックエンドAPIのURLを設定します：

```bash
vercel env add VITE_API_BASE_URL production
```

**プロンプトでバックエンドAPIのURLを入力してください。**

例:
- `https://your-backend-api.railway.app`
- `https://your-backend-api.render.com`
- または、バックエンドAPIがデプロイされているURL

**注意**: バックエンドAPIがまだデプロイされていない場合は、先にバックエンドをデプロイしてください。

#### ステップ4: 本番環境にデプロイ

```bash
vercel --prod
```

または、package.jsonのスクリプトを使用：

```bash
npm run deploy
```

## デプロイ後の確認

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

## 完全公開モードについて

デプロイ後、以下のURLで**完全に公開**されます：
- ✅ 認証やパスワード保護は適用されません
- ✅ すべてのユーザーがアクセス可能です
- ✅ 本番環境URL: `https://your-project.vercel.app`

## トラブルシューティング

### ビルドエラーが発生した場合

1. ローカルでビルドを確認：
   ```bash
   npm run build
   ```

2. ビルドが成功する場合、Vercelのビルドログを確認：
   ```bash
   vercel logs
   ```

### 環境変数が反映されない場合

1. 環境変数が正しく設定されているか確認：
   ```bash
   vercel env ls
   ```

2. 環境変数設定後、再デプロイが必要：
   ```bash
   vercel --prod
   ```

### API接続エラーが発生した場合

1. `VITE_API_BASE_URL`が正しく設定されているか確認：
   ```bash
   vercel env ls
   ```

2. バックエンドAPIが公開されているか確認
3. CORS設定がバックエンドで正しく設定されているか確認

## クイックコマンド

```bash
# デプロイ状態確認
vercel ls

# ログ確認
vercel logs

# 環境変数確認
vercel env ls

# 環境変数追加
vercel env add VITE_API_BASE_URL production

# 本番デプロイ
vercel --prod

# プレビューデプロイ
vercel
```

## 次のステップ

1. バックエンドAPIをデプロイ（Railway、Render、Fly.ioなど）
2. バックエンドAPIのURLを環境変数に設定
3. フロントエンドを再デプロイして接続を確認

