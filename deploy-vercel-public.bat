@echo off
REM Vercel完全公開モードデプロイスクリプト
REM このスクリプトは、Vercelに完全公開モードでデプロイします

echo ========================================
echo Vercel完全公開モードデプロイ
echo ========================================
echo.

REM プロジェクトディレクトリに移動
cd /d "%~dp0"

REM Vercel CLIがインストールされているか確認
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo [エラー] Vercel CLIがインストールされていません。
    echo 以下のコマンドでインストールしてください:
    echo npm install -g vercel
    pause
    exit /b 1
)

echo [1/5] Vercel CLIのバージョンを確認...
vercel --version
echo.

echo [2/5] ログイン状態を確認...
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] Vercelにログインしていません。ログインを実行します...
    vercel login
    if %errorlevel% neq 0 (
        echo [エラー] ログインに失敗しました。
        pause
        exit /b 1
    )
) else (
    vercel whoami
)
echo.

echo [3/5] プロジェクトのリンク状態を確認...
if not exist ".vercel" (
    echo [情報] プロジェクトがリンクされていません。リンクを実行します...
    vercel link
    if %errorlevel% neq 0 (
        echo [エラー] プロジェクトのリンクに失敗しました。
        pause
        exit /b 1
    )
) else (
    echo [情報] プロジェクトは既にリンクされています。
)
echo.

echo [4/5] 環境変数の確認...
vercel env ls
echo.
echo [重要] VITE_API_BASE_URLが設定されているか確認してください。
echo 設定されていない場合は、以下のコマンドで設定してください:
echo vercel env add VITE_API_BASE_URL production
echo.
pause
echo.

echo [5/5] 本番環境にデプロイを開始...
echo.
vercel --prod --yes
if %errorlevel% neq 0 (
    echo [エラー] デプロイに失敗しました。
    pause
    exit /b 1
)

echo.
echo ========================================
echo デプロイ完了！
echo ========================================
echo.
echo デプロイURLを確認するには:
echo vercel ls
echo.
echo ログを確認するには:
echo vercel logs
echo.
pause

