@echo off
REM Starts the app locally at http://localhost:3000 - no publishing needed.
REM Requires Node.js (https://nodejs.org). First run will ask you to log in
REM to Vercel and link this folder to your existing project - say yes.
cd /d "%~dp0"
npx vercel dev
pause
