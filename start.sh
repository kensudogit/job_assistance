#!/bin/bash

echo "========================================"
echo "外国人就労支援システム 起動スクリプト"
echo "========================================"
echo ""

echo "[1/3] データベース初期化..."
python -m src.init_db
if [ $? -ne 0 ]; then
    echo "データベース初期化に失敗しました"
    exit 1
fi

echo ""
echo "[2/3] バックエンドAPI起動中..."
python -m src.api &
BACKEND_PID=$!
sleep 3

echo ""
echo "[3/3] フロントエンド起動中..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "起動完了！"
echo "========================================"
echo "フロントエンド: http://localhost:3000"
echo "バックエンドAPI: http://localhost:5000"
echo ""
echo "停止するには Ctrl+C を押してください"
echo "========================================"

# シグナルハンドリング
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# プロセスが終了するまで待機
wait

