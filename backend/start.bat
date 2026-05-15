@echo off
echo ==============================================
echo  Nova Backend - Smart Finance
echo ==============================================
cd /d "%~dp0"
echo Starting backend on port 5001...
.\node_modules\.bin\tsx src/index.ts
pause
