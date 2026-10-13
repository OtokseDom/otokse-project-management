---
updated: 2026-10-13T00:00:00+00:00
---

# Session Handoff — Otokse Project Management

> Read at session start with `VISION.md` + `.gsd/STATE.md` (+ `ROADMAP.md` when planning).
> This file carries audit findings + gotchas. Code/config unchanged this session (audit-only).

## Quick start

1. Read `VISION.md` (portfolio subdomain, no third-party services, product stopped).
2. Read `.gsd/STATE.md` (position: docs done, audit awaiting approval).
3. Read this file (audit + gotchas below).
4. Follow `AGENTS.md` routing + `PROJECT_RULES.md` (SPEC → PLAN → EXECUTE → VERIFY → COMMIT).

## Current position

Step-2 blocker fixes **built locally, uncommitted, undeployed** (2026-10-13). VPS state verified
via SSH (details below). Target: `project.otokse.com` → `66.253.10.48` (Cloudflare proxied A,
done by user). No fixes pushed; diff shown for approval this session.

**Correction:** there is no active host Nginx — traffic flows through the `ecommerce-nginx-1`
container (`/var/www/ecommerce/nginx/conf.d/`). The new server block targets that container.

## Audit findings (summary — full detail in session report)

### Exists and correct

- `backend/Dockerfile` base `php:8.2-fpm` **matches** Laravel 11 / `php ^8.2` (NOT a 12/8.3 mismatch).
  Extensions present: `pdo_mysql, mbstring, exif, pcntl, bcmath, gd` + Composer copy.
- `backend/.dockerignore` exists; `frontend/Dockerfile` two-stage build is sound;
  `frontend/.env.example` correctly documents the single var (`VITE_API_BASE_URL`).
- Session/cache/queue on `database` — zero extra services needed. `MAIL_MAILER=log`, local disk.
- Host ports in compose (8001/8002) don't collide with ecommerce's 3000/3001/9000.

### Exists and needs updating (specifics)

1. **Compose identity collides:** container names `otokse_mysql/backend/frontend`, network
   `shared_backend` (external:true), DB `v2`/`root`/`root`, `APP_URL=otokse.lidta.com` — all must be
   renamed/repointed (`project_*`, own network/volume, `APP_URL=https://project.otokse.com`,
   `APP_ENV=production`, `APP_DEBUG=false`, secrets via env_file, no plaintext prod password).
   Missing: named-volume clarity per service, healthchecks, restart already ok.
2. **Backend serving vs VPS pattern:** image bundles php-fpm + nginx on :80 (`docker/start.sh`
   never runs migrations, only `route/view:cache`). Ecommerce expects php-fpm:9000 behind host-Nginx.
   Decide: (a) split to php-fpm:9000 + host-Nginx block, or (b) keep :80 container behind host reverse-proxy.
   Either way `fastcgi_pass 127.0.0.1:9000` + `proxy_pass http://backend:80/...` lines need rework.
3. **Frontend `/api` proxy is network-locked:** `frontend/nginx.conf:11` (`proxy_pass http://backend:80`)
   only resolves inside old compose network. For single-subdomain serving, host-Nginx should route
   `/api/` → backend and `/` → static SPA; or rebuild SPA with `VITE_API_BASE_URL=https://project.otokse.com`.
   Also `frontend/.env` is local (`http://localhost:8000`) and must not ship to prod.
4. **CORS + Sanctum domains:** CORS `*` works for Bearer but should explicitly allow
   `https://project.otokse.com`; add `SANCTUM_STATEFUL_DOMAINS=project.otokse.com` (currently
   localhost-only defaults; harmless for Bearer but incorrect).
5. **`nginx/laravel.conf`** (root sample, `fastcgi_pass laravel_app:9000`) is stale — replace with real
   `project.otokse.com` host block using `resolver 127.0.0.11 valid=10s` + variables for upstreams.

### Missing entirely

- Host-Nginx server block for `project.otokse.com` (HTTP + HTTPS + `/.well-known/acme-challenge/`).
- Healthchecks in compose; documented migrate-on-boot (`php artisan migrate --force`) step or one-shot.
- Production `.env` mapping (`APP_KEY` generate, `DB_*` to new MySQL service, `SESSION_SECURE_COOKIE`,
  `SESSION_SAME_SITE`, `LOG_LEVEL`, `APP_TIMEZONE` currently `Asia/Dubai` — confirm vs `Asia/Manila`).
- Decision on queue worker (nothing dispatches jobs today — likely no worker needed).

### Code-health flags (not deploy blockers, fix opportunistically)

- `logout` bug (`->delete` without `()`); inconsistent `apiResponse` vs raw `response()` shapes;
  `User` model hardcodes `$connection='mysql'`; `MasterDataGeneratorService` + seeders overlap;
  only placeholder tests (`ExampleTest`); `composer.json`/`package.json` deps are ~1yr old
  (`composer outdated` / `npm outdated` never run this session — run before deploy).

## Gotchas for next session

- `VITE_API_BASE_URL` bakes into `dist/` at build time — changing it needs frontend rebuild.
- Every domain query must carry `forOrganization($orgId)` — a missing scope leaks cross-org data.
- Kanban order is per-context (`task_positions`), not global — test reorder in each grouping.
- `docker/start.sh` clears config/cache/route/view then caches route+view only (no `config:cache`);
  `backend/start.sh` is a different, stale script (Cloudinary, commented migrate) — don't confuse them.
- `DB_DATABASE=v2` is the current dev name — do not reuse for the new prod DB.
- Frontend dev port is 3000 (`vite --port=3000`) — collides conceptually with ecommerce's 3000 mapping;
  irrelevant in production static serving, but don't publish dev ports on the VPS.

## Links

- Arch: `ARCHITECTURE.md` (§8 topology) · Vision: `VISION.md` · Decisions: `DECISIONS.md` (ADR-012)
  · Roadmap: `ROADMAP.md` (tech-debt section)
- State: `.gsd/STATE.md` · Rules: `PROJECT_RULES.md` · Retrospective: `PROJECT_POSTMORTEM.md`
- Deploy inputs: `nginx/project.otokse.com.conf` (block + ecommerce snippet + Certbot cmd),
  `docker-compose.yml.example`, `.env.example`, `backend/.env.example`
- Reference (other repo, same VPS): `/var/www/ecommerce/docker-compose.yml`,
  `/var/www/ecommerce/nginx/conf.d/` (verified live 2026-10-13)

## VPS verification (Step 1, 2026-10-13, read-only SSH as deploy@66.253.10.48)

- Traffic: `ecommerce-nginx-1` (Up 9d, :80/:443); host nginx `inactive`, `/etc/nginx` file stale.
- Compose at `/var/www/ecommerce/docker-compose.yml` == local copy; net `ecommerce_ecommerce`.
- `server_name`: api/customer/admin.otokse.com, otokse.com+www (all on api.* cert). No project block.
- Ports taken: 22/80/443/3000/3001/5432. Free: 8001/8002/9000 (unused — new project publishes none).
- Disk 5.5G free / 19G; mem ~2.5G avail. Certbot present; `sudo` needs TTY password (user runs).
- Decision: new project at `/var/www/project`, nginx joins `project_network` (external pattern).
