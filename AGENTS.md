# AGENTS.md — Otokse Project Management

Traffic controller for this repo. Single Laravel API + single React SPA (not a monorepo of many apps).

## Projects

| Keyword | Path | Stack |
|---------|------|-------|
| `backend` | `backend/` | Laravel 11 + MySQL 8 (Sanctum Bearer, Actions + Services, no repos) |
| `frontend` | `frontend/` | React 18 + Vite 5 + Router 6 + Axios + Zustand |
| `infra` | `docker-compose.yml`, `nginx/`, `backend/docker/`, `frontend/nginx.conf` | Docker + Nginx, target `project.otokse.com` |

## Routing rules

- **Say "backend"** → work inside `backend/`; API routes are all `routes/api.php` under `/api/v1`.
- **Say "frontend"** → work inside `frontend/`; endpoint table is `src/constants/api.js`, HTTP in `src/axios.client.js`.
- **Say "infra/deploy"** → compose + Dockerfiles + nginx samples; respect ecommerce VPS ports/network.
- **Ambiguous / "the app"** → read `.gsd/STATE.md` + `.gsd/HANDOFF.md` first, then drill into the active side.

## Session start protocol

1. Read `VISION.md` — portfolio subdomain, no third-party services, product stopped (ADR-011).
2. Read `.gsd/STATE.md` — position, gates, TODOs.
3. Read `.gsd/HANDOFF.md` — audit findings + gotchas (top table).
4. If planning: add `ROADMAP.md` + `ARCHITECTURE.md` on demand — not mandatory for in-progress `EXECUTE`.
5. Reality checks before new work: `git status --short`, `git log --oneline -5`, verify active branch;
   if consuming an endpoint, re-read its route + controller + `constants/api.js` entry (response shapes vary).

## Session end protocol

Any session that changes code, decisions, or audit status MUST sync docs before closing:

- Always: `.gsd/STATE.md` + `.gsd/HANDOFF.md` (position, evidence, next).
- When structure changed: `ARCHITECTURE.md`.
- When scope/direction changed: `VISION.md` + `ROADMAP.md` checkbox.
- When a choice was made: `DECISIONS.md` (new ADR or status change).
- Uncaptured claims ("tests pass") do not count — capture real command output.

## Standing rules

- **No fabricated docs:** if the code is unclear, say so and file a TODO in `.gsd/STATE.md`.
- **Search first:** grep before full reads; targeted line ranges only.
- **Prove it:** every change verified with captured output before "done".
- **One task = one commit:** `type(scope): description` (`feat|fix|docs|refactor|test|chore`).
- **Same-VPS discipline:** no new host ports that collide with ecommerce (3000/3001/9000/80/443);
  no container/network/volume names that collide (`otokse_*`, `shared_backend`, `mysql_data` are taken
  conceptually — rename with `project_` prefix); host-Nginx owns 80/443 + Certbot.
- **No third-party services:** mail stays `log`, storage stays local, no new SaaS without ADR.
- **Security:** never commit secrets; production env via `env_file`/host env, never baked into images.
