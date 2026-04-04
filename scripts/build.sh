#!/bin/bash
# ClawPanel 编译脚本
# 用法: ./scripts/build.sh [check|debug|release]
#   check   - 仅检查 Rust 编译（最快，不生成产物）
#   debug   - 编译 debug 版本（默认）
#   release - 编译正式发布版本（含打包）

set -e
cd "$(dirname "$0")/.."

MODE="${1:-debug}"

case "$MODE" in
  check)
    echo "🔍 检查 Rust 编译..."
    cd src-tauri && cargo check
    echo "✅ 编译检查通过"
    ;;
  debug)
    echo "🔨 编译 debug 版本..."
    echo "   1/2 构建前端..."
    npm run build
    echo "   2/2 编译 Rust..."
    cd src-tauri && cargo build
    echo "✅ Debug 编译完成"
    echo "   产物: src-tauri/target/debug/clawpanel"
    ;;
  release)
    echo "📦 编译正式发布版本..."
    npm run tauri build
    echo "✅ Release 编译完成"
    echo "   产物目录: src-tauri/target/release/bundle/"
    ;;
  *)
    echo "用法: $0 [check|debug|release]"
    echo "  check   - 仅检查 Rust 编译（最快）"
    echo "  debug   - debug 版本（默认）"
    echo "  release - 正式发布版本"
    exit 1
    ;;
esac
