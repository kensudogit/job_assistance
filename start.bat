@echo off
echo ========================================
echo 外国人就労支援システム 起動スクリプト
echo ========================================
echo.

echo [1/3] データベース初期化...
python -m src.init_db
if %errorlevel% neq 0 (
    echo データベース初期化に失敗しました
    pause
    exit /b 1
)

echo.
echo [2/3] バックエンドAPI起動中...
start "Job Assistance Backend" cmd /k "python -m src.api"
timeout /t 3 /nobreak >nul

echo.
echo [3/3] フロントエンド起動中...
start "Job Assistance Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo 起動完了！
echo ========================================
echo フロントエンド: http://localhost:3000
echo バックエンドAPI: http://localhost:5000
echo.
echo 各ウィンドウを閉じることでサービスを停止できます
echo ========================================
pause

