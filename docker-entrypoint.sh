#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0

while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "ERROR: PostgreSQL is not ready after $max_attempts attempts"
        exit 1
    fi
    echo "Waiting for PostgreSQL... ($attempt/$max_attempts)"
    sleep 2
done

echo "PostgreSQL is ready!"

echo "Initializing database..."
python -m src.init_db || echo "Warning: Database initialization may have failed, continuing..."

echo "Starting Flask API..."
# CMDで指定されたコマンドを実行、またはデフォルトでapi.pyを実行
if [ "$#" -eq 0 ] || [ "$1" = "" ]; then
    # モジュールとして実行（相対インポートが正しく動作する）
    # PYTHONPATHを設定してからモジュールとして実行
    export PYTHONPATH=/app:$PYTHONPATH
    exec python -u -m src
else
    exec "$@"
fi

