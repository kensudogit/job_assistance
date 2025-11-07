# Vercel環境変数設定ガイド

## 問題
Vercelにデプロイされたフロントエンドアプリケーションが、`localhost:5000`のバックエンドAPIに接続できないエラーが発生しています。

## 解決方法

### 1. Vercelの環境変数を設定

Vercelのダッシュボードで環境変数を設定する必要があります。

#### 手順

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com/dashboard
   - プロジェクト「job_assistance」を選択

2. **Settings > Environment Variables**に移動

3. **環境変数を追加**
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: バックエンドAPIのURL（例: `https://your-backend-api.com` または `http://your-server-ip:5000`）
   - **Environment**: Production, Preview, Development すべてにチェック

4. **Save**をクリック

5. **再デプロイ**
   ```bash
   vercel --prod
   ```

### 2. バックエンドAPIのURLを確認

バックエンドAPIがどこにデプロイされているかを確認してください。

#### オプションA: バックエンドAPIが別のサーバーで実行されている場合
- バックエンドAPIのURLを`VITE_API_BASE_URL`に設定
- 例: `https://api.yourdomain.com` または `http://your-server-ip:5000`

#### オプションB: バックエンドAPIが同じVercelプロジェクトで実行されている場合
- VercelのServerless Functionsを使用している場合、相対パスを使用
- 例: `/api`（相対パス）

#### オプションC: バックエンドAPIがDockerで実行されている場合
- Dockerコンテナが公開されているURLを設定
- 例: `http://your-server-ip:5000`

### 3. CORS設定の確認

バックエンドAPIでCORSが正しく設定されていることを確認してください。

`src/api.py`で以下の設定が有効になっている必要があります：

```python
CORS(app, supports_credentials=True, origins=os.getenv('CORS_ORIGINS', '*').split(','))
```

### 4. 環境変数の確認方法

Vercelの環境変数が正しく設定されているか確認：

```bash
vercel env ls
```

### 5. 本番環境での動作確認

環境変数を設定後、再デプロイして動作を確認：

```bash
vercel --prod
```

ブラウザの開発者ツールで、APIリクエストが正しいURLに送信されているか確認してください。

## トラブルシューティング

### 問題: 環境変数が反映されない

**解決方法:**
1. 環境変数を設定後、必ず再デプロイしてください
2. ビルド時に環境変数が読み込まれるため、再ビルドが必要です

### 問題: CORSエラーが発生する

**解決方法:**
1. バックエンドAPIのCORS設定を確認
2. フロントエンドのURLを`CORS_ORIGINS`に追加

### 問題: バックエンドAPIに接続できない

**解決方法:**
1. バックエンドAPIが起動していることを確認
2. ファイアウォール設定を確認
3. バックエンドAPIのURLが正しいか確認

## 参考リンク

- Vercel環境変数: https://vercel.com/docs/concepts/projects/environment-variables
- Vite環境変数: https://vitejs.dev/guide/env-and-mode.html

