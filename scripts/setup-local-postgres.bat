@echo off
REM Run this file as Administrator (right-click -> Run as administrator)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-local-postgres.ps1"
pause
