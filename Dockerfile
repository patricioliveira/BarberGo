FROM node:22-slim

RUN apt-get update -y \
 && apt-get install -y openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@barbergo/hall

ENV PORT=3006
EXPOSE 3006

CMD ["pnpm", "turbo", "run", "start", "--filter=@barbergo/hall"]
