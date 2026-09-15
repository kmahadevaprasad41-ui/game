@echo off
title Aethelgard: Depth of Steam - Steampunk 2D Survival Game
echo ========================================================
echo   AETHELGARD: DEPTH OF STEAM
echo   Steampunk 2D Survival & Escape Game
echo ========================================================
echo Starting local game server...
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo Python server failed or Python not in PATH.
    echo Opening index.html directly in your default browser...
    start "" index.html
)
pause
