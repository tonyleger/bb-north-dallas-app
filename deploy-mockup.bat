@echo off
REM Deploy the BB Unified mockup as the live Railway home page.
REM Double-click this file to run, or run from the app/ folder.

cd /d "%~dp0"

echo.
echo === Cleaning any stuck git locks ===
if exist ".git\index.lock" del ".git\index.lock"

echo.
echo === Files to be committed ===
git status --short

echo.
echo === Staging all changes ===
git add -A

echo.
echo === Committing ===
git commit -m "Serve BB Unified mockup as live home page" -m "The polished mockup is now the live face of the app at / so the team can use it on phones (PWA) while the React port continues underneath. /api/* routes still work for future use."

echo.
echo === Pushing to GitHub (Railway will auto-deploy) ===
git push origin main

echo.
echo === Done. Railway is auto-deploying. ===
echo Live URL: https://bb-north-dallas-app-production.up.railway.app/
echo.
echo Closing in 10 seconds...
timeout /t 10 /nobreak > nul
