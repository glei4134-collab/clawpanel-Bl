#!/usr/bin/env pwsh
# ClawPanel 本地构建脚本（Windows）
# 用法:
#   .\build.ps1            — 构建 Windows 安装包（默认）
#   .\build.ps1 -Debug     — Debug 构建（快，不打包）
#   .\build.ps1 -Clean     — 清理 Rust 编译缓存后构建

param(
    [switch]$Debug,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$msg) {
    Write-Host "`n▶ $msg" -ForegroundColor Cyan
}
function Write-Ok([string]$msg) {
    Write-Host "  ✓ $msg" -ForegroundColor Green
}
function Write-Fail([string]$msg) {
    Write-Host "  ✗ $msg" -ForegroundColor Red
}

Write-Host ""
Write-Host "  ClawPanel 构建工具" -ForegroundColor Magenta
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  平台: Windows x64 (本机构建)" -ForegroundColor DarkGray
Write-Host "  跨平台构建 (macOS / Linux) 请推送 tag 触发 GitHub Actions" -ForegroundColor DarkGray
Write-Host ""

# ── 环境检测 ──────────────────────────────────────────────────────────────────

Write-Step "检查构建依赖"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Fail "未找到 Node.js，请从 https://nodejs.org 安装 v18+"
    exit 1
}
$nodeVer = (node --version)
Write-Ok "Node.js $nodeVer"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Fail "未找到 npm"
    exit 1
}

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Fail "未找到 Rust/Cargo，请从 https://rustup.rs 安装"
    exit 1
}
$rustVer = (rustc --version)
Write-Ok "Rust $rustVer"

# 检测 WebView2（Windows 必须）
$webview2Key = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
if (-not (Test-Path $webview2Key)) {
    Write-Host "  ⚠ 未检测到 WebView2 Runtime，目标用户需要安装" -ForegroundColor Yellow
    Write-Host "    下载地址: https://developer.microsoft.com/microsoft-edge/webview2/" -ForegroundColor DarkGray
}

# ── 依赖安装 ──────────────────────────────────────────────────────────────────

Write-Step "安装前端依赖"
if (-not (Test-Path "node_modules")) {
    npm ci --silent
    if ($LASTEXITCODE -ne 0) { Write-Fail "npm ci 失败"; exit 1 }
    Write-Ok "依赖安装完成"
} else {
    Write-Ok "依赖已存在，跳过"
}

# ── 清理缓存 ──────────────────────────────────────────────────────────────────

if ($Clean) {
    Write-Step "清理 Rust 编译缓存"
    Push-Location src-tauri
    cargo clean
    Pop-Location
    Write-Ok "缓存已清理"
}

# ── 构建 ──────────────────────────────────────────────────────────────────────

$startTime = Get-Date

if ($Debug) {
    Write-Step "Debug 构建（不打包安装器）"
    npm run tauri build -- --debug
} else {
    Write-Step "Release 构建（生成 Windows 安装包）"
    npm run tauri build
}

if ($LASTEXITCODE -ne 0) {
    Write-Fail "构建失败"
    exit 1
}

$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)

# ── 输出结果 ──────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  ✅ 构建成功！耗时 ${elapsed}s" -ForegroundColor Green
Write-Host "  ─────────────────────────────────────" -ForegroundColor DarkGray

$bundleDir = "src-tauri\target\release\bundle"
if ($Debug) {
    $exePath = "src-tauri\target\debug\clawpanel.exe"
    Write-Host "  可执行文件: $exePath" -ForegroundColor White
} else {
    Write-Host "  安装包目录: $bundleDir" -ForegroundColor White
    $msi = Get-ChildItem "$bundleDir\msi\*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
    $exe = Get-ChildItem "$bundleDir\nsis\*-setup.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($msi) { Write-Host "  MSI: $($msi.FullName)" -ForegroundColor DarkGray }
    if ($exe) { Write-Host "  EXE: $($exe.FullName)" -ForegroundColor DarkGray }
}

Write-Host ""
Write-Host "  提示: 发布跨平台版本请推送 tag，例如:" -ForegroundColor DarkGray
Write-Host "    git tag v1.0.0 && git push origin v1.0.0" -ForegroundColor DarkGray
Write-Host ""
