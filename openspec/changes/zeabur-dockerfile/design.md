## Context

The Sheeto React frontend application needs to be deployed as a containerized web service on Zeabur. Since it is a static Single Page Application (SPA), we need a container structure that compiles the assets and serves them via an optimized, production-grade static file server.

## Goals / Non-Goals

**Goals:**
- Add a multi-stage `Dockerfile` to build and serve the application.
- Stage 1: Install dependencies and compile the Vite bundle using Node.js slim.
- Stage 2: Deploy the compiled static resources inside the official `zeabur/caddy-static` image.
- Avoid maintaining custom web server configuration files (like `nginx.conf`) by leveraging Caddy's built-in SPA routing support on Zeabur.

**Non-Goals:**
- Running Nginx or custom configuration files.
- Running a live Node.js background process in production.
- Building backend Apps Script logic in Docker (GAS is hosted on Google Cloud).

## Decisions

### Decision 1: Multi-stage Docker Build
- **Rationale**: Building the React code inside a Node container and then copying only the compiled `/dist` directory to a Caddy static container separates the build-time tools from the run-time server. This keeps the final container image size minimal, minimizing disk footprint and memory usage.
- **Alternatives**: Copying node_modules and running `npm run dev` in production. Rejected because it wastes RAM and CPU resources.

### Decision 2: Caddy Static (`zeabur/caddy-static`) as Web Server
- **Rationale**: `zeabur/caddy-static` is Zeabur's optimized server for static sites. It automatically handles Single Page Application (SPA) routing fallbacks and compression without needing any custom configuration file, which eliminates server config risks.
- **Alternatives**: Nginx. Rejected because Nginx requires writing and maintaining a custom configuration file to handle SPA URL fallbacks.

## Risks / Trade-offs

- **[Risk] Container Port Mismatch** → Caddy listens on port 80. Zeabur automatically detects port 80 and maps it to the public HTTP domain, which is standard.
- **[Risk] Docker Cache Invalidation** → Mitigated by copying `package.json` and `package-lock.json` and running `npm ci` before copying the rest of the source code, maximizing Docker layer cache efficiency.
