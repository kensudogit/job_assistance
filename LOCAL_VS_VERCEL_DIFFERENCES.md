# ローカル環境とVercel環境の違い

## 概要
ローカル環境では正常に動作するのに、Vercel環境でエラーが発生する主な理由を説明します。

---

## 1. 環境変数の扱い方の違い

### ローカル環境
- `.env`ファイルや`docker-compose.yml`で環境変数を設定
- 開発サーバー（`npm run dev`）が自動的に環境変数を読み込む
- `VITE_API_BASE_URL`が設定されていなくても、デフォルト値（`http://localhost:5000`）が使用される

### Vercel環境
- **環境変数は明示的に設定する必要がある**
- VercelダッシュボードまたはCLIで設定しないと、環境変数は`undefined`になる
- ビルド時に環境変数が埋め込まれるため、デプロイ後に変更しても反映されない

**解決方法:**
```bash
# Vercelで環境変数を設定
vercel env add VITE_API_BASE_URL production
# 値: （空文字列 = 相対パスを使用、またはバックエンドAPIのURL）
```

---

## 2. APIリクエストのルーティングの違い

### ローカル環境
```typescript
// vite.config.ts の proxy設定により、/api/* が自動的にバックエンドにプロキシされる
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```
- 開発サーバーが`/api/*`リクエストを`http://localhost:5000`にプロキシ
- バックエンドAPIが別ポートで動作していても、透過的に接続できる

### Vercel環境
- **プロキシ設定はビルド時には無効**
- `vercel.json`の`rewrites`設定でルーティングを制御
- 相対パス（`/api/*`）は同じドメインのAPI Routes（`api/`ディレクトリ）にルーティングされる
- 絶対パス（`https://...`）は外部APIに接続

**現在の設定:**
```json
{
  "rewrites": [
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```
- `/api/*`は除外され、VercelのAPI Routes（`api/`ディレクトリ）にルーティングされる

---

## 3. ビルド時の最適化とミニファイ

### ローカル環境（開発モード）
- ソースマップが有効
- ミニファイされない
- エラーメッセージが詳細
- ホットリロードで即座に変更が反映

### Vercel環境（本番モード）
- **コードがミニファイされる**（`vite.config.ts`の`minify: 'esbuild'`）
- ソースマップが無効（`sourcemap: false`）
- エラーメッセージが難読化される
- ビルド時に最適化が行われる

**問題点:**
- ミニファイにより、変数名が短縮され、デバッグが困難
- エラーメッセージが「Minified React error #31」のような形式になる
- ソースマップがないため、エラーの発生箇所を特定しにくい

**解決方法:**
```typescript
// vite.config.ts
build: {
  sourcemap: true,  // 本番環境でもソースマップを生成（デバッグ用）
}
```

---

## 4. タイミングと非同期処理の違い

### ローカル環境
- 開発サーバーが起動している間、常に最新のコードが実行される
- 非同期処理のタイミングが緩い

### Vercel環境
- **ビルド時にコードが静的に生成される**
- サーバーレス関数（API Routes）はコールドスタートの可能性がある
- 非同期処理のタイミングが厳密になる

**問題例:**
```typescript
// ローカルでは動作するが、Vercelでは失敗する可能性がある
useEffect(() => {
  // dashboardDataがundefinedの可能性がある
  const length = dashboardData.kpi_timeline.length;  // ❌ TypeError
}, [dashboardData]);
```

**解決方法:**
```typescript
// 安全なチェックを追加
useEffect(() => {
  if (dashboardData?.kpi_timeline && Array.isArray(dashboardData.kpi_timeline)) {
    const length = dashboardData.kpi_timeline.length;  // ✅ 安全
  }
}, [dashboardData]);
```

---

## 5. キャッシュとブラウザの挙動

### ローカル環境
- 開発サーバーが自動的にキャッシュを無効化
- ブラウザのキャッシュが影響しにくい

### Vercel環境
- **CDNキャッシュが有効**
- ブラウザが古いバージョンのJavaScriptファイルをキャッシュしている可能性がある
- デプロイ後も古いコードが実行されることがある

**解決方法:**
1. **ハードリフレッシュ**: `Ctrl+Shift+R`（Windows）または `Cmd+Shift+R`（Mac）
2. **キャッシュクリア**: ブラウザの開発者ツールでキャッシュを無効化
3. **Vercelの再デプロイ**: 新しいビルドを強制的に生成

---

