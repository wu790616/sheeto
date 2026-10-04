# Build natively on the host arch: the output is static files, and esbuild
# crashes under QEMU when cross-building amd64 on Apple Silicon
FROM --platform=$BUILDPLATFORM node:22-slim AS build
LABEL "language"="nodejs"
LABEL "framework"="vite"
WORKDIR /src

# Leverage Docker cache for npm dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy code and compile the React bundle
COPY . .
RUN npm run build

# Serve the built assets with a plain Caddy static server
FROM caddy:2-alpine
COPY --from=build /src/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
