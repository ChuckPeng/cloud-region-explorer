# ==================== Dockerfile ====================
# 多阶段构建（sql.js 纯 JS，无需原生编译）

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --frozen-lockfile

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 运行阶段 ----------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 安装 sql.js 运行时依赖（如果 standalone 未自动包含）
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sql.js ./node_modules/sql.js

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
