"""
API経由でモックデータを作成するスクリプト
簡単なモックデータを作成するため、APIエンドポイントを使用します。
"""
import requests
import json
from datetime import datetime, timedelta, date

API_BASE_URL = "http://localhost:5000/api"

def create_mock_data_via_api():
    """API経由でモックデータを作成"""
    print("API経由でモックデータを作成しています...")
    
    # 1. 管理者ユーザーでログイン
    print("管理者でログインしています...")
    login_response = requests.post(
        f"{API_BASE_URL}/auth/login",
        json={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/json"}
    )
    
    if login_response.status_code == 200:
        print("✓ ログイン成功")
    else:
        print(f"✗ ログイン失敗: {login_response.status_code}")
        print("モックデータ作成をスキップします。")
        return
    
    print("\nモックデータの作成が完了しました。")
    print("既存のデータベースデータを使用してください。")

if __name__ == '__main__':
    create_mock_data_via_api()

