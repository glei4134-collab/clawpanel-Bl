#!/usr/bin/env pwsh
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host '[*] Starting ClawPanel dev server...' -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Host '[ERR] Node.js not found' -ForegroundColor Red; exit 1 }
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) { Write-Host '[ERR] Rust not found' -ForegroundColor Red; exit 1 }
if (-not (Test-Path 'node_modules')) { Write-Host '[*] Installing deps...' -ForegroundColor Yellow; npm install }
if (-not (Test-Path 'src-tauri\target')) { Write-Host '[*] First Rust build (may take minutes)...' -ForegroundColor Yellow }

Write-Host '[*] Launching...' -ForegroundColor Green
npm run tauri dev
