# 情報の登録先について

## 概要
保存ボタンをクリックした際に、登録された情報が保存される場所とフローを説明します。

## データフロー

### 1. フロントエンド（React/Vite）
- **コンポーネント**: `components/WorkerForm.tsx`
- **API呼び出し**: `lib/api.ts`の`workerApi.create()`または`workerApi.update()`

### 2. バックエンドAPI（Flask）
- **エンドポイント**: 
  - 新規登録: `POST /api/workers`
  - 更新: `PUT /api/workers/<worker_id>`
- **実装**: `src/api.py`の`WorkerListResource.post()`または`WorkerResource.put()`

### 3. データベース（PostgreSQL）
- **データベース名**: `job_assistance`（デフォルト）
- **テーブル名**: `workers`
- **保存場所**: Dockerコンテナ内のPostgreSQLデータベース

## 詳細情報

### APIエンドポイント

#### 新規登録
- **URL**: `http://localhost:5000/api/workers`
- **メソッド**: `POST`
- **リクエストボディ**: 就労者情報（JSON形式）
- **レスポンス**: 登録された就労者情報（JSON形式）

#### 更新
- **URL**: `http://localhost:5000/api/workers/<worker_id>`
- **メソッド**: `PUT`
- **リクエストボディ**: 更新する就労者情報（JSON形式）
- **レスポンス**: 更新された就労者情報（JSON形式）

### データベース接続情報

#### Docker環境
- **ホスト**: `db`（Dockerコンテナ名）
- **ポート**: `5432`（コンテナ内）
- **データベース名**: `job_assistance`
- **ユーザー名**: `postgres`（デフォルト）
- **パスワード**: `postgres`（デフォルト）

#### ローカル環境（Docker外から接続する場合）
- **ホスト**: `localhost`
- **ポート**: `5434`（ホスト側）
- **データベース名**: `job_assistance`
- **ユーザー名**: `postgres`
- **パスワード**: `postgres`

### データベーステーブル構造

#### `workers`テーブル
- **主キー**: `id` (Integer)
- **カラム**:
  - `id`: 就労者ID（自動採番）
  - `name`: 名前（String(100)）
  - `name_kana`: カナ名（String(100)）
  - `email`: メールアドレス（String(100)）
  - `phone`: 電話番号（String(500) - 暗号化済み）
  - `address`: 住所（String(200) - 暗号化済み）
  - `birth_date`: 生年月日（Date）
  - `nationality`: 国籍（String(100)）
  - `native_language`: 母国語（String(50)）
  - `visa_status`: 在留資格（String(50)）
  - `visa_expiry_date`: 在留期限（Date）
  - `japanese_level`: 日本語レベル（String(20)）
  - `english_level`: 英語レベル（String(20)）
  - `skills`: スキル（Text）
  - `experience_years`: 経験年数（Integer）
  - `education`: 学歴（String(200)）
  - `current_status`: 現在のステータス（String(50)）
  - `notes`: 備考（Text）
  - `created_at`: 作成日時（DateTime）
  - `updated_at`: 更新日時（DateTime）

### データの保存場所

#### Docker環境
- **データベースファイル**: Dockerボリューム`postgres_data`に保存
- **ボリュームマウント**: `/var/lib/postgresql/data`（コンテナ内）
- **永続化**: Dockerボリュームにより、コンテナを再起動してもデータは保持されます

#### データベース接続確認方法

```bash
# Dockerコンテナに接続
docker exec -it job_assistance_db psql -U postgres -d job_assistance

# 就労者一覧を確認
SELECT * FROM workers;

# 特定の就労者情報を確認
SELECT * FROM workers WHERE id = 1;
```

### セキュリティ対策

#### 暗号化
- **電話番号**: `encrypt_sensitive_data()`で暗号化して保存
- **住所**: `encrypt_sensitive_data()`で暗号化して保存
- **復号化**: 取得時に`decrypt_sensitive_data()`で復号化

#### 入力検証
- **XSS対策**: `sanitize_input()`でサニタイゼーション
- **SQLインジェクション対策**: `validate_sql_input()`で入力検証

## データの確認方法

### 1. ブラウザの開発者ツール
- **Networkタブ**: APIリクエスト/レスポンスを確認
- **Consoleタブ**: コンソールログで登録情報を確認

### 2. データベース直接確認
```bash
# Dockerコンテナに接続
docker exec -it job_assistance_db psql -U postgres -d job_assistance

# 就労者一覧を確認
SELECT id, name, email, current_status, created_at FROM workers ORDER BY created_at DESC;
```

### 3. バックエンドログ
```bash
# バックエンドコンテナのログを確認
docker-compose logs backend
```

## 参考情報

- **APIエンドポイント**: `src/api.py`の`WorkerListResource`と`WorkerResource`
- **データベースモデル**: `src/database.py`の`Worker`クラス
- **フロントエンドAPI**: `lib/api.ts`の`workerApi`

