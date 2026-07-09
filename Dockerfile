# ==================== Dockerfile ====================
# 澶氶樁娈垫瀯寤猴紙sql.js 绾?JS锛屾棤闇€鍘熺敓缂栬瘧锛?
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --frozen-lockfile

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- 杩愯闃舵 ----------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache tzdata su-exec
ENV TZ=Asia/Shanghai

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# sql.js 鍖呭惈 WASM 鏂囦欢锛岄渶瑕佸畬鏁寸殑鍖呯洰褰曪紙standalone 鐨?tracing 鏈夋椂閬楁紡 WASM锛?COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sql.js ./node_modules/sql.js

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["docker-entrypoint.sh"]