# VercelデプロイURL確認方法

## 実際のデプロイURLを確認する方法

### 方法1: Vercel CLIで確認

```bash
cd C:\devlop\job_assistance

# デプロイ一覧を表示
vercel ls

# または、プロジェクト情報を表示
vercel inspect
```

### 方法2: Vercel Dashboardで確認

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. デプロイメント一覧から最新のデプロイメントを確認
4. デプロイメントのURLを確認（例: `https://job-assistance-xxx.vercel.app`）

### 方法3: デプロイ時に表示されるURL

デプロイ実行時に、以下のような出力が表示されます：

```
✅  Production: https://job-assistance-xxx.vercel.app
```

## プロジェクトがリンクされていない場合

`.vercel`ディレクトリが存在しない場合、まずプロジェクトをリンクする必要があります：

```bash
cd C:\devlop\job_assistance

# 1. プロジェクトをリンク
vercel link

# 2. 対話的な質問に答える：
#    - Set up and deploy "job_assistance"? → Y
#    - Which scope? → 自分のアカウントを選択
#    - Link to existing project? → N（新規の場合）
#    - Project name? → job-assistance（または任意）
#    - Directory? → ./

# 3. デプロイを実行
vercel --prod
```

## デプロイURLの形式

VercelのデプロイURLは以下の形式です：

- **本番環境**: `https://[プロジェクト名]-[ハッシュ].vercel.app`
- **カスタムドメイン**: `https://[カスタムドメイン]`

例:
- `https://job-assistance-abc123.vercel.app`
- `https://job-assistance.vercel.app`（プロジェクト名が短い場合）

## デプロイが完了していない場合

デプロイがまだ完了していない場合、以下の手順でデプロイを実行してください：

```bash
cd C:\devlop\job_assistance

# 1. プロジェクトをリンク（初回のみ）
vercel link

# 2. 環境変数を設定（バックエンドAPIのURL）
vercel env add VITE_API_BASE_URL production

# 3. 本番環境にデプロイ
vercel --prod
```

## トラブルシューティング

### デプロイURLが見つからない

1. **Vercel Dashboardで確認**
   - [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
   - プロジェクト一覧を確認
   - プロジェクトが存在しない場合、新規デプロイが必要

2. **デプロイログを確認**
   ```bash
   vercel logs
   ```
   エラーがないか確認してください

3. **デプロイ状態を確認**
   ```bash
   vercel ls
   ```
   デプロイメント一覧が表示されます

### 404エラーが発生する場合

1. `vercel.json`の`rewrites`設定を確認
2. `vite.config.ts`の`base: '/'`設定を確認
3. ビルド出力（`dist/index.html`）が正しく生成されているか確認

### アクセスできない場合

1. **デプロイが完了しているか確認**
   - Vercel Dashboardでデプロイメントの状態を確認
   - "Ready"状態になっているか確認

2. **URLが正しいか確認**
   - Vercel Dashboardに表示されているURLを使用
   - `your-project.vercel.app`はプレースホルダーです

3. **ブラウザのキャッシュをクリア**
   - ブラウザのキャッシュをクリアして再アクセス

