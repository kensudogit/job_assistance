# VercelデプロイURL取得方法

## クイック確認方法

### 1. Vercel Dashboardで確認（最も簡単）

1. [https://vercel.com/dashboard](https://vercel.com/dashboard)にアクセス
2. ログイン
3. プロジェクト一覧から`job-assistance`（またはプロジェクト名）を選択
4. 最新のデプロイメントのURLを確認

### 2. Vercel CLIで確認

```bash
cd C:\devlop\job_assistance

# デプロイ一覧を表示
vercel ls

# プロジェクト情報を表示
vercel inspect
```

### 3. デプロイ時に表示されるURL 

デプロイ実行時に、以下のような出力が表示されます：

```
🔍  Inspect: https://vercel.com/your-username/job-assistance/...
✅  Production: https://job-assistance-xxx.vercel.app [copied to clipboard]
```

## プロジェクトがまだデプロイされていない場合

以下のコマンドでデプロイを実行してください：

```bash
cd C:\devlop\job_assistance

# 1. プロジェクトをリンク（初回のみ）
vercel link

# 2. 環境変数を設定（バックエンドAPIのURL）
vercel env add VITE_API_BASE_URL production

# 3. 本番環境にデプロイ
vercel --prod
```

デプロイ完了後、実際のURLが表示されます。

## 注意事項

- `https://your-project.vercel.app`は**プレースホルダー**です
- 実際のURLは`https://[プロジェクト名]-[ハッシュ].vercel.app`の形式です
- プロジェクト名が短い場合、`https://[プロジェクト名].vercel.app`になることもあります

## 実際のURL例

- `https://job-assistance-abc123def456.vercel.app`
- `https://job-assistance.vercel.app`（プロジェクト名が短い場合）

