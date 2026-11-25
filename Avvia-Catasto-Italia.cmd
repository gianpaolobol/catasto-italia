@echo off
setlocal
where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js 22 o successivo non trovato. Installare Node.js dal sito ufficiale.
  pause
  exit /b 1
)
node.exe "%~dp0apps\workbench\launch-local.mjs"
set "EXITCODE=%ERRORLEVEL%"
if not "%EXITCODE%"=="0" pause
exit /b %EXITCODE%
