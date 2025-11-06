"""
データベース初期化スクリプト
"""
from .database import Database

if __name__ == '__main__':
    db = Database()
    db.init_database()
    print("データベースの初期化が完了しました。")

