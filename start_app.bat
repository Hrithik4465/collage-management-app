@echo off
title Launch CMS Academy Portal
cls
echo ========================================================
echo       LAUNCHING CMS ACADEMY PORTAL SERVERS
echo ========================================================
echo.

echo [1/3] Starting Backend API Server (Port 5000)...
start "CMS Backend API" cmd /k "cd /d %~dp0collage-management-app\server && node index.js"

echo [2/3] Starting Frontend Web Application (Port 5173)...
start "CMS Web App" cmd /k "cd /d %~dp0collage-management-app\client && npm run dev"

echo [3/3] Opening CMS Portal in your default browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================================
echo CMS Academy Portal is running!
echo - Web Application: http://localhost:5173
echo - Backend API:      http://localhost:5000
echo ========================================================
echo.
pause

