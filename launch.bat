@echo off
setlocal EnableDelayedExpansion
title LANDFALL 2.0 - Local Server
cd /d "%~dp0"

rem ---- Pick a free port (3000-3010, then 8080-8090) ----
set PORT=
for /L %%P in (3000,1,3010) do (
    if not defined PORT (
        netstat -ano | findstr /R /C:":%%P .*LISTENING" >nul
        if errorlevel 1 set PORT=%%P
    )
)
if not defined PORT (
    for /L %%P in (8080,1,8090) do (
        if not defined PORT (
            netstat -ano | findstr /R /C:":%%P .*LISTENING" >nul
            if errorlevel 1 set PORT=%%P
        )
    )
)
if not defined PORT (
    echo [ERROR] No free port found between 3000-3010 or 8080-8090.
    pause
    exit /b 1
)

set URL=http://localhost:%PORT%/

rem ---- Find a server runtime: Python, then Node ----
set RUNNER=
where py >nul 2>&1 && set RUNNER=py -m http.server %PORT%
if not defined RUNNER (
    where python >nul 2>&1 && set RUNNER=python -m http.server %PORT%
)
if not defined RUNNER (
    where npx >nul 2>&1 && set RUNNER=npx --yes http-server -p %PORT% -c-1
)
if not defined RUNNER (
    echo [ERROR] Neither Python nor Node.js was found. Install one of them:
    echo   Python: https://www.python.org/downloads/
    echo   Node:   https://nodejs.org/
    pause
    exit /b 1
)

echo ============================================
echo   LANDFALL 2.0 - serving %CD%
echo   %URL%
echo   Press Ctrl+C in this window to stop.
echo ============================================

rem ---- Open the browser after the server has had a moment to start ----
start "" /B cmd /c "timeout /t 2 /nobreak >nul & start "" %URL%"

%RUNNER%

endlocal
