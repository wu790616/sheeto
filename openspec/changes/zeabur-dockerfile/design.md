## Context

The Sheeto React frontend application needs to be deployed as a containerized web service on Zeabur. Since it is a static Single Page Application (SPA), we need a container structure that compiles the assets and serves them via a lightweight, production-grade web server (like Nginx) rather than running a heavy Node.js development server process in production.

## Goals / Non-Goals

**Goals:**
- Add a multi-stage `Dockerfile` to build and serve the application.
- Stage 1: Install dependencies and compile the Vite bundle using Node.js Alpine.
- Stage 2: Deploy the compiled static resources inside a highly optimized Nginx Alpine image.
- Configure `nginx.conf` to serve assets on port 80 and properly handle client-side routing fallbacks to `index.html`.

**Non-Goals:**
- Running a live Node.js background process (like a Vite development server) in production.
- Building backend Apps Script logic in Docker (GAS is hosted on Google Cloud).

## Decisions

### Decision 1: Multi-stage Docker Build
- **Rationale**: Building the React code inside a Node container and then copying only the compiled `/dist` directory to an Nginx container separates the build-time tools from the run-time server. This reduces the final container image size from ~350MB down to ~22MB, minimizing disk footprint and memory usage on Zeabur.
- **Alternatives**: Copying node_modules and running `npm run dev` in production. Rejected because it wastes RAM and CPU resources.

### Decision 2: Nginx on Alpine as Web Server
- **Rationale**: Nginx Alpine is extremely fast, secure, and utilizes minimal RAM (less than 5MB), leaving plenty of memory for the user's main Rails project on the 2GB server.
- **Alternatives**: Serve / Apache. Rejected because Nginx has superior static file serving performance and a lower memory footprint.

### Decision 3: Single-page Routing Fallback (try_files)
- **Rationale**: Client-side routing requires Nginx to serve `index.html` whenever a user requests an arbitrary URL path directly (e.g., refreshing on `/settings`), rather than returning a standard 404. We will configure `try_files $uri $uri/ /index.html` in Nginx config.

## Risks / Trade-offs

- **[Risk] Container Port Mismatch** → Nginx listens on port 80. Zeabur automatically detects port 80 and maps it to the public HTTP domain, which is standard.
- **[Risk] Docker Cache Invalidation** → Mitigated by copying `package.json` and `package-lock.json` and running `npm ci` before copying the rest of the source code, maximizing Docker layer cache efficiency.
