# DECISIONS.md — Architecture Decision Records

> Key decisions that shaped this codebase. Format: ADR-NNN. Status is `accepted` unless noted.
> Evidence paths are given so future sessions can verify rather than trust.

---

## ADR-001 — Laravel 11 + MySQL 8 (not Laravel 12 / Postgres)

- **Status:** accepted (verified 2026-10-13).
- **Context:** `backend/composer.json` requires `php: ^8.2`, `laravel/framework: ^11.9`
  (lockfile: `v11.15.0`); `docker-compose.yml` runs `mysql:8.0`.
- **Decision:** stay on Laravel 11 / PHP 8.2 / MySQL 8 for this deployment.
- **Consequences:** the Phase-2 prompt's "Laravel 12 needs PHP 8.3" premise does not apply;
  Dockerfile `php:8.2-fpm` **matches** the codebase. Upgrading to 12/8.3 is deferred, not a blocker.

## ADR-002 — Sanctum Bearer tokens (stateless SPA auth)

- **Status:** accepted.
- **Context:** SPA needs simple token auth; no SSR, no cookie session flow.
- **Decision:** Sanctum personal-access tokens (`createToken('main')`), stored in
  `localStorage.ACCESS_TOKEN`, sent as `Authorization: Bearer`. Session driver stays `database`
  but is unused for API auth; CORS wide-open (`*`, no credentials).
- **Consequences:** trivial to host API + SPA on one subdomain; logout revocation bug
  (`->delete` missing `()` in `AuthController::logout`) means logout is currently client-side only.

## ADR-003 — Action classes instead of Services/Repositories

- **Status:** accepted.
- **Context:** CRUD per domain threatened to bloat controllers.
- **Decision:** `App\Actions\<Domain>\{Get,Show,Store,Update,Delete}*` hold query/business logic;
  thin controllers delegate; `App\Services\*` reserved for cross-cutting work
  (reports, history, master-data generation, relation checks). No repository interfaces.
- **Consequences:** predictable `Controller → Action → Model → Resource` flow (see
  `ARCHITECTURE.md §3`); test surface is Actions, but no Action tests exist yet.

## ADR-004 — Single-DB org-scoped tenancy via `org_code`

- **Status:** accepted.
- **Context:** need org isolation without tenant-DB ops overhead for a portfolio app.
- **Decision:** shared tables + `organization_id` on every domain row + `forOrganization` scopes;
  signup creates or joins orgs by `code`; new orgs get generated master data
  (`MasterDataGeneratorService`).
- **Consequences:** cheap isolation, but every query must remember the scope; a missed scope leaks
  cross-org data. Join-approval flow (`status=pending`) is only half-traced — see STATE.md TODO.

## ADR-005 — React 18 SPA + Vite (single frontend)

- **Status:** accepted.
- **Context:** one team UI, no storefront/admin split like ecommerce.
- **Decision:** single React 18 + Vite 5 + Router 6 SPA; `vite build` → static `dist/` served by nginx;
  API base is build-time `VITE_API_BASE_URL`.
- **Consequences:** deploy is "build once with correct env, serve statically". `VITE_` values bake
  into the bundle — changing API URL requires rebuild.

## ADR-006 — Centralized frontend API table + one Axios instance

- **Status:** accepted.
- **Context:** hard-coded paths caused refactor pain (postmortem: "Frontend API Route Management").
- **Decision:** `src/constants/api.js` (`API(version)`) is the only place paths are built;
  `src/axios.client.js` owns baseURL, Bearer injection, and 401→login redirect. Components and
  Zustand stores consume these; never raw Axios.
- **Consequences:** endpoint changes are one-file edits; inconsistent backend envelope (§ADR-008
  of response shape) is absorbed per-call rather than fixed centrally.

## ADR-007 — Zustand per-domain stores + context shells

