# syntax=docker/dockerfile:1

# ---- Build stage ----
# Debian-based (glibc) Node: the lockfile carries the native build tools for Intel and Apple Silicon.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
# `npm run build` type-checks first, so a type error fails the image build instead of shipping.
RUN npm run build && node scripts/inject-seo-ssi.mjs dist/index.html

# ---- Runtime stage: unprivileged nginx (non-root, works with a read-only filesystem) ----
FROM nginxinc/nginx-unprivileged:1.28-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/proxy-common.conf /etc/nginx/proxy-common.conf
COPY nginx/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
