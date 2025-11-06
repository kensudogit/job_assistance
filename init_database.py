"""
データベース初期化スクリプト（直接実行用）
このスクリプトを実行すると、すべてのデータベーステーブルが作成されます。

使用方法:
    python init_database.py

環境変数:
    DB_HOST: データベースホスト（デフォルト: localhost）
    DB_PORT: データベースポート（デフォルト: 5432）
    DB_NAME: データベース名（デフォルト: job_assistance）
    DB_USER: データベースユーザー（デフォルト: postgres）
    DB_PASSWORD: データベースパスワード（デフォルト: postgres）
"""
import sys
import os

# プロジェクトルートをパスに追加（srcモジュールをインポート可能にする）
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database import Database

if __name__ == '__main__':
    print("データベースを初期化しています...")
    try:
        # データベースインスタンスを作成
        db = Database()
        # すべてのテーブルを作成
        db.init_database()
        print("✓ データベースの初期化が完了しました。")
        print("✓ すべてのテーブルが作成されました。")
    except Exception as e:
        print(f"✗ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

