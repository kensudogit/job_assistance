# MFA（多要素認証）テストガイド

このガイドでは、MFA機能をテストする方法を説明します。

## 前提条件

- Dockerコンテナが起動していること
- テスト用のユーザーが存在すること（既存のユーザーを使用可能）

## テスト用ユーザー

既存のユーザーを使用するか、新規登録APIでユーザーを作成してください。

### 既存ユーザー（create_mock_data.pyで作成済みの場合）
- **管理者**: `username='admin'`, `password='admin123'`
- **訓練生1**: `username='trainee1'`, `password='trainee1123'`
- **訓練生2**: `username='trainee2'`, `password='trainee2123'`
- **訓練生3**: `username='trainee3'`, `password='trainee3123'`

## テスト手順

### 1. ログイン（MFA無効時）

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' \
  -c cookies.txt
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "administrator",
    "worker_id": null,
    "mfa_enabled": false
  },
  "csrf_token": "..."
}
```

### 2. MFA設定開始

```bash
curl -X POST http://localhost:5000/api/auth/mfa/setup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qr_code": "data:image/png;base64,..."
  }
}
```

**次のステップ:**
1. `qr_code`のBase64データをデコードしてQRコード画像を表示
2. Google AuthenticatorやMicrosoft AuthenticatorでQRコードをスキャン
3. アプリに表示される6桁のコードをメモ

### 3. MFA有効化

```bash
curl -X POST http://localhost:5000/api/auth/mfa/enable \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d '{
    "code": "123456"
  }'
```

**注意:** `code`には、認証アプリに表示される6桁のコードを入力してください。

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "backup_codes": [
      "ABCD1234",
      "EFGH5678",
      ...
    ]
  },
  "message": "MFA has been enabled. Please save your backup codes in a safe place."
}
```

**重要:** バックアップコードを安全な場所に保存してください。MFAデバイスが利用できない場合に使用します。

### 4. ログアウト

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

### 5. MFA有効時のログイン（MFAコード使用）

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "mfa_code": "123456"
  }' \
  -c cookies.txt
```

**注意:** `mfa_code`には、認証アプリに表示される6桁のコードを入力してください。

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "administrator",
    "worker_id": null,
    "mfa_enabled": true
  },
  "csrf_token": "..."
}
```

### 6. MFA有効時のログイン（バックアップコード使用）

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "backup_code": "ABCD1234"
  }' \
  -c cookies.txt
```

**注意:** バックアップコードは1回使用すると削除されます。

### 7. MFA無効化

```bash
curl -X POST http://localhost:5000/api/auth/mfa/disable \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d '{
    "password": "admin123"
  }'
```

または、MFAコードを使用:

```bash
curl -X POST http://localhost:5000/api/auth/mfa/disable \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d '{
    "mfa_code": "123456"
  }'
```

### 8. バックアップコード再生成

```bash
curl -X POST http://localhost:5000/api/auth/mfa/backup-codes \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt
```

**注意:** 既存のバックアップコードは無効化されます。

## エラーケースのテスト

### MFAコードなしでログイン（MFA有効時）

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**期待されるレスポンス:**
```json
{
  "success": false,
  "error": "MFA code or backup code is required",
  "mfa_required": true
}
```

### 無効なMFAコードでログイン

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "mfa_code": "000000"
  }'
```

**期待されるレスポンス:**
```json
{
  "success": false,
  "error": "Invalid MFA code or backup code"
}
```

## テスト用Pythonスクリプト

`test_mfa.py`スクリプトを使用して、自動的にMFAテストを実行できます。

```bash
python test_mfa.py
```

## 注意事項

1. **時間同期**: TOTPコードは時間ベースです。サーバーとクライアントの時計が同期している必要があります。
2. **時間窓**: システムは±1の時間窓を許容します（約30秒のずれまで許容）。
3. **バックアップコード**: バックアップコードは1回使用すると削除されます。安全な場所に保存してください。
4. **セッション管理**: テスト時は`-c cookies.txt`と`-b cookies.txt`を使用してセッションを維持してください。

