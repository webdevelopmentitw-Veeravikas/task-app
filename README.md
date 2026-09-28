# Task Manager

A small task app for local DevOps practice. React serves the UI, Express exposes the REST API, and MySQL stores the tasks. Docker Compose starts all three.

## Prerequisites

- Docker Desktop (Compose v2)
- For the Jenkins pipeline: a Linux agent with Node.js 20, Docker, and the credentials listed below

## Run locally

From this directory:

```bash
copy .env.example .env
docker compose up -d
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

Replace the passwords in `.env` before using the stack anywhere other than your own machine. The application reads database settings from the environment. Passwords are not stored in source code.

When the containers are healthy:

- App: http://localhost:8080
- API: http://localhost:3001/api/tasks
- MySQL from the host: `127.0.0.1:3307` (inside Compose the host name is `mysql` on port `3306`)

Stop the stack:

```bash
docker compose down
```

Remove the database volume as well:

```bash
docker compose down -v
```

## REST API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Database connectivity check |
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Replace title, description, and status |
| DELETE | `/api/tasks/:id` | Delete a task |

Create example:

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Ship the pipeline\",\"description\":\"Practice build\",\"status\":\"pending\"}"
```

`status` is `pending`, `in_progress`, or `done`. If omitted on create, it defaults to `pending`.

## Environment variables

`.env` holds both databases. `APP_ENV=local` uses `LOCAL_DB_*`. `APP_ENV=live` uses `LIVE_DB_*`.

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | `local` or `live` |
| `LOCAL_DB_HOST`, `LOCAL_DB_PORT`, `LOCAL_DB_USER`, `LOCAL_DB_PASSWORD`, `LOCAL_DB_NAME` | Database on this machine |
| `LIVE_DB_HOST`, `LIVE_DB_PORT`, `LIVE_DB_USER`, `LIVE_DB_PASSWORD`, `LIVE_DB_NAME`, `LIVE_DB_SSL` | Live database |
| `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | MySQL container for `docker compose up` |

## Jenkins

The `Jenkinsfile` runs: Checkout, Install Dependencies, Test, Build, Docker Build, Docker Push, Deploy.

Set `DOCKER_REGISTRY` on the job (for example `docker.io` or a private registry host). Optional: `IMAGE_NAMESPACE`, `MYSQL_DATABASE`, `MYSQL_USER`.

Create these Jenkins credentials:

| Credential ID | Type |
| --- | --- |
| `docker-registry` | Username and password |
| `mysql-root-password` | Secret text |
| `mysql-app-password` | Secret text |

Deploy runs `docker compose up -d --build` on the agent and expects those database secrets in the environment.

## Tests

```bash
cd backend && npm ci && npm test
cd frontend && npm ci && npm test
```
