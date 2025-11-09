# バックエンドなしでのVercelデプロイ

## 概要

バックエンドAPIがない場合でも、VercelのAPI Routesを使用してフロントエンドを動作させることができます。

## 実装内容

### 1. Vercel API Routesの作成

`api/`ディレクトリに以下のモックAPIを作成しました：

- `api/health.ts` - ヘルスチェックAPI
- `api/auth/login.ts` - ログインAPI（モック）
- `api/auth/current.ts` - 現在のユーザー情報取得API（モック）
- `api/auth/logout.ts` - ログアウトAPI（モック）
- `api/workers.ts` - 就労者一覧API（モック）

### 2. vercel.jsonの設定

`vercel.json`にAPI Routesの設定を追加：

```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
```

### 3. APIベースURLの設定

`lib/api.ts`で、本番環境では相対パス（空文字列）を使用するように設定されています。
これにより、VercelのAPI Routesが自動的に使用されます。

## デプロイ方法

### 1. コードをコミット

```bash
git add .
git commit -m "Add Vercel API Routes for backend-less deployment"
git push
```

### 2. Vercelにデプロイ

```bash
vercel --prod --yes
```

### 3. 動作確認

デプロイ後、以下のURLでアクセス：
- 本番環境URL: `https://your-project.vercel.app`
- ヘルスチェック: `https://your-project.vercel.app/api/health`
- ログイン: `https://your-project.vercel.app/api/auth/login`

## モックAPIの動作

### ログインAPI

**エンドポイント**: `POST /api/auth/login`

**リクエスト例**:
```json
{
  "username": "admin",
  "password": "admin123",
  "mfa_code": "000000"
}
```

**レスポンス例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "administrator",
    "worker_id": null,
    "mfa_enabled": true
  },
  "csrf_token": "mock-csrf-token-..."
}
```

### MFAコード

モックAPIでは、以下の万能MFAコードが使用できます：
- `000000`
- `123456`
- `999999`

## 制限事項

⚠️ **注意**: モックAPIは開発・デモ用です。

- データは永続化されません（リロードするとリセット）
- セキュリティ機能は最小限です
- 完全な機能は実装されていません

## 本番環境での使用

本番環境で使用する場合は：

1. **バックエンドAPIをデプロイ**（Railway、Render、Fly.ioなど）
2. **環境変数を設定**:
   ```bash
   vercel env add VITE_API_BASE_URL production
   ```
3. **バックエンドAPIのURLを入力**
4. **再デプロイ**:
   ```bash
   vercel --prod --yes
   ```

## トラブルシューティング

### API Routesが動作しない場合

1. `api/`ディレクトリが正しく配置されているか確認
2. `vercel.json`の設定を確認
3. デプロイログを確認：
   ```bash
   vercel logs
   ```

### 405エラーが発生する場合

1. API RoutesのHTTPメソッドが正しいか確認
2. `vercel.json`のリライト設定を確認
3. ブラウザの開発者ツールでネットワークタブを確認

## 次のステップ

1. 必要なAPIエンドポイントを追加
2. モックデータを拡張
3. バックエンドAPIを実装して移行

