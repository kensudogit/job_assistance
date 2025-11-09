#!/usr/bin/env python3
"""
レート制限をリセットするスクリプト
"""
import sys
import os

# プロジェクトルートをパスに追加
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.security import login_attempts, reset_rate_limit

def main():
    """レート制限をリセット"""
    print("レート制限をリセットします...")
    
    # 現在のレート制限状態を表示
    if login_attempts:
        print(f"\n現在ブロックされているIPアドレス: {len(login_attempts)}件")
        for ip, attempts in login_attempts.items():
            print(f"  - {ip}: {len(attempts)}回の試行")
    else:
        print("\n現在ブロックされているIPアドレスはありません。")
    
    # すべてのレート制限をリセット
    if len(sys.argv) > 1:
        # 特定のIPアドレスをリセット
        ip_address = sys.argv[1]
        if ip_address in login_attempts:
            reset_rate_limit(ip_address)
            print(f"\n✓ IPアドレス {ip_address} のレート制限をリセットしました。")
        else:
            print(f"\n✗ IPアドレス {ip_address} はブロックされていません。")
    else:
        # すべてのレート制限をリセット
        ips_to_reset = list(login_attempts.keys())
        for ip in ips_to_reset:
            reset_rate_limit(ip)
        
        if ips_to_reset:
            print(f"\n✓ {len(ips_to_reset)}件のレート制限をリセットしました。")
        else:
            print("\nリセットするレート制限はありません。")
    
    print("\n完了！")

if __name__ == "__main__":
    main()

