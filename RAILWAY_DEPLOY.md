# Railway完全公開モードデプロイガイド

## 概要
このガイドでは、バックエンドAPIをRailwayに完全公開モードでデプロイする手順を説明します。

## 前提条件
- Railwayアカウント（https://railway.com/ で作成）
- Railway CLIがインストールされている（確認済み）

## デプロイ手順

### 1. Railwayにログイン

```bash
railway login
```

ブラウザが開くので、Railwayアカウントでログインしてください。

### 2. 新しいプロジェクトを作成

```bash
railway init
```

プロジェクト名を入力します（例: `job-assistance-backend`）

### 3. PostgreSQLデータベースを追加

Railwayダッシュボードから：
1. **New** をクリック
2. **Database** > **Add PostgreSQL** を選択
3. データベースが作成されます

または、CLIから：
```bash
railway add postgresql
```

### 4. 環境変数を設定

Railwayダッシュボードから、またはCLIから環境変数を設定：

```bash
# データベース接続情報（Railwayが自動的に設定）
# DATABASE_URL は自動的に設定されます

# その他の環境変数
railway variables set SECRET_KEY=your-secret-key-here
railway variables set FLASK_ENV=production
railway variables set CORS_ORIGINS=https://jobassistance-*.vercel.app,https://*.vercel.app
railway variables set LOG_LEVEL=INFO
```

**重要**: `CORS_ORIGINS`には、VercelのフロントエンドURLを含めてください。

### 5. デプロイ

```bash
railway up
```

または、GitHubリポジトリから自動デプロイを設定：
1. Railwayダッシュボードで **Settings** > **GitHub** を選択
2. リポジトリを接続
3. 自動デプロイが有効になります

### 6. 公開URLを取得

デプロイ後、Railwayダッシュボードから：
1. サービスを選択
2. **Settings** > **Generate Domain** をクリック
3. 公開URLが生成されます（例: `https://your-service.railway.app`）

または、CLIから：
```bash
railway domain
```

### 7. Vercelの環境変数を更新

Vercelのフロントエンドアプリケーションの環境変数を更新：

```bash
# Vercel CLIから
vercel env add VITE_API_BASE_URL production
# 値: Railwayの公開URL（例: https://your-service.railway.app）
```

または、Vercelダッシュボードから：
1. https://vercel.com/dashboard にアクセス
2. プロジェクト「job_assistance」を選択
3. **Settings** > **Environment Variables** に移動
4. `VITE_API_BASE_URL` を追加/更新
5. **Value**: Railwayの公開URL
6. **Environment**: Production, Preview, Development すべてにチェック
7. **Save** をクリック

### 8. Vercelを再デプロイ

環境変数を更新後、Vercelを再デプロイ：

```bash
vercel --prod
```

## Railway設定ファイル

`railway.json` ファイルが作成されています：

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.backend"
  },
  "deploy": {
    "startCommand": "python -m src.api",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## 環境変数の説明

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQLデータベース接続URL（Railwayが自動設定） | はい |
| `SECRET_KEY` | Flaskセッション管理用のシークレットキー | はい |
| `FLASK_ENV` | Flask環境（production推奨） | いいえ |
| `CORS_ORIGINS` | CORS許可オリジン（カンマ区切り） | はい |
| `LOG_LEVEL` | ログレベル（INFO推奨） | いいえ |
| `PORT` | アプリケーションのポート（Railwayが自動設定） | いいえ |

## データベースマイグレーション

Railwayにデプロイ後、データベースマイグレーションが自動的に実行されます（`docker-entrypoint.sh`内の`python -m src.init_db`）。

## トラブルシューティング

### 問題: デプロイが失敗する

**解決方法:**
1. Railwayダッシュボードのログを確認
2. 環境変数が正しく設定されているか確認
3. `Dockerfile.backend`が正しく存在するか確認

### 問題: データベース接続エラー

**解決方法:**
1. PostgreSQLデータベースが作成されているか確認
2. `DATABASE_URL`環境変数が正しく設定されているか確認
3. Railwayダッシュボードでデータベースの接続情報を確認

### 問題: CORSエラー

**解決方法:**
1. `CORS_ORIGINS`環境変数にフロントエンドのURLを含める
2. VercelのURLが正しく設定されているか確認

### 問題: ポートエラー

**解決方法:**
1. Railwayは自動的に`PORT`環境変数を設定します
2. `src/api.py`で`PORT`環境変数を使用するように確認：

```python
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
```

## 参考リンク

- Railway公式サイト: https://railway.com/
- Railwayドキュメント: https://docs.railway.app/
- Railway CLI: https://docs.railway.app/develop/cli

