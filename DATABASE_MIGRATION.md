# データベースマイグレーション手順

## 修正内容
`training_sessions`テーブルの`worker_id`カラムを`NULL`を許可するように変更しました。

## マイグレーション実行手順

### 1. Dockerコンテナを再起動
```bash
cd C:\devlop\job_assistance
docker-compose restart backend
```

### 2. または、完全に再起動する場合
```bash
cd C:\devlop\job_assistance
docker-compose down
docker-compose up -d
```

### 3. バックエンドのログを確認
```bash
docker-compose logs backend --tail 50
```

以下のメッセージが表示されれば、マイグレーションが成功しています：
- `training_sessionsテーブルのworker_idカラムをNULLを許可するように変更しました。`
- または `training_sessionsテーブルのworker_idカラムは既にNULLを許可しています。`

## 確認方法
マイグレーションが成功したら、Unityシミュレーターで訓練セッションを送信して、エラーが発生しないことを確認してください。