## 6. API Routesの動作の違い

### ローカル環境
- バックエンドAPI（Flask）が`http://localhost:5000`で動作
- セッション管理が正常に動作
- CORS設定が緩い（同一オリジン）

### Vercel環境
- **API Routes（`api/`ディレクトリ）はサーバーレス関数**
- 各リクエストが独立した実行環境で処理される
- セッション管理が困難（ステートレス）
- CORS設定が必要（異なるオリジン）

**現在の実装:**
- モックAPI Routes（`api/auth/login.ts`など）を使用
- セッション管理は簡易的な実装

---

## 7. エラーハンドリングの違い

### ローカル環境
- エラーが詳細に表示される
- スタックトレースが読みやすい
- React DevToolsで状態を確認できる

### Vercel環境
- **エラーがミニファイされて表示される**
- スタックトレースが難読化される
- 本番環境ではエラー詳細が隠される

**問題例:**
```
// ローカル環境
TypeError: Cannot read properties of undefined (reading 'length')
  at IntegratedDashboard (IntegratedDashboard.tsx:142)

// Vercel環境
Uncaught TypeError: Cannot read properties of undefined (reading 'length')
  at O4 (index-BF7kr7Oa.js:28:142636)
```

---

## 8. データの初期化タイミング

### ローカル環境
- 開発サーバーがホットリロードで状態を保持
- データが即座に利用可能

### Vercel環境
- **初回レンダリング時にデータが`undefined`の可能性がある**
- APIレスポンスが遅延する可能性がある
- データが到着する前にコンポーネントがレンダリングされる

**解決方法:**
```typescript
// デフォルト値を設定
const [dashboardData, setDashboardData] = useState<IntegratedDashboardData>({
  kpi_timeline: [],
  japanese_proficiency: [],
});

// 安全なアクセス
const length = dashboardData?.kpi_timeline?.length || 0;
```

---

## よくあるエラーと解決方法

### エラー1: `Cannot read properties of undefined (reading 'length')`
**原因:** データが`undefined`の状態でアクセスしている

**解決方法:**
```typescript
// ❌ 危険
const length = data.array.length;

// ✅ 安全
const length = data?.array?.length || 0;
// または
if (data?.array && Array.isArray(data.array)) {
  const length = data.array.length;
}
```

### エラー2: `404 Not Found` for API endpoints
**原因:** API Routesが正しくデプロイされていない、またはパスが間違っている

**解決方法:**
1. `api/`ディレクトリにファイルが存在するか確認
2. `vercel.json`の`rewrites`設定を確認
3. 再デプロイ

### エラー3: `Minified React error #31`
**原因:** 本番ビルドでエラーが発生しているが、詳細が隠されている

**解決方法:**
1. ローカルで`npm run build && npm run preview`で本番ビルドをテスト
2. ソースマップを有効化してデバッグ
3. エラーハンドリングを追加

---

## デバッグのベストプラクティス

### 1. ローカルで本番ビルドをテスト
```bash
npm run build
npm run preview
```

### 2. 環境変数を確認
```bash
# Vercelの環境変数を確認
vercel env ls

# ローカルで環境変数をシミュレート
VITE_API_BASE_URL= npm run build
```

### 3. コンソールログを追加
```typescript
// デバッグ用ログ（本番環境では削除）
if (import.meta.env.DEV) {
  console.log('Debug info:', { data, state });
}
```

### 4. エラーバウンダリーを実装
```typescript
class ErrorBoundary extends React.Component {
  // エラーをキャッチして表示
}
```

---

## まとめ

| 項目 | ローカル環境 | Vercel環境 |
|------|------------|-----------|
| 環境変数 | `.env`ファイル | Vercelダッシュボードで設定 |
| APIルーティング | プロキシ設定 | `vercel.json`の`rewrites` |
| ビルド | 開発モード（非最適化） | 本番モード（最適化・ミニファイ） |
| エラーメッセージ | 詳細 | 難読化 |
| キャッシュ | 無効化 | CDNキャッシュ有効 |
| セッション管理 | 正常動作 | サーバーレス（ステートレス） |
| データ初期化 | 即座に利用可能 | 非同期で到着 |

**重要なポイント:**
1. **環境変数を必ず設定する**
2. **デフォルト値とnullチェックを追加する**
3. **ローカルで本番ビルドをテストする**
4. **エラーハンドリングを実装する**
5. **ブラウザのキャッシュをクリアする**

