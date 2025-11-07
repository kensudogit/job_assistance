# Dockerコンテナ再起動手順

## 問題の状況
バックエンドコンテナが`unhealthy`状態になっている可能性があります。

## 再起動手順

### 1. すべてのコンテナを停止
```bash
cd C:\devlop\job_assistance
docker-compose down
```

### 2. コンテナを再起動
```bash
docker-compose up -d
```

### 3. コンテナの状態を確認
```bash
docker-compose ps
```

### 4. バックエンドのログを確認（問題がある場合）
```bash
docker-compose logs backend
```

### 5. すべてのログを確認
```bash
docker-compose logs
```

## ヘルスチェックエンドポイント
バックエンドのヘルスチェックエンドポイント: `http://localhost:5000/api/health`

## トラブルシューティング

### バックエンドが`unhealthy`の場合
1. バックエンドのログを確認:
   ```bash
   docker-compose logs backend --tail 50
   ```

2. データベース接続を確認:
   ```bash
   docker-compose logs db --tail 20
   ```

3. バックエンドコンテナ内でヘルスチェックを手動実行:
   ```bash
   docker exec job_assistance_backend curl -f http://localhost:5000/api/health
   ```

### コンテナを完全に再構築する場合
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

