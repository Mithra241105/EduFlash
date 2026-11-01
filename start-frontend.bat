@echo off
echo =======================================
echo Starting EduFlash Frontend (Vite)
echo =======================================

cd /d "%~dp0frontend"
echo Installing dependencies if needed...
call npm install
echo Starting development server...
call npm run dev
pause
