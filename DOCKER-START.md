# Run Teamtrack with Docker

Docker Desktop is the only software you need to install on the host. It runs
MongoDB, Django, and Next.js in separate containers. The first build downloads
images and dependencies, so it needs an internet connection and enough disk
space for Docker Desktop and the images.

## Windows quick start

1. Install and start [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
2. Extract `team-task-tracker.zip`.
3. Open PowerShell in the extracted `team-task-tracker` directory.
4. Run `docker compose up --build`.
5. Wait for startup, then open <http://localhost:3000>.

Check <http://localhost:8000/api/health/>: it should respond with
`{"status":"ok"}`. You can now register an Admin account and create a team.

Stop the foreground process with Ctrl+C. Your MongoDB data stays in a Docker
volume and will be there when you run `docker compose up` again. Avoid
`docker compose down -v`, which removes that volume and its data.

## Port already in use?

The previous non-Docker preview may still occupy ports 3000 and 8000. Copy
`.env.example` to `.env` in this directory and set:

```dotenv
FRONTEND_PORT=3001
BACKEND_PORT=8001
DJANGO_SECRET_KEY=replace-with-a-long-local-random-value
```

Then run `docker compose up --build` and open <http://localhost:3001>.
Changing the backend port requires rebuilding because Next.js embeds the API
URL in the browser bundle. MongoDB uses an internal Docker network port and
does not need a host port.

## Useful commands

Run these from the extracted project directory:

```powershell
docker compose ps                 # see service status
docker compose logs --tail=100   # inspect startup errors
docker compose down              # stop/remove containers, keep database data
docker compose up --build -d     # start in the background
```

If `docker` is not recognized, Docker Desktop is not installed or not started.
If the browser shows a connection error, first inspect `docker compose ps` and
the logs. If account creation cannot reach the API, verify the health URL on
the selected backend port (8000 by default, or 8001 in the example above).