- **Status:** accepted.
- **Context:** server state per view (tasks, projects, epics, kanban, dashboard) + tiny global UI state.
- **Decision:** per-domain Zustand stores under `src/store/`; `AuthContext` for user/token;
  ephemeral UI in small contexts (Toast/Sidebar/Load/Scroll). No TanStack Query, no Redux.
- **Consequences:** simple mental model; caching/dedup is manual. Fine at portfolio scale.

## ADR-008 — Inconsistent `{success,…}` envelope kept (not normalized)

- **Status:** accepted (regretfully — would change if reviving the product).
- **Context:** `apiResponse()` helper returns `{success, message, data[, errors]}` but `login`/
  `logout` and some paths return raw shapes.
- **Decision (historical):** keep shipping features rather than normalize the contract.
- **Consequences:** frontend handles shapes ad hoc; any new endpoint must be checked individually.
  Documented here so deploy work doesn't "fix" it silently — normalization is out of scope.

## ADR-009 — php-fpm + nginx in ONE backend container

- **Status:** accepted historically; **revisit for VPS deployment** (see audit).
- **Context:** simplest single-host story (Render-style): one image serves port 80 directly.
- **Decision:** `backend/Dockerfile` installs nginx inside `php:8.2-fpm` and launches both via
  `docker/start.sh`.
- **Consequences:** self-contained but clashes with the VPS plan (host Nginx already owns 80/443;
  ecommerce pattern is php-fpm:9000 + host-Nginx). Audit proposes splitting or re-porting.

## ADR-010 — Database drivers for session/cache/queue; local disk; log mailer

- **Status:** accepted.
- **Context:** no Redis/queue/mail infra wanted for a portfolio deploy.
- **Decision:** `SESSION_DRIVER=database`, `CACHE_STORE=database`, `QUEUE_CONNECTION=database`
  (tests use `array`/`sync`), `FILESYSTEM_DISK=local`, `MAIL_MAILER=log`.
- **Consequences:** zero extra services; queue work needs `php artisan queue:work` if ever used
  (nothing currently dispatches heavy jobs — verify before adding a worker).

## ADR-011 — Stop product development; keep as portfolio/beta

- **Status:** accepted (`PROJECT_POSTMORTEM.md`, reiterated in `VISION.md`).
- **Context:** 8-month build, adoption friction, crowded market, scope creep.
- **Decision:** stop feature work; deployment track is demo-preservation only.
- **Consequences:** `ROADMAP.md` pending items stay pending; deployment must not be used as cover
  for a feature revival.

## ADR-012 — Split backend to php-fpm:9000 behind the shared nginx container (project.otokse.com)

- **Status:** accepted 2026-10-13 (audit-approved; VPS verified: traffic flows through
  `ecommerce-nginx-1`, host Nginx inactive, ports 8001/8002/9000 free).
- **Context:** old backend image bundled php-fpm + nginx on :80 (ADR-009); VPS 80/443 are
  owned by the existing nginx container serving api/customer/admin/landing.
- **Decision:** backend image is php-fpm-only (`project_backend:9000`, no host ports); new compose
  project at `/var/www/project` (own `project_network`, `project_*` names/volumes); the nginx
  container joins `project_network` (external) and serves `/api/`→fastcgi, `/`→SPA static from
  `project_frontend_dist`, `/storage/`→`project_storage` alias. MySQL internal-only. SPA uses
  same-origin `/api` (empty `VITE_API_BASE_URL` build). Separate Certbot cert for the subdomain.
  Stale samples deleted (kept: `.archive/docker-nginx.conf` reference).
- **Consequences:** one-line-shape change to the ecommerce compose (external network/volume
  pattern, reload-only, no downtime); healthchecks are process-level for php-fpm (:9000 is
  FastCGI — `curl http://:9000/up` cannot work); logout revocation fixed (`->delete()`).
- **Deferred:** response-envelope normalization stays tech debt (ROADMAP.md).
