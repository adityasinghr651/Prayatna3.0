#!/bin/bash
set -e

echo "══════════════════════════════════════════"
echo " Urban Risk Intelligence Platform"
echo " Starting backend services..."
echo "══════════════════════════════════════════"

# Wait for PostgreSQL to be fully ready
echo "[Entrypoint] Waiting for PostgreSQL..."
until python -c "
import psycopg2
import os
conn = psycopg2.connect(os.environ.get('SYNC_DATABASE_URL'))
conn.close()
print('PostgreSQL ready.')
" 2>/dev/null; do
  echo "[Entrypoint] PostgreSQL not ready — retrying in 3s..."
  sleep 3
done

# Train ML model if not already trained
MODEL_PATH="app/ml/model.pkl"
if [ ! -f "$MODEL_PATH" ]; then
  echo "[Entrypoint] model.pkl not found — training XGBoost model..."
  python -m app.ml.train
  echo "[Entrypoint] Model training complete."
else
  echo "[Entrypoint] model.pkl found — skipping training."
fi

echo "[Entrypoint] Starting FastAPI server..."
exec "$@"