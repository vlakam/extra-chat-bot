FROM node:10-alpine AS builder

ENV NODE_WORKDIR /app
WORKDIR $NODE_WORKDIR

COPY package.json package-lock.json ./
RUN npm ci --no-audit

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:10-alpine

ENV NODE_WORKDIR /app
WORKDIR $NODE_WORKDIR

COPY package.json package-lock.json ./
RUN npm ci --production --no-audit

COPY --from=builder $NODE_WORKDIR/dist ./dist

CMD npm start
