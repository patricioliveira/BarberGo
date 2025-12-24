# ETAPA 1: Base
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Habilita o corepack para usar pnpm sem instalar globalmente
RUN corepack enable

# ETAPA 2: Dependências e Build
FROM base AS builder
WORKDIR /app

# Instala dependências do sistema necessárias para o node-gyp/openssl se necessário
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copia todos os arquivos do monorepo
COPY . .

# Instala dependências (o frozen-lockfile garante que usa as versões exatas do lockfile)
RUN pnpm install --frozen-lockfile

# Configura variáveis de build (alguns libs precisam disso no build time)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Roda o build especificamente do app Hall
# O output: "standalone" no next.config.mjs vai criar uma pasta enxuta
RUN pnpm turbo run build --filter=@barbergo/hall

# ETAPA 3: Runner (Imagem final de produção)
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3006
ENV HOSTNAME="0.0.0.0"

# Instala curl para o Healthcheck e ca-certificates para HTTPS
RUN apt-get update -y \
    && apt-get install -y curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cria um usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia apenas os arquivos necessários gerados pelo modo Standalone
# A pasta .next/static e public precisam ser copiadas manualmente
COPY --from=builder /app/apps/hall/public ./apps/hall/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/hall/.next/static ./apps/hall/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/hall/.next/standalone ./ .

# Muda para o usuário seguro
USER nextjs

EXPOSE 3006

# Healthcheck corrigido
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3006/ || exit 1

# Comando otimizado para iniciar o servidor Node direto (sem passar pelo npm/pnpm)
CMD ["node", "apps/hall/server.js"]