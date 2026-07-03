#!/bin/bash
# ==================== 一键部署脚本 ====================
# 用法:
#   chmod +x deploy.sh
#   ./deploy.sh            # 本地 Docker 部署
#   ./deploy.sh --pull     # 从 DockerHub 拉取并部署
#   ./deploy.sh --stop     # 停止并清理

set -e

IMAGE_NAME="cloud-region-explorer"
CONTAINER_PREFIX="cloud-region-explorer"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

case "${1:-}" in
  --stop)
    log "停止并清理容器..."
    docker compose down -v
    log "已清理"
    exit 0
    ;;

  --pull)
    log "从 DockerHub 拉取镜像..."
    if [ -z "$DOCKERHUB_USERNAME" ]; then
      err "请设置环境变量 DOCKERHUB_USERNAME"
      exit 1
    fi
    docker pull "${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"
    log "镜像拉取完成，启动服务..."
    DOCKERHUB_USERNAME="$DOCKERHUB_USERNAME" docker compose -f docker-compose.pull.yml up -d
    log "服务已启动，访问 http://localhost:8080"
    ;;

  *)
    log "本地构建并部署..."
    
    # 创建数据目录
    mkdir -p data
    
    log "构建 Docker 镜像..."
    docker compose build
    
    log "启动服务..."
    docker compose up -d
    
    log ""
    log "============================================"
    log "  Cloud Region Explorer 部署完成！"
    log "  访问地址: http://localhost:8080"
    log ""
    log "  查看日志: docker compose logs -f"
    log "  停止服务: docker compose down"
    log "  重新构建: docker compose up -d --build"
    log "============================================"
    ;;
esac
