# SPDX-FileCopyrightText: Fondation RERO+
# SPDX-License-Identifier: AGPL-3.0-or-later

# Production image of MEF UI: Node.js server with server-side rendering.
# Build from the project root: docker build -f docker/Dockerfile -t mef-ui .

# --- Build: dependencies and production build ---
FROM node:24-slim AS build

WORKDIR /app
# pnpm version from the `packageManager` field of package.json
RUN corepack enable

# Dependencies first, cached while the lockfile, the pnpm settings and the patches don't change
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# --- Runtime: the server bundle contains its dependencies, only `dist` is needed ---
FROM node:24-alpine

# tini as PID 1: forwards the stop signals to Node.js, so that the container stops at once
RUN apk add --no-cache tini

WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000
COPY --from=build --chown=node:node /app/dist/mef-ui ./

USER node
EXPOSE 4000

# Static file served without rendering nor API call: checks that the server answers
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/favicon.ico" || exit 1

# Configuration (environment variables, see README.md):
# - API_URL: base URL of the MEF API, e.g. https://mef.test.rero.ch (default: https://mef.rero.ch)
# - NG_ALLOWED_HOSTS: additional host names allowed to be rendered, comma separated
# - PORT: listening port (default: 4000)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/server.mjs"]
