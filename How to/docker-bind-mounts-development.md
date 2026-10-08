# Docker Bind Mounts for Development

Bind mounts allow you to mount your local source code directory into a running container, enabling hot reload and instant code changes without rebuilding the image.

## Why Use Bind Mounts?

- **Instant feedback**: Changes to code appear immediately inside the container
- **No rebuild cycle**: Skip `docker build` during development
- **Local tooling**: Edit files with your preferred editor on the host
- **Faster iteration**: Ideal for active development workflows

## Basic Usage with `docker run`

### Simple bind mount:
```bash
docker run -v $(pwd)/src:/app/src -p 8080:8080 myimage
```

- `-v $(pwd)/src:/app/src` mounts your local `src/` folder into the container at `/app/src`
- `-p 8080:8080` publishes port 8080 (adjust as needed)
- Edit files locally; changes appear in the container instantly

### Multiple volumes:
```bash
docker run \
  -v $(pwd)/src:/app/src \
  -v $(pwd)/.env:/app/.env \
  -p 8080:8080 \
  myimage
```

## Using Docker Compose (Recommended)

### Basic setup:
```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./src:/app/src
```

Run with:
```bash
docker compose up
```

### With auto-reload (watch mode):
```yaml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./src:/app/src
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: ./Dockerfile
```

Run with:
```bash
docker compose watch
```

This watches for file changes and:
- **sync**: Copies changed files into the container immediately
- **rebuild**: Rebuilds the image if the Dockerfile changes

## Best Practices

### What to mount:
- ✅ Source code directories (`./src`, `./app`, etc.)
- ✅ Configuration files (`.env`, `config.yml`)
- ✅ Development assets

### What NOT to mount:
- ❌ Entire project root (avoid syncing `.git`, `node_modules`, `.next`, `__pycache__`, etc.)
- ❌ Build artifacts that should be in the image
- ❌ Files with permission conflicts

### Recommended mount paths:
```yaml
volumes:
  - ./src:/app/src              # Source code only
  - ./public:/app/public        # Static assets
  - ./.env.local:/app/.env      # Local config
```

## Requirements

Your application must support **live reloading**:
- **Node.js**: Use `nodemon`, `tsx`, or dev server with `--watch`
- **Python**: Use `--reload` flag or tools like `watchdog`
- **Go**: Use `air` or similar file watcher
- **React/Vite**: Built-in hot module replacement (HMR)

## Example: Node.js with Nodemon

**Dockerfile:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

**docker-compose.yml:**
```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
```

**package.json:**
```json
{
  "scripts": {
    "dev": "nodemon --watch src src/index.js"
  }
}
```

Run with:
```bash
docker compose watch
```

## Example: Python with Flask

**Dockerfile:**
```dockerfile
FROM python:3.11-alpine
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["flask", "run", "--reload"]
```

**docker-compose.yml:**
```yaml
services:
  app:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./src:/app/src
    environment:
      - FLASK_APP=src/app.py
      - FLASK_ENV=development
```

## Troubleshooting

### Changes not appearing in container?
- Ensure the mount path matches where your app reads files
- Check file permissions on the host
- Verify the app is watching the correct directory

### Performance issues on macOS/Windows?
- Bind mounts on macOS/Windows are slower than native Linux
- Use `cached` or `delegated` mount options:
  ```yaml
  volumes:
    - ./src:/app/src:cached
  ```

### Container exits immediately?
- Check `docker logs <container>` for errors
- Ensure your app supports the `--reload` or watch mode
- Verify environment variables are set correctly

## When NOT to use bind mounts

- **Production**: Use `COPY` in your Dockerfile; never mount code in production
- **Shared environments**: Bind mounts are host-specific; Docker images should be portable
- **Performance-critical apps**: Native Linux performance is faster than bind mounts on macOS/Windows
