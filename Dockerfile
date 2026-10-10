# Node 24.18+ ships npm 11.16. Earlier 24.x images bundle npm 11.13.
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN --mount=type=cache,target=/root/.npm npm ci
RUN npm run build

FROM node:24-alpine AS release

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev
COPY --from=builder /app/dist ./dist

USER node

ENTRYPOINT ["node", "dist/index.js"]
