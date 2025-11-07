# Vercelデプロイ対応ガイド

## 問題点
Vercelにデプロイされたフロントエンドアプリケーションが、`localhost:5000`のバックエンドAPIに接続できないため、エラーが発生しています。

## 解決方法

### 1. バックエンドAPIのURLを確認

バックエンドAPIがどこにデプロイされているかを確認してください：

#### オプションA: Railwayにデプロイされている場合
- Railwayダッシュボードから公開URLを取得
- 例: `https://your-service.railway.app`

#### オプションB: その他のサーバーにデプロイされている場合
- バックエンドAPIの公開URLを確認
- 例: `https://api.yourdomain.com` または `http://your-server-ip:5000`

#### オプションC: まだデプロイされていない場合
- Railwayにデプロイする（`RAILWAY_DEPLOY.md`を参照）
- または、その他のサービスにデプロイする

### 2. Vercelの環境変数を設定

#### 方法1: Vercelダッシュボードから設定（推奨）

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/dashboard
   - プロジェクト「job_assistance」を選択

2. **Settings > Environment Variables**に移動

3. **環境変数を追加**
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: バックエンドAPIのURL（例: `https://your-service.railway.app`）
   - **Environment**: Production, Preview, Development すべてにチェック

4. **Save**をクリック

5. **再デプロイ**
   - 環境変数を設定後、必ず再デプロイしてください
   - または、Vercelが自動的に再デプロイします

#### 方法2: Vercel CLIから設定

```bash
# 環境変数を追加
vercel env add VITE_API_BASE_URL production
# 値: バックエンドAPIのURL（例: https://your-service.railway.app）

# Preview環境にも追加
vercel env add VITE_API_BASE_URL preview

# Development環境にも追加
vercel env add VITE_API_BASE_URL development

# 環境変数を確認
vercel env ls

# 再デプロイ
vercel --prod
```

### 3. エラーハンドリングの改善

バックエンドAPIに接続できない場合でも、フロントエンドが動作するようにエラーハンドリングを改善します。

### 4. CORS設定の確認

バックエンドAPIでCORSが正しく設定されていることを確認してください：

```python
# src/api.py
CORS(app, supports_credentials=True, origins=os.getenv('CORS_ORIGINS', '*').split(','))
```

`CORS_ORIGINS`環境変数に、VercelのフロントエンドURLを含めてください：
- `https://jobassistance-*.vercel.app`
- `https://*.vercel.app`

## デプロイ手順

### 1. バックエンドAPIをデプロイ

Railwayにデプロイする場合：
```bash
# Railwayにログイン
railway login

# プロジェクトを作成
railway init

# PostgreSQLデータベースを追加
railway add postgresql

# 環境変数を設定
railway variables set SECRET_KEY=your-secret-key-here
railway variables set FLASK_ENV=production
railway variables set CORS_ORIGINS=https://jobassistance-*.vercel.app,https://*.vercel.app

# デプロイ
railway up

# 公開URLを取得
railway domain
```

### 2. Vercelの環境変数を設定

```bash
# バックエンドAPIのURLを設定
vercel env add VITE_API_BASE_URL production
# 値: Railwayの公開URL（例: https://your-service.railway.app）
```

### 3. Vercelに再デプロイ

```bash
vercel --prod
```

## 動作確認

1. **VercelのデプロイURLにアクセス**
   - 例: `https://jobassistance-*.vercel.app`

2. **ブラウザの開発者ツールを開く**
   - Networkタブ: APIリクエストが正しいURLに送信されているか確認
   - Consoleタブ: エラーが発生していないか確認

3. **機能をテスト**
   - 就労者情報の登録
   - サイドバーのタブ切り替え
   - 各種機能の動作確認

## トラブルシューティング

### 問題: 環境変数が反映されない

**解決方法:**
1. 環境変数を設定後、必ず再デプロイしてください
2. ビルド時に環境変数が読み込まれるため、再ビルドが必要です
3. Vercelダッシュボードで環境変数が正しく設定されているか確認

### 問題: CORSエラーが発生する

**解決方法:**
1. バックエンドAPIの`CORS_ORIGINS`環境変数に、VercelのURLを含める
2. 例: `https://jobassistance-*.vercel.app,https://*.vercel.app`

### 問題: バックエンドAPIに接続できない

**解決方法:**
1. バックエンドAPIが起動していることを確認
2. バックエンドAPIのURLが正しいか確認
3. ファイアウォール設定を確認

## 参考リンク

- Vercel環境変数: https://vercel.com/docs/concepts/projects/environment-variables
- Vite環境変数: https://vitejs.dev/guide/env-and-mode.html
- Railwayデプロイ: `RAILWAY_DEPLOY.md`

