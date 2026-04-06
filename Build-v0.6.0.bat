@echo off
chcp 65001 >nul 2>&1
title ClawPanel Build Tool v0.6.0
echo ====================================
echo ClawPanel Build Tool v0.6.0
echo ====================================
echo.

set "SCRIPT_DIR=%~dp0"
set "BUILD_DIR=%SCRIPT_DIR%build_output"

REM 搜索源码目录
set "SOURCE_DIR="
for /d %%d in ("%SCRIPT_DIR%*") do (
    if not defined SOURCE_DIR (
        if exist "%%d\package.json" (
            if exist "%%d\src\main.js" (
                set "SOURCE_DIR=%%d"
            )
        )
    )
)

if "%SOURCE_DIR%"=="" (
    echo [ERROR] Source folder not found
    pause
    exit /b 1
)

echo [OK] Found: %SOURCE_DIR%

REM 检查Node.js和Rust
where node >nul 2>&1 || (echo [ERROR] Node.js not found && pause && exit /b 1)
where cargo >nul 2>&1 || (echo [ERROR] Rust not found && pause && exit /b 1)

echo [OK] Node.js and Rust installed
echo [START] Build process...

REM 1. 复制源码
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"
echo [1/6] Copy source files...
xcopy "%SOURCE_DIR%" "%BUILD_DIR%" /E /I /Y >nul 2>&1

REM 2. 注入代码
echo.
echo [2/6] Inject code...
set "BACKUP_DIR=%SCRIPT_DIR%backup_original"
if exist "%BACKUP_DIR%" rmdir /s /q "%BACKUP_DIR%"
mkdir "%BACKUP_DIR%"

REM ========== v0.6.0 修改开始 ==========

REM 2.1 复制 notification-manager.js
set "F=%BUILD_DIR%\src\lib\notification-manager.js"
if exist "%SCRIPT_DIR%src\lib\notification-manager.js" (
    copy "%SCRIPT_DIR%src\lib\notification-manager.js" "%F%" >nul 2>&1
    echo   Copy notification-manager.js...
) else (
    echo   [WARN] notification-manager.js not found in source directory
)

REM 2.2 修改 Cargo.toml - 添加 tauri-plugin-notification
set "F=%BUILD_DIR%\src-tauri\Cargo.toml"
if exist "%F%" (
    copy "%F%" "%BACKUP_DIR%\Cargo.toml" >nul 2>&1
    echo   Inject Cargo.toml...
    powershell -NoProfile -Command "$f='%F%'; $c=Get-Content $f -Raw; if (!$c.Contains('tauri-plugin-notification')) { $c=$c -replace '(tauri-plugin-fs = \"2\")', '$1\ntauri-plugin-notification = \"2\"'; [IO.File]::WriteAllText($f, $c) }"
)

REM 2.3 修改 lib.rs - 注册 notification 插件
set "F=%BUILD_DIR%\src-tauri\src\lib.rs"
if exist "%F%" (
    copy "%F%" "%BACKUP_DIR%\lib.rs" >nul 2>&1
    echo   Inject lib.rs...
    powershell -NoProfile -Command "$f='%F%'; $c=Get-Content $f -Raw; if (!$c.Contains('tauri_plugin_notification')) { $c=$c -replace '(.plugin\(tauri_plugin_fs::init\(\)\))', '$1\n        .plugin(tauri_plugin_notification::init())'; [IO.File]::WriteAllText($f, $c) }"
)

REM 2.4 修改 capabilities/default.json - 添加通知权限
set "F=%BUILD_DIR%\src-tauri\capabilities\default.json"
if exist "%F%" (
    copy "%F%" "%BACKUP_DIR%\default.json" >nul 2>&1
    echo   Inject default.json...
    powershell -NoProfile -Command "$f='%F%'; $c=Get-Content $f -Raw; if (!$c.Contains('notification:')) { $c=$c -replace '(\"autostart:allow-is-enabled\")', '$1,\n    \"notification:default\",\n    \"notification:allow-is-permission-granted\",\n    \"notification:allow-request-permission\",\n    \"notification:allow-notify\",\n    \"notification:allow-show\"'; [IO.File]::WriteAllText($f, $c) }"
)

REM 2.5 修改 index.html - 添加 favicon
set "F=%BUILD_DIR%\index.html"
if exist "%F%" (
    copy "%F%" "%BACKUP_DIR%\index.html" >nul 2>&1
    echo   Inject index.html...
    powershell -NoProfile -Command "$f='%F%'; $c=Get-Content $f -Raw; if (!$c.Contains('rel=\"icon\"')) { $c=$c -replace '(<title>.*?</title>)', '$1\n  <link rel=\"icon\" href=\"/images/logo.png\" type=\"image/png\" />\n  <link rel=\"shortcut icon\" href=\"/images/logo.png\" type=\"image/png\" />'; [IO.File]::WriteAllText($f, $c) }"
)

REM 2.6 替换 logo.png
set "F=%BUILD_DIR%\public\images\logo.png"
if exist "%BUILD_DIR%\public\images\icon.png" (
    copy "%F%" "%BACKUP_DIR%\logo_original.png" >nul 2>&1
    echo   Replace logo.png with icon.png...
    copy "%BUILD_DIR%\public\images\icon.png" "%F%" >nul 2>&1
)

echo   All v0.6.0 modifications applied.
REM ========== v0.6.0 修改结束 ==========

REM 3. 安装依赖
echo.
echo [3/6] Install dependencies...
cd /d "%BUILD_DIR%"
call npm install >nul 2>&1

REM 4. 构建前端
echo.
echo [4/6] Build frontend...
call npm run build >nul 2>&1
if not exist "%BUILD_DIR%\dist" (
    echo [ERROR] Frontend build failed
    pause
    exit /b 1
)

REM 5. 构建Tauri
echo.
echo [5/6] Build Tauri...
call npm run tauri build >nul 2>&1
if not exist "%BUILD_DIR%\src-tauri\target\release\clawpanel.exe" (
    echo [ERROR] Tauri build failed
    pause
    exit /b 1
)

REM 6. 整理输出
echo.
echo [6/6] Copy output files...
set "OUTPUT_DIR=%SCRIPT_DIR%output"
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"

copy "%BUILD_DIR%\src-tauri\target\release\clawpanel.exe" "%OUTPUT_DIR%\" >nul 2>&1

REM 查找 MSI 文件
for /f "delims=" %%i in ('dir /b /s "%BUILD_DIR%\src-tauri\target\release\bundle\msi\*.msi" 2^>nul') do (
    copy "%%i" "%OUTPUT_DIR%\" >nul 2>&1
)

REM 查找 NSIS 安装文件
for /f "delims=" %%i in ('dir /b /s "%BUILD_DIR%\src-tauri\target\release\bundle\nsis\*.exe" 2^>nul') do (
    copy "%%i" "%OUTPUT_DIR%\" >nul 2>&1
)

echo [OK] Done
echo.
echo BUILD COMPLETE!
echo Output: %OUTPUT_DIR%
echo.
echo Files:
dir /b "%OUTPUT_DIR%"
echo.
pause
