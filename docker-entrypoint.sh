#!/bin/sh
set -e

# 确保 data 目录存在且权限正确（解决 volume 挂载覆盖镜像权限的问题）
mkdir -p /app/data
chown -R nextjs:nodejs /app/data 2>/dev/null || true

# 如果当前是 root 运行，切到 nextjs；否则直接执行
if [ "$(id -u)" = "0" ]; then
    exec su-exec nextjs node server.js
else
    exec node server.js
fi