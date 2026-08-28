---
name: docker-helper
description: >-
  Build, debug, and optimize Docker configurations. Use when a user asks to
  create a Dockerfile, fix Docker build errors, optimize image size, write
  docker-compose files, debug container issues, set up multi-stage builds,
  or troubleshoot networking between containers. Covers Dockerfile best
  practices and compose orchestration.
license: Apache-2.0
compatibility: "Requires Docker 20+ installed"
metadata:
  author: terminal-skills
  version: "1.0.0"
  category: devops
  tags: ["docker", "containers", "dockerfile", "compose", "devops"]
---

# Docker Helper

## Overview

Create, debug, and optimize Docker configurations including Dockerfiles, docker-compose setups, and container troubleshooting. Follows Docker best practices for security, image size, and build speed.

## Instructions

When a user asks for help with Docker, determine which task they need:

### Task A: Create a Dockerfile

1. Identify the application language and framework
2. Choose the right base image (prefer `-slim` or `-alpine` variants)
3. Use multi-stage builds for compiled languages
4. Follow this ordering for optimal layer caching:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
```
