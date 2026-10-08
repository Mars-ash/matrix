# Matrix Docker Development Commands

Run these commands from:

```powershell
C:\laragon\www\matrix
```

## Start coding

```powershell
docker compose up --pull always -d
```

This starts:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- PostgreSQL: port 5423

The `backend` and `frontend` source folders are bind-mounted, so code changes are reflected without rebuilding the image.

## Pause coding

```powershell
docker compose stop
```

This stops the containers while preserving them and their data.

## Resume coding

```powershell
docker compose start
```

## Stop and remove project containers

```powershell
docker compose down
```

This removes the project containers and network but keeps named volumes, including database data and uploaded files.

Do not use this unless you intentionally want to delete the project volumes and their data:

```powershell
docker compose down -v
```

## Rebuild after changing Dockerfiles

```powershell
docker compose up --pull always -d --build
```

Use this after changing a Dockerfile, dependency manifest, or installed system dependency.

## View logs

```powershell
docker compose logs -f frontend backend
```

Press `Ctrl+C` to stop viewing logs. This does not stop the containers.

## Check container status

```powershell
docker compose ps
```

Healthy services should show `Up (healthy)`.

## Quick reference

| Task | Command |
|---|---|
| Start coding | `docker compose up --pull always -d` |
| Pause coding | `docker compose stop` |
| Resume coding | `docker compose start` |
| Remove containers | `docker compose down` |
| Rebuild images | `docker compose up --pull always -d --build` |
| View logs | `docker compose logs -f frontend backend` |
| Check status | `docker compose ps` |
