#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
    sleep 1
done

echo "PostgreSQL is ready!"

echo "Initializing database..."
python -m src.init_db

echo "Starting Flask API..."
exec "$@"

