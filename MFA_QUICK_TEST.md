# MFA機能 クイックテストガイド

## 前提条件

- Dockerコンテナが起動していること
- テスト用のユーザーが存在すること

## テスト用ユーザー

既存のユーザーを使用してください：
- **管理者**: `username='admin'`, `password='admin123'`

## クイックテスト手順

### 1. ログイン

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" \
  -c cookies.txt
```

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "id": 2,
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

**レスポンスから以下を取得:**
- `secret`: シークレットキー（例: `KBMHPZ4NK5A7PISCD2SCAEE44KR2OJHI`）
- `qr_code`: QRコード画像（Base64エンコード）

### 3. QRコードを表示（オプション）

QRコードのBase64データをデコードして画像として保存できます。

**Pythonスクリプト例:**
```python
import base64
from PIL import Image
import io

qr_code_data = "data:image/png;base64,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"

# Base64データをデコード
img_data = base64.b64decode(qr_code_data.split(',')[1])
img = Image.open(io.BytesIO(img_data))
img.save('mfa_qr_code.png')
print("QRコードを 'mfa_qr_code.png' に保存しました")
```

### 4. TOTPコードを生成

**Pythonスクリプト例:**
```python
import pyotp

secret = "KBMHPZ4NK5A7PISCD2SCAEE44KR2OJHI"  # ステップ2で取得したシークレットキー
totp = pyotp.TOTP(secret)
mfa_code = totp.now()
print(f"MFAコード: {mfa_code}")
```

または、Google AuthenticatorやMicrosoft AuthenticatorでQRコードをスキャンしてコードを取得してください。

### 5. MFA有効化

```bash
curl -X POST http://localhost:5000/api/auth/mfa/enable \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d "{\"code\":\"123456\"}"
```

**注意:** `code`には、ステップ4で生成した6桁のコードを入力してください。

**期待されるレスポンス:**
```json
{
  "success": true,
  "data": {
    "backup_codes": ["ABCD1234", "EFGH5678", ...]
  },
  "message": "MFA has been enabled. Please save your backup codes in a safe place."
}
```

**重要:** バックアップコードを安全な場所に保存してください。

### 6. ログアウト

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

### 7. MFA有効時のログイン（MFAコード使用）

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\",\"mfa_code\":\"123456\"}" \
  -c cookies.txt
```

**注意:** `mfa_code`には、認証アプリに表示される6桁のコードを入力してください。

### 8. MFA有効時のログイン（バックアップコード使用）

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\",\"backup_code\":\"ABCD1234\"}" \
  -c cookies.txt
```

**注意:** バックアップコードは1回使用すると削除されます。

## テスト完了

MFA機能が正常に動作していることを確認できました！

## 追加のテスト

### MFA無効化

```bash
curl -X POST http://localhost:5000/api/auth/mfa/disable \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt \
  -d "{\"password\":\"admin123\"}"
```

### バックアップコード再生成

```bash
curl -X POST http://localhost:5000/api/auth/mfa/backup-codes \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -c cookies.txt
```

**注意:** 既存のバックアップコードは無効化されます。

