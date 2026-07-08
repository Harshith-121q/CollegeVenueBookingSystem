# Backend — Deploy notes (Render)

This file contains quick instructions to deploy the `Backend` service on Render.

1) Repository root / Monorepo
- If your repo is a monorepo (project contains both `Frontend` and `Backend`), set Render's **Root Directory** to `Backend` so Render runs commands in the backend folder.

2) Build & Start commands
- Build command: `npm install`
- Start command: `npm start` (runs the `start` script in `package.json`, which is `node server.js`).

3) Environment variables (add these in Render → Environment)
- `DB_URL` — MongoDB connection string (include DB name). Example: `mongodb://user:pass@host1,host2/dbname?ssl=true&replicaSet=...&authSource=admin`
- `SECRET_KEY` — your JWT / session secret
- `AI_AUTOMATION_ENABLED` — `true` or `false`
- `AI_WEBHOOK_URL` — webhook endpoint for AI callbacks
- `AI_API_KEY` — secret API key used to validate AI requests
- `NODE_ENV` — `production` (recommended)
- `PORT` — optional (Render provides a port via `PORT` environment variable automatically)

4) Security
- Never commit real secrets to the repo. Keep `Backend/.env.example` in the repository as a template, but do not commit `Backend/.env` containing real secrets.
- If a password contains special characters (`@`, `:`, `/`, `?`, `#`, `%`), percent-encode them in the connection string.

5) Quick local test
```
cd Backend
npm install
PORT=4000 npm start    # use appropriate platform command on Windows
```

6) Common Render service settings
- Environment: `Node` (or automatic)
- Plan: Free / Paid depending on needs
- Health check: optional; Render will use your start command

If you want, I can add a sample Render `start`/deploy instruction in the repo root or create a small `deploy.md` with screenshots.
