#!/bin/bash
# 启动 3D 作品集本地预览（不要用 8080，那是其他服务占用的端口）
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
NODE_BIN="${ROOT}/../.tools/node-v20.11.0-darwin-arm64/bin"
export PATH="${NODE_BIN}:$PATH"

cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "未找到 Node.js，请先安装或检查 .tools/node 路径"
  exit 1
fi

PORT=8082
if lsof -i ":$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "开发服务已在运行： http://localhost:$PORT"
else
  echo "正在启动开发服务..."
  node node_modules/webpack/bin/webpack.js serve --config ./bundler/webpack.dev.js &
  sleep 4
fi

echo ""
echo "=========================================="
echo "  请在浏览器打开："
echo "  http://localhost:$PORT"
echo ""
echo "  仅看记事本界面："
echo "  http://localhost:$PORT/about.html"
echo "=========================================="
echo ""
echo "注意：不要双击 Finder 里的 HTML 文件，必须通过上面的地址访问。"

if command -v open >/dev/null 2>&1; then
  open "http://localhost:$PORT" || true
fi
