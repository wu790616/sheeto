## ADDED Requirements

### Requirement: Build multi-stage Docker image
The system SHALL support building a multi-stage Docker image that installs dependencies and compiles Vite assets in a Node builder stage, and copies the build output into a `zeabur/caddy-static` image.

#### Scenario: Successful image compilation
- **WHEN** the user builds the Dockerfile
- **THEN** the image builds successfully and results in a lightweight container.

### Requirement: Caddy static file serving
The system SHALL configure Caddy to serve static files from `/usr/share/caddy` and route any unmatched URLs back to `index.html` to support React Router single-page application navigation.

#### Scenario: File route fallback
- **WHEN** a client requests a path that does not match a static file (e.g. `/settings`)
- **THEN** Caddy responds with `index.html` on port 80.
