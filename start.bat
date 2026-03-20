@echo off
echo Starting all Buster services...

start "Client"  cmd /k "cd /d %~dp0app\client  && npm start"
start "Server"  cmd /k "cd /d %~dp0app\server  && npm run start:dev"
start "Parser"  cmd /k "cd /d %~dp0app\parser  && uvicorn main:app --reload --port 8999"
start "Files"   cmd /k "cd /d %~dp0app\files   && npm start"

echo All 4 services launched.
