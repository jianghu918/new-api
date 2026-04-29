#!/bin/bash

# new-api 前端构建 + Docker 部署脚本
# 使用方法：./build-and-deploy.sh [版本号]
# 示例：./build-and-deploy.sh 1.0.6

set -e  # 遇到错误立即退出

# 版本号
VERSION=${1:-"dev-$(date +%Y%m%d.%H%M)"}
IMAGE_NAME="new-api:${VERSION}"

echo "========================================"
echo "🚀 new-api 构建部署脚本"
echo "========================================"
echo "版本: ${VERSION}"
echo "镜像: ${IMAGE_NAME}"
echo ""

# 进入项目目录
cd /Users/jianghu/Documents/Work/happyLife/new-api

# 1. 前端构建
echo "📦 [1/4] 前端构建..."
cd web/default
bun install --registry=https://registry.npmmirror.com
bun run build
cd ../..
echo "✅ 前端构建完成"
echo ""

# 2. 复制到 classic 目录
echo "📋 [2/4] 复制前端产物..."
rm -rf web/classic/dist
cp -r web/default/dist web/classic/dist
echo "✅ 复制完成"
echo ""

# 3. Docker 构建
echo "🐳 [3/4] Docker 构建..."
docker build -f Dockerfile.local -t "${IMAGE_NAME}" .
echo "✅ Docker 镜像构建完成: ${IMAGE_NAME}"
echo ""

# 4. 停止旧容器并启动新容器
echo "🔄 [4/4] 重启容器..."
if docker ps -a | grep -q "new-api"; then
  docker stop new-api 2>/dev/null || true
  docker rm new-api 2>/dev/null || true
fi

docker run -d \
  --name new-api \
  --restart no \
  -p 30000:3000 \
  -e SQL_DSN="postgresql://postgres:123456@host.docker.internal:5432/new-api" \
  -e REDIS_CONN_STRING="redis://host.docker.internal:6379" \
  -e TZ=Asia/Shanghai \
  -e BATCH_UPDATE_ENABLED=true \
  -v ~/Documents/Work/happyLife/new-api/dev_data:/data \
  "${IMAGE_NAME}"

echo ""
echo "========================================"
echo "✅ 部署完成！"
echo "========================================"
echo "访问地址: http://localhost:30000"
echo "Docker 镜像: ${IMAGE_NAME}"
echo ""
echo "查看日志: docker logs -f new-api"
echo "========================================"
