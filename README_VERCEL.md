# Vercelデプロイ手順

## 前提条件

1. Vercelアカウント（[https://vercel.com](https://vercel.com)）が必要です
2. GitHub/GitLab/Bitbucketアカウントとリポジトリが必要です

## デプロイ手順

### 1. リポジトリにプッシュ

```bash
git add .
git commit -m "Vercelデプロイ用設定を追加"
git push origin main
```

### 2. Vercelにプロジェクトをインポート

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. "Add New..." → "Project"をクリック
3. GitHubリポジトリを選択
4. プロジェクトをインポート

### 3. 環境変数の設定

Vercel Dashboard → Project Settings → Environment Variables で以下を設定：

- `VITE_API_BASE_URL`: バックエンドAPIのURL（例: `https://your-backend-api.railway.app` または `https://your-backend-api.render.com`）

### 4. ビルド設定の確認

Vercelは自動的に以下を検出します：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 5. デプロイ

Vercelは自動的にデプロイを実行します。GitHubにプッシュするたびに自動デプロイされます。

## バックエンドAPIのデプロイ

Vercelは主にフロントエンド向けのため、バックエンドAPI（Flask）は別のサービスにデプロイする必要があります：

### 推奨サービス

1. **Railway** ([https://railway.app](https://railway.app))
   - Dockerコンテナを直接サポート
   - PostgreSQLデータベースも提供
   - 簡単なデプロイ

2. **Render** ([https://render.com](https://render.com))
   - Dockerコンテナをサポート
   - PostgreSQLデータベースも提供
   - 無料プランあり

3. **Fly.io** ([https://fly.io](https://fly.io))
   - Dockerコンテナをサポート
   - グローバル分散

### Railwayでのデプロイ例

1. Railwayアカウントを作成
2. "New Project" → "Deploy from GitHub repo"を選択
3. リポジトリを選択
4. `Dockerfile.backend`を選択
5. 環境変数を設定：
   - `DATABASE_URL`: PostgreSQL接続文字列
   - `ENCRYPTION_KEY`: 暗号化キー（32バイトのランダム文字列）
   - `FLASK_ENV`: `production`
6. デプロイ後、提供されるURLを`VITE_API_BASE_URL`に設定

## 完全公開モード

デプロイ後、以下のURLでアクセス可能になります：
- 本番環境: `https://your-project.vercel.app`
- プレビュー環境: `https://your-project-git-branch.vercel.app`

## カスタムドメイン

Vercel Dashboard → Project Settings → Domains でカスタムドメインを追加できます。

## トラブルシューティング

### ビルドエラー

- `package.json`の`build`スクリプトが正しいか確認
- Node.jsのバージョンが互換性があるか確認（Vercelは自動検出）

### API接続エラー

- `VITE_API_BASE_URL`環境変数が正しく設定されているか確認
- CORS設定がバックエンドで正しく設定されているか確認
- バックエンドAPIが公開されているか確認

### 環境変数が反映されない

- 環境変数設定後、再デプロイが必要
- ビルド時変数（`VITE_`プレフィックス）を使用しているか確認

