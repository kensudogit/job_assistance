#!/bin/bash
# Vercelデプロイスクリプト

echo "Vercelデプロイを開始します..."

# プロジェクトがリンクされているか確認
if [ ! -d ".vercel" ]; then
    echo "初回デプロイのため、プロジェクトをリンクします..."
    vercel link
fi

# 環境変数の確認
echo "環境変数を確認します..."
echo "VITE_API_BASE_URL が設定されているか確認してください。"
echo "設定されていない場合、以下のコマンドで設定できます："
echo "vercel env add VITE_API_BASE_URL production"

# 本番環境にデプロイ
echo "本番環境にデプロイします..."
vercel --prod

echo "デプロイが完了しました！"

