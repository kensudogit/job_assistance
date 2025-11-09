#!/usr/bin/env python3
"""
MFAを有効化してテストするスクリプト
"""
import requests
import pyotp
import json

BASE_URL = "http://localhost:5000"

# セッションを作成
session = requests.Session()

# ログイン
print("1. ログイン中...")
login_response = session.post(
    f"{BASE_URL}/api/auth/login",
    json={"username": "admin", "password": "admin123"},
    headers={"Content-Type": "application/json"}
)
print(f"   ログイン結果: {login_response.status_code}")
print(f"   レスポンス: {login_response.json()}")
print(f"   Cookie: {session.cookies.get_dict()}")

if login_response.status_code != 200:
    print("   ログインに失敗しました")
    exit(1)

# MFA設定を開始
print("\n2. MFA設定を開始...")
setup_response = session.post(f"{BASE_URL}/api/auth/mfa/setup")
print(f"   設定結果: {setup_response.status_code}")
setup_data = setup_response.json()
print(f"   レスポンス: {json.dumps(setup_data, indent=2)}")

if setup_response.status_code != 200:
    print("   MFA設定に失敗しました")
    exit(1)

secret = setup_data["data"]["secret"]
print(f"\n   シークレットキー: {secret}")

# MFAコードを生成
totp = pyotp.TOTP(secret)
mfa_code = totp.now()
print(f"   生成されたMFAコード: {mfa_code}")

# MFAを有効化
print("\n3. MFAを有効化中...")
enable_response = session.post(
    f"{BASE_URL}/api/auth/mfa/enable",
    json={"code": mfa_code}
)
print(f"   有効化結果: {enable_response.status_code}")
enable_data = enable_response.json()
print(f"   レスポンス: {json.dumps(enable_data, indent=2)}")

if enable_response.status_code != 200:
    print("   MFA有効化に失敗しました")
    exit(1)

backup_codes = enable_data["data"]["backup_codes"]
print(f"\n   バックアップコード: {backup_codes}")

# ログアウト
print("\n4. ログアウト中...")
session.post(f"{BASE_URL}/api/auth/logout")

# MFAが有効な状態でログインを試みる（MFAコードなし）
print("\n5. MFAが有効な状態でログインを試みる（MFAコードなし）...")
login_response2 = session.post(
    f"{BASE_URL}/api/auth/login",
    json={"username": "admin", "password": "admin123"}
)
print(f"   ログイン結果: {login_response2.status_code}")
login_data2 = login_response2.json()
print(f"   レスポンス: {json.dumps(login_data2, indent=2)}")

if login_response2.status_code == 401 and login_data2.get("mfa_required"):
    print("\n   ✓ MFAが必要な場合のレスポンスが正しく返されました！")
    print(f"   mfa_required: {login_data2.get('mfa_required')}")
else:
    print("\n   ✗ MFAが必要な場合のレスポンスが返されませんでした")
    print(f"   期待: status=401, mfa_required=True")
    print(f"   実際: status={login_response2.status_code}, mfa_required={login_data2.get('mfa_required')}")

# MFAコード付きでログインを試みる
print("\n6. MFAコード付きでログインを試みる...")
mfa_code2 = totp.now()
print(f"   使用するMFAコード: {mfa_code2}")
login_response3 = session.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "username": "admin",
        "password": "admin123",
        "mfa_code": mfa_code2
    }
)
print(f"   ログイン結果: {login_response3.status_code}")
login_data3 = login_response3.json()
print(f"   レスポンス: {json.dumps(login_data3, indent=2)}")

if login_response3.status_code == 200:
    print("\n   ✓ MFAコード付きログインが成功しました！")
else:
    print("\n   ✗ MFAコード付きログインに失敗しました")

print("\nテスト完了！")

