# --- Tchat data-provider ---
# The configuration form is generated from `configSchema` in
# librechat-data-provider, so the panel can only edit fields that package
# declares. Building the Tchat fork's copy over the published one is what makes
# fork-only config (e.g. `modelSpecs.imageList`) editable here.
FROM node:24.16.0-alpine AS data-provider
RUN apk add --no-cache git
ARG TCHAT_REPO=https://github.com/mrdjango/Tchat.git
ARG TCHAT_REF=main
WORKDIR /src
RUN git clone --depth 1 --branch ${TCHAT_REF} ${TCHAT_REPO} tchat
WORKDIR /src/tchat/packages/data-provider
RUN npm install --no-audit --no-fund --loglevel=error \
    && npm run build \
    && npm prune --omit=dev

# --- Base ---
FROM oven/bun:1.3.11-alpine AS base
WORKDIR /app

# --- Install ---
FROM base AS deps
COPY package.json bun.lock .npmrc ./
COPY patches/ patches/
COPY tools/ tools/
RUN bun install --frozen-lockfile

# --- Build ---
FROM base AS build
COPY --from=deps /app/node_modules node_modules
COPY . .
COPY --from=data-provider /src/tchat/packages/data-provider/dist node_modules/librechat-data-provider/dist
ARG VITE_BASE_PATH=/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
ENV NODE_ENV=production
RUN bun run build

# --- Production dependencies (patches applied, then devDeps stripped) ---
FROM base AS prod-deps
COPY package.json bun.lock .npmrc ./
COPY patches/ patches/
COPY tools/ tools/
RUN bun install --frozen-lockfile \
    && bun install --frozen-lockfile --production
COPY --from=data-provider /src/tchat/packages/data-provider/dist node_modules/librechat-data-provider/dist

# --- Runtime ---
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules node_modules
COPY --from=build /app/dist dist
COPY --from=build /app/src/server src/server
COPY server.ts package.json ./

RUN chown -R bun:bun /app
USER bun

ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun -e "fetch(\`http://localhost:\${process.env.PORT}/health\`).then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"

EXPOSE 3000
CMD ["bun", "run", "start"]
