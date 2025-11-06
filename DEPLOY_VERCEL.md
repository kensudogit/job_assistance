# Vercel完全公開モードデプロイ手順

## 方法1: Vercel CLIを使用（推奨）

### 1. Vercel CLIのインストール

```bash
npm install -g vercel
```

### 2. Vercelにログイン

```bash
vercel login
```

ブラウザが開き、Vercelアカウントでログインします。

### 3. プロジェクトルートでデプロイ

```bash
cd C:\devlop\job_assistance
vercel
```

初回デプロイ時は、以下の質問に答えます：
- **Set up and deploy "job_assistance"?** → `Y`
- **Which scope do you want to deploy to?** → 自分のアカウントを選択
- **Link to existing project?** → `N`（新規プロジェクトの場合）
- **What's your project's name?** → `job-assistance` または任意の名前
- **In which directory is your code located?** → `./`（現在のディレクトリ）

### 4. 本番環境にデプロイ

```bash
vercel --prod
```

### 5. 環境変数の設定

```bash
vercel env add VITE_API_BASE_URL production
```

プロンプトでバックエンドAPIのURLを入力します（例: `https://your-backend-api.railway.app`）

### 6. 環境変数を再デプロイに反映

```bash
vercel --prod
```

## 方法2: GitHub連携を使用（自動デプロイ）

### 1. GitHubリポジトリにプッシュ

```bash
git add .
git commit -m "Vercelデプロイ用設定を追加"
git push origin main
```

### 2. Vercel Dashboardでプロジェクトをインポート

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. "Add New..." → "Project"をクリック
3. GitHubリポジトリを選択
4. プロジェクトをインポート

### 3. ビルド設定の確認

Vercelは自動的に以下を検出します：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**注意**: 必要に応じて以下を確認：
- **Root Directory**: `./`（プロジェクトルート）
- **Node.js Version**: 20.x（推奨）

### 4. 環境変数の設定

1. Project Settings → Environment Variables
2. 以下の環境変数を追加：
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: バックエンドAPIのURL（例: `https://your-backend-api.railway.app`）
   - **Environment**: Production, Preview, Development すべてにチェック

### 5. デプロイ

"Deploy"ボタンをクリックすると、自動的にデプロイが開始されます。

## デプロイ後の確認

### デプロイURL

デプロイ後、以下のURLでアクセス可能になります：
- **本番環境**: `https://your-project.vercel.app`
- **プレビュー環境**: `https://your-project-git-branch.vercel.app`

### デプロイ状態の確認

```bash
vercel ls
```

### ログの確認

```bash
vercel logs
```

## バックエンドAPIのデプロイ（Railway例）

### 1. Railwayアカウント作成

[https://railway.app](https://railway.app)でアカウントを作成

### 2. 新規プロジェクト作成

1. "New Project" → "Deploy from GitHub repo"を選択
2. リポジトリを選択
3. `Dockerfile.backend`を使用

### 3. 環境変数の設定

Railway Dashboard → Variables で以下を設定：
- `DATABASE_URL`: PostgreSQL接続文字列（Railwayが自動生成）
- `ENCRYPTION_KEY`: 32バイトのランダム文字列（例: `openssl rand -base64 32`）
- `FLASK_ENV`: `production`
- `FLASK_APP`: `src/api.py`

### 4. PostgreSQLデータベースの追加

1. "New" → "Database" → "Add PostgreSQL"
2. データベースが作成され、`DATABASE_URL`が自動設定されます

### 5. デプロイURLの取得

デプロイ後、Railwayが提供するURL（例: `https://your-backend-api.railway.app`）を`VITE_API_BASE_URL`に設定

## トラブルシューティング

### ビルドエラー

- `package.json`の`build`スクリプトが正しいか確認
- Node.jsのバージョンが互換性があるか確認

### 環境変数が反映されない

- 環境変数設定後、再デプロイが必要
- `VITE_`プレフィックスが付いているか確認

### API接続エラー

- CORS設定がバックエンドで正しく設定されているか確認
- バックエンドAPIが公開されているか確認

### 404エラー

- `vercel.json`の`rewrites`設定を確認
- SPAルーティングの場合は、`vercel.json`に以下を追加：
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

## 完全公開モード

デプロイ後、以下のURLで**完全に公開**されます：
- 本番環境: `https://your-project.vercel.app`
- プレビュー環境: `https://your-project-git-branch.vercel.app`

認証やパスワード保護は適用されません。すべてのユーザーがアクセス可能です。

