---
updated: 2026-10-13T00:00:00+00:00
---

# Project Management — State

> Single source of truth for position + next actions. Update at session end when code, decisions,
> or audit findings change. Detail: `ARCHITECTURE.md`; direction: `VISION.md`; history: `DECISIONS.md`.

## Current position (2026-10-13, Step 2 built locally — NOT committed, NOT deployed)

**VPS verified via SSH** (`deploy@66.253.10.48`): traffic flows through `ecommerce-nginx-1`
(host Nginx inactive — earlier "host Nginx" phrasing corrected); network `ecommerce_ecommerce`;
ports 80/443/3000/3001/5432 taken, 8001/8002/9000 free; disk 5.5G free; Cloudflare A record
`project.otokse.com → 66.253.10.48` (proxied) done by user.

**Blocker fixes built locally, awaiting user approval of the diff:**
new php-fpm-only `backend/Dockerfile` + `docker/entrypoint.sh` (migrate --force);
rewritten `docker-compose.yml` (+ tracked `.example`) with `project_*` names, no host ports,
healthchecks; `nginx/project.otokse.com.conf` server block + ecommerce-compose snippet;
hardened `backend/.env.example` (production, Manila, sanctum/CORS/session/log); wired
`CORS_ALLOWED_ORIGINS` in `config/cors.php`; extended `backend/.dockerignore`;
fixed `AuthController::logout` (`->delete()`); deleted stale samples (reference kept at
`.archive/docker-nginx.conf`); `frontend/.env.production` (same-origin) + axios
trailing-slash normalization + `frontend/.env.example`; ADR-012 added.

## Gates

| Area | Status | Evidence |
|------|--------|----------|
| Docs Phase 1 | ✅ complete | 8 files, verified against code |
| VPS Step 1 | ✅ verified | SSH checks 2026-10-13 (see HANDOFF) |
| Deploy changes Step 2 | ✅ built, ⬜ NOT committed/pushed/deployed | `git diff HEAD` shown to user this session |
| Deploy on VPS | ⬜ blocked on diff approval | — |

## Next actions (in order)

1. User approves the Step-2 diff (this session's report).
2. Commit + push (`docs`/`feat`/`fix`/`chore` split, one task = one commit).
3. On VPS: `git clone` to `/var/www/project`, create `/var/www/project/.env` +
   `/var/www/project/backend/.env` (strong passwords, `APP_KEY` generate), build + up.
4. Copy `nginx/project.otokse.com.conf` to ecommerce `conf.d/` (:80 first), apply ecommerce
   compose snippet, `docker compose up -d nginx`, user-run Certbot, add :443, reload.
5. Smoke test: signup, login, Kanban DnD, upload, dashboards. Then update HANDOFF "live".

## TODO / uncertainties (carried over)

- [ ] Org join-approval flow (`status=pending`) — still untraced; verify post-deploy or document manual step.
- [ ] `php artisan migrate --force` runs in entrypoint — confirm first-boot log on VPS.
- [ ] `frontend-build` one-shot needs `--force-recreate` on each SPA change — confirm flow on VPS.
- [ ] `sudo` on VPS needs TTY password — user runs Certbot/reload commands (exact commands in conf header).
