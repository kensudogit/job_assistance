# 405エラー対応方法

## 問題

「Request failed with status code 405」エラーが発生しています。

## 原因

405エラーは「Method Not Allowed」を意味します。主な原因：

1. **バックエンドAPIのURLが設定されていない**
   - Vercelにデプロイされたフロントエンドが、バックエンドAPIのURLを知らない
   - 環境変数`VITE_API_BASE_URL`が設定されていない

2. **APIリクエストが正しくルーティングされていない**
   - Vercelのリライト設定でAPIパスが除外されているが、バックエンドAPIが別ドメインにある場合

## 解決方法

### 方法1: バックエンドAPIのURLを環境変数で設定（推奨）

バックエンドAPIが別のサーバー（Railway、Render、Fly.ioなど）にデプロイされている場合：

```bash
# バックエンドAPIのURLを設定
vercel env add VITE_API_BASE_URL production
```

**プロンプトでバックエンドAPIのURLを入力してください。**

例:
- `https://your-backend-api.railway.app`
- `https://your-backend-api.render.com`
- `https://your-backend-api.fly.dev`

設定後、再デプロイ：

```bash
vercel --prod --yes
```

### 方法2: バックエンドAPIをVercelにデプロイ

バックエンドAPIもVercelにデプロイする場合：

1. バックエンドAPIを別のVercelプロジェクトとしてデプロイ
2. フロントエンドの環境変数にバックエンドAPIのURLを設定

### 方法3: VercelのAPI Routesを使用（現在の設定では不可）

VercelのAPI Routesを使用する場合は、`api/`ディレクトリを作成する必要がありますが、現在のプロジェクト構造では推奨しません。

## 確認手順

### 1. 環境変数の確認

```bash
vercel env ls
```

### 2. ブラウザのコンソールでAPI URLを確認

ブラウザの開発者ツール（F12）でコンソールを開き、以下が表示されるか確認：

```
API Base URL: (相対パス)
```

または

```
API Base URL: https://your-backend-api.railway.app
```

### 3. ネットワークタブでリクエストを確認

ブラウザの開発者ツールのネットワークタブで：
- どのURLにリクエストが送信されているか
- レスポンスステータスコード
- エラーメッセージ

## トラブルシューティング

### バックエンドAPIがまだデプロイされていない場合

1. バックエンドAPIを先にデプロイ（Railway、Render、Fly.ioなど）
2. バックエンドAPIのURLを取得
3. フロントエンドの環境変数に設定
4. フロントエンドを再デプロイ

### CORSエラーが発生する場合

バックエンドAPIのCORS設定を確認：

```python
# src/api.py
CORS(app, supports_credentials=True, origins=['https://your-frontend.vercel.app'])
```

### 環境変数が反映されない場合

1. 環境変数設定後、必ず再デプロイ：
   ```bash
   vercel --prod --yes
   ```

2. ビルド時に環境変数が正しく読み込まれているか確認：
   ```bash
   vercel logs
   ```

## クイックコマンド

```bash
# 環境変数確認
vercel env ls

# 環境変数追加
vercel env add VITE_API_BASE_URL production

# 再デプロイ
vercel --prod --yes

# ログ確認
vercel logs
```

