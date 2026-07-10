FROM node:22-slim AS build
LABEL "language"="nodejs"
LABEL "framework"="vite"
WORKDIR /src

# Leverage Docker cache for npm dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy code and compile the React bundle
COPY . .
RUN npm run build

# Use Zeabur's optimized static server image
FROM zeabur/caddy-static
COPY --from=build /src/dist /usr/share/caddy
