# レート制限リセット方法

## 問題

「Too many login attempts. Please try again later.」というエラーメッセージが表示される場合、レート制限（ブルートフォース攻撃対策）により一時的にブロックされています。

## レート制限の仕様

- **最大試行回数**: 5回
- **時間ウィンドウ**: 5分（300秒）
- **識別子**: IPアドレス

5分間に5回以上のログイン試行があると、そのIPアドレスからのログインが一時的にブロックされます。

## 対応方法

### 方法1: 時間を待つ（推奨）

5分間待つと、自動的にレート制限が解除されます。

### 方法2: レート制限をリセットするスクリプトを実行

#### すべてのレート制限をリセット

```bash
docker-compose exec backend python /app/reset_rate_limit.py
```

または、ホストマシンから：

```bash
cd C:\devlop\job_assistance
docker cp reset_rate_limit.py job_assistance_backend:/app/reset_rate_limit.py
docker-compose exec backend python /app/reset_rate_limit.py
```

#### 特定のIPアドレスのレート制限をリセット

```bash
docker-compose exec backend python /app/reset_rate_limit.py 127.0.0.1
```

### 方法3: バックエンドコンテナを再起動

レート制限はメモリ内に保存されているため、バックエンドコンテナを再起動するとすべてのレート制限がリセットされます。

```bash
docker-compose restart backend
```

### 方法4: レート制限の設定を調整（開発環境のみ）

開発環境でレート制限を緩和する場合は、`src/api.py`の以下の行を変更：

```python
# 現在の設定（5分間に5回）
if not check_rate_limit(client_ip, max_attempts=5, window_seconds=300):

# 緩和した設定（例: 5分間に20回）
if not check_rate_limit(client_ip, max_attempts=20, window_seconds=300):
```

変更後、バックエンドコンテナを再起動：

```bash
docker-compose restart backend
```

## 注意事項

- **本番環境では、レート制限を緩和しないでください。** セキュリティ上のリスクがあります。
- レート制限はIPアドレスベースで動作します。同じネットワーク上の複数のユーザーが同じIPアドレスを使用している場合、共有される可能性があります。
- レート制限はメモリ内に保存されているため、バックエンドコンテナを再起動するとリセットされます。

## トラブルシューティング

### レート制限が解除されない場合

1. バックエンドコンテナのログを確認：
   ```bash
   docker-compose logs backend | grep -i "rate\|login"
   ```

2. バックエンドコンテナを再起動：
   ```bash
   docker-compose restart backend
   ```

3. レート制限リセットスクリプトを実行：
   ```bash
   docker-compose exec backend python /app/reset_rate_limit.py
   ```

