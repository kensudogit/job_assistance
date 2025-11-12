"""
APIモジュールのエントリーポイント
python -m src として実行できるようにする
"""
import os
import sys

# モジュールとして実行するため、api.pyをインポート
# これにより相対インポートが正しく動作する
from . import api

if __name__ == '__main__':
    # api.pyの最後の部分（if __name__ == '__main__'）を実行
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    # WebSocket対応のため、socketio.run()を使用
    api.socketio.run(api.app, host='0.0.0.0', port=port, debug=debug, use_reloader=False)

