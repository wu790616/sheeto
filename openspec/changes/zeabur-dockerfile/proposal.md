## Why

The user wants to deploy the Sheeto React application on Zeabur. To support container-based web service deployments on Zeabur (instead of standard static deployments), the project needs a standard, lightweight Dockerfile and a web server configuration to compile the React code and serve the static files.

## What Changes

- **Dockerfile**: Add a multi-stage Dockerfile that builds the Vite project using Node and serves the compiled assets using Nginx.
- **Nginx Configuration**: Add a minimal `nginx.conf` file to configure port mapping and correctly handle routing fallback to `index.html`.

## Capabilities

### New Capabilities

- `containerized-deployment`: A Docker-based packaging system that allows the frontend application to build and run as a containerized web service.

### Modified Capabilities

*None*

## Impact

- Adds `Dockerfile` and `nginx.conf` in the project root.
- No impact on existing source code or application logic.
