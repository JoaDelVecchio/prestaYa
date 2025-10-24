FROM node:20-alpine AS base
RUN apk add --no-cache bash
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY pnpm-lock.yaml ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @prestaya/prisma build
RUN pnpm --filter @prestaya/api build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache bash
RUN corepack enable
COPY --from=base /app /app
CMD ["node", "apps/api/dist/main.js"]
