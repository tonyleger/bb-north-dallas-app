@echo off
REM Deploy mockup updates to Railway. Double-click this file to run.

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
git commit -m "Polish pass: KPI clicks, hash routing, store init, dropdown" -m "Fixes from AUDIT_REPORT.md commit batch 1: - Overdue/Installs/Issues KPIs only clickable when count > 0 - Add id='installs-today-section' so Installs Today KPI scrolls correctly - Initialize STORE defaults at load and persist (no first-load data loss) - Better try/catch in loadStore/saveStore with console warnings - URL hash routing: setRole updates location.hash; hashchange listener; initial boot reads hash so #/warehouse opens to that view - PREVIEW AS dropdown now includes all 9 roles (added Overview, Team, Follow-up Dash, Owner)"

echo.
echo === Pushing to GitHub (Railway will auto-deploy) ===
git push origin main

echo.
echo === Done. Railway is auto-deploying. ===
echo Live URL: https://bb-north-dallas-app-production.up.railway.app/
echo.
echo Closing in 10 seconds...
timeout /t 10 /nobreak > nul
