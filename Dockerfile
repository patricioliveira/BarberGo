FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@barbergo/hall

ENV NODE_ENV=production
ENV PORT=3006

EXPOSE 3006

CMD ["pnpm", "--filter", "@barbergo/hall", "start", "--", "--hostname", "0.0.0.0", "--port", "3006"]
