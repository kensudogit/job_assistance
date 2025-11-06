# クイックスタートガイド

## 起動方法

### 方法1: 起動スクリプトを使用（推奨）

**Windows:**
```powershell
.\start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### 方法2: Docker Composeを使用

```powershell
docker-compose up -d
```

### 方法3: 手動起動

#### 1. データベースの初期化
```powershell
python -m src.init_db
```

#### 2. バックエンドAPI起動
```powershell
python -m src.api
```

別のターミナルで:

#### 3. フロントエンド起動
```powershell
npm run dev
```

## アクセスURL

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:5000
- **API ヘルスチェック**: http://localhost:5000/api/health

## トラブルシューティング

### ポートが既に使用されている場合

- ポート3000が使用中: フロントエンドのポートを変更
- ポート5000が使用中: バックエンドのポートを変更
- ポート5432が使用中: PostgreSQLのポートを変更（docker-compose.ymlで5434に変更済み）

### データベース接続エラー

`.env`ファイルを作成し、以下の環境変数を設定:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=job_assistance
DB_USER=postgres
DB_PASSWORD=postgres
```

### 依存関係のインストール

```powershell
# フロントエンド
npm install

# バックエンド
pip install -r requirements.txt
```

