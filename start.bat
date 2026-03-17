@echo off
title Urban Risk Intelligence Platform
color 0A
cls

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║     URBAN RISK INTELLIGENCE PLATFORM            ║
echo  ║     Prayatna 3.0 - Indore                       ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ── Step 1: Check Redis via WSL ──────────────────────────────
echo [1/5] Starting Redis...
echo Redis running via Memurai (Windows Service)
timeout /t 2 /nobreak >nul


:: Verify Redis
wsl redis-cli ping > temp_redis.txt 2>&1
findstr /i "PONG" temp_redis.txt >nul
if %errorlevel%==0 (
    echo      Redis: OK
) else (
    echo      Redis: FAILED - Check WSL
    echo      Fix: Open WSL and run: sudo service redis-server start
    pause
    exit /b 1
)
del temp_redis.txt
echo.

:: ── Step 2: Start FastAPI Backend ────────────────────────────
echo [2/5] Starting FastAPI Backend...
start "BACKEND - FastAPI" cmd /k "cd /d C:\Users\adity\Documents\Prayatna 3.0\backend && venv\Scripts\activate && echo Backend starting... && uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000"
echo      Waiting for backend to start...
timeout /t 8 /nobreak >nul

:: Verify Backend
curl -s http://localhost:8000/api/health > temp_health.txt 2>&1
findstr /i "ok" temp_health.txt >nul
if %errorlevel%==0 (
    echo      Backend: OK - http://localhost:8000
) else (
    echo      Backend: Still starting... continuing
)
del temp_health.txt 2>nul
echo.

:: ── Step 3: Start Celery Worker ──────────────────────────────
echo [3/5] Starting Celery Worker...
start "WORKER - Celery" cmd /k "cd /d C:\Users\adity\Documents\Prayatna 3.0\backend && venv\Scripts\activate && echo Worker starting... && celery -A app.workers.celery_app worker --loglevel=info --pool=solo"
timeout /t 5 /nobreak >nul
echo      Worker: Started
echo.

:: ── Step 4: Start Celery Beat ────────────────────────────────
echo [4/5] Starting Celery Beat Scheduler...
start "BEAT - Scheduler" cmd /k "cd /d C:\Users\adity\Documents\Prayatna 3.0\backend && venv\Scripts\activate && echo Beat starting... && celery -A app.workers.celery_app beat --loglevel=info"
timeout /t 3 /nobreak >nul
echo      Beat: Started
echo.

:: ── Step 5: Start Frontend ────────────────────────────────────
echo [5/5] Starting Frontend...
start "FRONTEND - Next.js" cmd /k "cd /d C:\Users\adity\Documents\Prayatna 3.0\frontend && echo Frontend starting... && npm run dev"
echo      Waiting for frontend...
timeout /t 10 /nobreak >nul
echo      Frontend: http://localhost:3000
echo.

:: ── Open Browser ──────────────────────────────────────────────
echo  Opening platform in browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000


echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║  ALL SERVICES STARTED                           ║
echo  ║                                                  ║
echo  ║  Frontend:  http://localhost:3000               ║
echo  ║  Backend:   http://localhost:8000               ║
echo  ║  API Docs:  http://localhost:8000/api/docs      ║
echo  ║                                                  ║
echo  ║  5 windows opened:                              ║
echo  ║  1. BACKEND  - FastAPI server                   ║
echo  ║  2. WORKER   - Celery worker                    ║
echo  ║  3. BEAT     - Celery scheduler                 ║
echo  ║  4. FRONTEND - Next.js                          ║
echo  ║                                                  ║
echo  ║  Press any key to close this window             ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
```

---

## Step 2 — Run Karo
```
Double click → start.bat