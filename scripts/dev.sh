#!/bin/bash
# ClawPanel 开发模式启动脚本
# 用法: ./scripts/dev.sh [web|tauri]
#   web   - 仅启动 Vite 前端（浏览器调试，mock 数据）
#   tauri - 启动完整 Tauri 桌面应用（默认）

set -e
cd "$(dirname "$0")/.."

MODE="${1:-tauri}"

# 清理旧进程
cleanup() {
  echo "🧹 清理旧进程..."
  pkill -f "vite.*clawpanel" 2>/dev/null || true
  pkill -f "target/debug/clawpanel" 2>/dev/null || true
  lsof -ti:1420 | xargs kill -9 2>/dev/null || true
  sleep 0.5
}

cleanup

case "$MODE" in
  web)
    echo "🌐 启动 Vite 前端开发服务器（浏览器模式）..."
    echo "   地址: http://localhost:1420"
    echo "   使用 mock 数据，适合调试前端逻辑"
    echo ""
    npx vite --port 1420
    ;;
  tauri)
    echo "🖥️  启动 Tauri 桌面应用（完整模式）..."
    echo "   Vite + Rust 后端"
    echo ""
    npm run tauri dev
    ;;
  *)
    echo "用法: $0 [web|tauri]"
    echo "  web   - 仅 Vite 前端（浏览器调试）"
    echo "  tauri - Tauri 桌面应用（默认）"
    exit 1
    ;;
esac
