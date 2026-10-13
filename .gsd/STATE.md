---
updated: 2026-10-13T00:00:00+00:00
---

# Project Management — State

> Single source of truth for position + next actions. Update at session end when code, decisions,
> or audit findings change. Detail: `ARCHITECTURE.md`; direction: `VISION.md`; history: `DECISIONS.md`.

## Current position (2026-10-13 — DEPLOYED, LIVE at https://project.otokse.com)

**Deployed and smoke-tested.** Stack at `/var/www/project` (compose `project`: backend + mysql
healthy, 24 tables migrated, empty DB per strategy). Nginx `project.otokse.com.conf` live in
`ecommerce-nginx-1` (:80 + :443, separate Certbot cert to 2027-01-11). Smoke: signup (org +
master data) → login → project → task → Kanban move → discussion + file upload → /storage/
serve → org + user dashboards → logout 204 + token reuse 401. Smoke data wiped
(`migrate:fresh`, 0 users/orgs). Two deploy-time fixes committed: PDO entrypoint wait,
explicit volume names, `delay_reasons.code` removal (signup 500 root cause).

## Gates

| Area | Status | Evidence |
|------|--------|----------|
| Docs Phase 1 | ✅ complete | 8 files |
| VPS Step 1 | ✅ verified | SSH checks 2026-10-13 |
| Deploy Step 2 | ✅ live | https://project.otokse.com 200, API + smoke green |
| Ecommerce collateral | ✅ none | api 200, customer/admin/landing 301 post-reload |

**VPS verified via SSH** (`deploy@66.253.10.48`): traffic flows through `ecommerce-nginx-1`
(host Nginx inactive — earlier "host Nginx" phrasing corrected); network `ecommerce_ecommerce`;
ports 80/443/3000/3001/5432 taken, 8001/8002/9000 free. Cloudflare A record
`project.otokse.com → 66.253.10.48` (proxied) done by user.

**What was built:** php-fpm-only `backend/Dockerfile` + `docker/entrypoint.sh`;
`docker-compose.yml` (+ tracked `.example`) with `project_*` names, no host ports, healthchecks;
`nginx/project.otokse.com.conf`; hardened `backend/.env.example`; `CORS_ALLOWED_ORIGINS`
wiring; extended `.dockerignore`; logout fix; stale-sample cleanup; same-origin frontend;
ADR-012. Deploy-time fixes: PDO entrypoint wait, explicit volume names, `delay_reasons.code`
removal (see HANDOFF).

## Next (routine ops)

- `frontend-build` one-shot needs `--force-recreate` on each SPA change; backend redeploys
  re-run `migrate --force` in entrypoint (verify log on each deploy).
- Org join-approval flow (`status=pending`) still untraced — verify or document manual step.
- Cert expires 2027-01-11 (auto-renewal configured by user).
