"""
MFA機能のテストスクリプト
自動的にMFA機能をテストします。

使用方法:
    python test_mfa.py
"""
import requests
import json
import base64
import io
from PIL import Image
import pyotp
import time

BASE_URL = "http://localhost:5000"
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin123"

def test_mfa():
    """MFA機能をテスト"""
    session = requests.Session()
    
    print("=" * 60)
    print("MFA機能テスト開始")
    print("=" * 60)
    
    # 1. ログイン（MFA無効時）
    print("\n[1] ログイン（MFA無効時）...")
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        }
    )
    
    if response.status_code != 200:
        print(f"✗ ログイン失敗: {response.status_code}")
        print(response.json())
        return False
    
    data = response.json()
    if not data.get('success'):
        print(f"✗ ログイン失敗: {data.get('error')}")
        return False
    
    print(f"✓ ログイン成功: {data['data']['username']}")
    print(f"  MFA有効: {data['data'].get('mfa_enabled', False)}")
    
    # 2. MFA設定開始
    print("\n[2] MFA設定開始...")
    response = session.post(f"{BASE_URL}/api/auth/mfa/setup")
    
    if response.status_code != 200:
        print(f"✗ MFA設定開始失敗: {response.status_code}")
        print(response.json())
        return False
    
    data = response.json()
    if not data.get('success'):
        print(f"✗ MFA設定開始失敗: {data.get('error')}")
        return False
    
    secret = data['data']['secret']
    qr_code_data = data['data']['qr_code']
    
    print(f"✓ MFA設定開始成功")
    print(f"  シークレットキー: {secret}")
    
    # QRコードを保存（オプション）
    if qr_code_data.startswith('data:image/png;base64,'):
        try:
            img_data = base64.b64decode(qr_code_data.split(',')[1])
            img = Image.open(io.BytesIO(img_data))
            img.save('mfa_qr_code.png')
            print(f"  QRコードを 'mfa_qr_code.png' に保存しました")
        except Exception as e:
            print(f"  QRコードの保存に失敗: {e}")
    
    # 3. TOTPコードを生成してMFA有効化
    print("\n[3] MFA有効化...")
    totp = pyotp.TOTP(secret)
    mfa_code = totp.now()
    
    print(f"  生成されたMFAコード: {mfa_code}")
    print(f"  （このコードを認証アプリで確認してください）")
    
    # 少し待ってから有効化（コードが有効であることを確認）
    time.sleep(1)
    
    response = session.post(
        f"{BASE_URL}/api/auth/mfa/enable",
        json={"code": mfa_code}
    )
    
    if response.status_code != 200:
        print(f"✗ MFA有効化失敗: {response.status_code}")
        print(response.json())
        return False
    
    data = response.json()
    if not data.get('success'):
        print(f"✗ MFA有効化失敗: {data.get('error')}")
        return False
    
    backup_codes = data['data']['backup_codes']
    print(f"✓ MFA有効化成功")
    print(f"  バックアップコード: {backup_codes[:3]}... (合計{len(backup_codes)}個)")
    
    # 4. ログアウト
    print("\n[4] ログアウト...")
    response = session.post(f"{BASE_URL}/api/auth/logout")
    
    if response.status_code != 200:
        print(f"✗ ログアウト失敗: {response.status_code}")
        return False
    
    print("✓ ログアウト成功")
    
    # 5. MFAコードなしでログイン（エラー確認）
    print("\n[5] MFAコードなしでログイン（エラー確認）...")
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        }
    )
    
    if response.status_code == 401:
        data = response.json()
        if data.get('mfa_required'):
            print("✓ MFAコード要求が正しく返されました")
        else:
            print(f"✗ MFAコード要求が返されませんでした: {data}")
            return False
    else:
        print(f"✗ 期待されるエラーが返されませんでした: {response.status_code}")
        return False
    
    # 6. MFAコードありでログイン
    print("\n[6] MFAコードありでログイン...")
    mfa_code = totp.now()
    print(f"  使用するMFAコード: {mfa_code}")
    
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
            "mfa_code": mfa_code
        }
    )
    
    if response.status_code != 200:
        print(f"✗ ログイン失敗: {response.status_code}")
        print(response.json())
        return False
    
    data = response.json()
    if not data.get('success'):
        print(f"✗ ログイン失敗: {data.get('error')}")
        return False
    
    print(f"✓ ログイン成功: {data['data']['username']}")
    print(f"  MFA有効: {data['data'].get('mfa_enabled', False)}")
    
    # 7. バックアップコードでログイン（テスト）
    print("\n[7] バックアップコードでログイン（テスト）...")
    session.post(f"{BASE_URL}/api/auth/logout")
    
    if backup_codes:
        backup_code = backup_codes[0]
        print(f"  使用するバックアップコード: {backup_code}")
        
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "username": TEST_USERNAME,
                "password": TEST_PASSWORD,
                "backup_code": backup_code
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✓ バックアップコードでログイン成功")
            else:
                print(f"✗ バックアップコードでログイン失敗: {data.get('error')}")
                return False
        else:
            print(f"✗ バックアップコードでログイン失敗: {response.status_code}")
            print(response.json())
            return False
    
    # 8. MFA無効化
    print("\n[8] MFA無効化...")
    response = session.post(
        f"{BASE_URL}/api/auth/mfa/disable",
        json={"password": TEST_PASSWORD}
    )
    
    if response.status_code != 200:
        print(f"✗ MFA無効化失敗: {response.status_code}")
        print(response.json())
        return False
    
    data = response.json()
    if not data.get('success'):
        print(f"✗ MFA無効化失敗: {data.get('error')}")
        return False
    
    print("✓ MFA無効化成功")
    
    # 9. 最終確認：MFA無効時のログイン
    print("\n[9] 最終確認：MFA無効時のログイン...")
    session.post(f"{BASE_URL}/api/auth/logout")
    
    response = session.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and not data['data'].get('mfa_enabled', False):
            print("✓ MFA無効時のログイン成功")
        else:
            print(f"✗ ログイン失敗: {data}")
            return False
    else:
        print(f"✗ ログイン失敗: {response.status_code}")
        return False
    
    print("\n" + "=" * 60)
    print("✓ すべてのテストが成功しました！")
    print("=" * 60)
    
    return True

if __name__ == '__main__':
    try:
        success = test_mfa()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

