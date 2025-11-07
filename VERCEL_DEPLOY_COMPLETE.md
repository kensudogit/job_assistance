# Vercel完全公開モードデプロイ対応ガイド

## 概要
Vercelにデプロイしたフロントエンドアプリケーションが、バックエンドAPIに正常に接続できるようにするための設定手順です。

## 前提条件
- バックエンドAPIが公開されている必要があります（Railway、その他のサーバーなど）
- バックエンドAPIのURLを取得している必要があります

## デプロイ手順

### 1. バックエンドAPIのURLを確認

バックエンドAPIがどこにデプロイされているかを確認してください：

#### Railwayにデプロイされている場合
```bash
# Railwayの公開URLを取得
railway domain
```

#### その他のサーバーにデプロイされている場合
- バックエンドAPIの公開URLを確認
- 例: `https://api.yourdomain.com` または `http://your-server-ip:5000`

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
   - 環境変数を設定後、Vercelが自動的に再デプロイします
   - または、手動で再デプロイ:
     ```bash
     vercel --prod
     ```

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

### 3. バックエンドAPIのCORS設定

バックエンドAPIでCORSが正しく設定されていることを確認してください：

#### Railwayにデプロイされている場合
```bash
# CORS_ORIGINS環境変数を設定
railway variables set CORS_ORIGINS=https://jobassistance-*.vercel.app,https://*.vercel.app
```

#### その他のサーバーの場合
`src/api.py`で以下の設定が有効になっている必要があります：

```python
CORS(app, supports_credentials=True, origins=os.getenv('CORS_ORIGINS', '*').split(','))
```

`CORS_ORIGINS`環境変数に、VercelのフロントエンドURLを含めてください：
- `https://jobassistance-*.vercel.app`
- `https://*.vercel.app`

### 4. デプロイ

```bash
# Vercelにデプロイ
vercel --prod
```

## 動作確認

### 1. VercelのデプロイURLにアクセス
- 例: `https://jobassistance-*.vercel.app`

### 2. ブラウザの開発者ツールを開く
- **Networkタブ**: APIリクエストが正しいURLに送信されているか確認
- **Consoleタブ**: エラーが発生していないか確認

### 3. 機能をテスト
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

### 問題: ネットワークエラーが発生する

**解決方法:**
1. `VITE_API_BASE_URL`環境変数が正しく設定されているか確認
2. バックエンドAPIのURLが正しいか確認
3. バックエンドAPIが公開されているか確認

## 参考リンク

- Vercel環境変数: https://vercel.com/docs/concepts/projects/environment-variables
- Vite環境変数: https://vitejs.dev/guide/env-and-mode.html
- Railwayデプロイ: `RAILWAY_DEPLOY.md`

