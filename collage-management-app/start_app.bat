@echo off
title Launch College Management App
echo ========================================================
echo Starting College Management App Servers...
echo ========================================================

echo 1. Starting Backend API Server (Port 5000)...
start "CMS Backend API" cmd /k "cd /d %~dp0server && node index.js"

echo 2. Starting Frontend Web Application (Port 5173)...
start "CMS Web App" cmd /k "cd /d %~dp0client && npm run dev"

echo 3. Starting Expo Mobile App Metro Daemon...
start "CMS Mobile Expo" cmd /k "cd /d %~dp0mobile-app && npx expo start --lan"

echo ========================================================
echo All servers started in separate terminal windows!
echo - Web App: http://localhost:5173
echo - Backend API: http://localhost:5000
echo ========================================================
pause
