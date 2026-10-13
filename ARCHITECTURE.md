# ARCHITECTURE.md — Otokse Project Management

> **Read this first.** Companion to `VISION.md` (why), `DECISIONS.md` (why this way),
> `ROADMAP.md` (what's done / left), and `.gsd/` (current state + handoff).
> All claims verified against the codebase 2026-10-13. Uncertainties are flagged inline.

---

## 1. What the app does

A web-based **project and task management** app for teams (beta). Core loop:

- An **organization** is created (or joined via `org_code`) at signup.
- Inside an org: **Epics → Projects → Tasks** (tasks support parent/subtask hierarchy).
- Tasks move through **statuses**; Kanban columns derive from statuses.
- Tasks carry **categories**, **delay reasons**, **discussions + attachments**, **history**, and **per-context positions** (Kanban ordering).
- **Dashboards** (org-wide + per-user) aggregate metrics with date/project/epic/user filters.

No payments, no external APIs, no email delivery (`MAIL_MAILER=log`), no CDN/storage service.
Single SPA frontend + single Laravel API + MySQL.

Live beta previously at `https://otokse.lidta.com` (see `README.md:80`). Target for this
deployment track: `https://project.otokse.com` on the same VPS as ecommerce.

---

## 2. Repo layout

```
.
├── backend/                 # Laravel 11 API (PHP ^8.2, actual installed v11.15.0)
│   ├── app/
│   │   ├── Actions/         # Business-logic units per domain (see §3)
│   │   ├── Http/
│   │   │   ├── Controllers/Api/v1/  # 17 controllers, all under /api/v1
│   │   │   ├── Requests/    # FormRequests (validation)
│   │   │   └── Resources/   # API Resources (response transformers)
│   │   ├── Models/          # 14 Eloquent models
│   │   ├── Services/        # Cross-cutting services (reports, history, master-data, relations)
│   │   └── Helpers/ApiResponse.php  # apiResponse() helper (aut loaded via composer files)
│   ├── routes/api.php       # All routes under prefix v1; auth:sanctum except signup/login
│   ├── database/migrations/ # 23 migrations (orgs → users → tasks → epics → delay reasons …)
│   ├── database/seeders/    # Full demo seeder chain (DatabaseSeeder calls 11 seeders)
│   ├── config/              # Stock Laravel 11 config (cors, sanctum, session, cache, queue …)
│   ├── Dockerfile           # php:8.2-fpm + nginx in ONE container (see §8)
│   └── docker/{nginx.conf,start.sh}  # In-container nginx + boot script
├── frontend/                # React 18 + Vite 5 SPA
│   ├── src/
│   │   ├── constants/api.js # Central endpoint table API(version) — single source for paths
│   │   ├── axios.client.js  # Axios instance: baseURL = VITE_API_BASE_URL + /api, Bearer injection
│   │   ├── Router.jsx       # createBrowserRouter; AdminLayout (authed) vs GuestLayout
│   │   ├── contexts/        # AuthContextProvider, Toast, Sidebar, Load, Scroll
│   │   ├── store/           # Zustand per-domain stores (tasks, projects, epics, kanbanColumns …)
│   │   ├── pages/           # Dashboard, Kanban, Tasks, Projects, Epics, Schedules, Users …
│   │   └── components/      # AdminLayout, GuestLayout, task/*, ui/* (shadcn-style), chart/*, form/*
│   ├── Dockerfile           # Two-stage: node:18-alpine build → nginx:alpine static serve
│   ├── nginx.conf           # Static SPA + /api proxy (see §8)
│   └── .env / .env.example  # Only VITE_API_BASE_URL
├── docker-compose.yml       # mysql + backend + frontend (host ports 8001/8002)
├── nginx/laravel.conf       # Unused(?) host-level Laravel sample (fastcgi_pass laravel_app:9000 — stale)
└── PROJECT_POSTMORTEM.md    # Author's retrospective (stopped intentionally; learning exercise)
```

> **Note:** `backend/conf/nginx/nginx-site.conf` is a Render-oriented sample (unix socket
> `php-fpm.sock`); not used by the current Docker path. `frontend/old nginx.conf` and
> `backend/start.sh` (Cloudinary references) are stale leftovers — see `.gsd/STATE.md` TODO.

---

## 3. Backend layers — Controller → Action (+ Service) → Model

There is **no Repository layer**. The pattern actually used is:

```
HTTP → routes/api.php (prefix v1)
  → FormRequest (validated())
  → thin Controller (Api/v1/*)
  → Action class (App\Actions\<Domain>\*)  ← business logic lives here
  → Eloquent Model (+ scopeForOrganization / forOrganization)
  → API Resource out (App\Http\Resources\*)
```

Plus two supporting pieces:

- **Services** (`app/Services/`): cross-cutting or report-heavy logic that doesn't fit one CRUD action:
  - `MasterDataGeneratorService` — seeds statuses/categories/etc. for a newly created org at signup.
  - `ReportService` — dashboard + user-report aggregations.
  - `TaskHistoryService` — writes audit rows on task mutation.
  - `RelationCheckerService` — pre-delete usage checks (`POST /v1/relation-check`).
- **Helper** `apiResponse($data, $message, $success, $code, $errors)` (`app/Helpers/ApiResponse.php`,
  composer-autoloaded via `files`). Envelope is `{success, message, data[, errors]}` —
  **not** the ecommerce `{status, message, data, meta, errors}` envelope. And it is applied
  **inconsistently**: `signup` uses `apiResponse`, `login` uses raw `response(compact('user','token'))`,
  `logout` returns `204` empty. Frontend handles both shapes ad hoc.

Example (verified): `ProjectController` delegates to `App\Actions\Projects\GetProjects::execute($orgId)`
which does `Project::forOrganization($orgId)->with([...])->orderByDesc('id')->get()`.

### Request lifecycle (typical authed CRUD)

1. `Authorization: Bearer <sanctum token>` → `auth:sanctum` middleware.
2. Controller resolves org from `$request->user()->organization_id` (never from URL).
3. FormRequest validates; Action queries with org scope; Resource serializes.

### Organization scoping (the multi-tenancy mechanism)

Single database, shared tables, **row-level scoping by `organization_id`**. Every domain model
exposes `scopeForOrganization` / `forOrganization`; controllers/Actions filter by the caller's org.
Joining an org is by `organization_code` at signup; new orgs get a generated `code`
(`strtoupper(uniqid('DOM'))`) plus generated master data. There is no separate tenant DB/schema.

---

## 4. Data flow

```
React page → zustand store → axiosClient (Bearer from localStorage ACCESS_TOKEN)
  → https://<host>/api/v1/<resource>
  → Laravel route → controller → Action/Service → MySQL
  → Resource JSON {success, message, data} → store → component render
```

- Auth bootstrap: `GET /v1/user-auth` (eager-loads `organization`) populates `AuthContext`.
- 401 anywhere → axios response interceptor clears `ACCESS_TOKEN` and hard-redirects to `/login`.
- File uploads (task/discussion attachments): multipart → `storage/app/public` (local disk),
  served via `/storage/` alias when nginx is configured for it.

---

## 5. Database schema overview (MySQL 8.0)

Migrations (`backend/database/migrations/`, 23 files) in dependency order:

| Area | Tables / files |
|------|----------------|
| Orgs & users | `organizations` (incl. unique `code`), `users` (FK `organization_id`, `role`, `status`, `position`, `dob`) |
| Framework | `cache`, `jobs` (+ batches), `sessions` (DB session driver), `personal_access_tokens` (Sanctum) |
| Taxonomy | `task_statuses`, `categories`, `delay_reasons` (org-scoped; code-uniqueness added then removed — see migrations `2026-01-17` / `2026-01-22`) |
| Hierarchy | `epics` (added late, 2025-12-14), `projects` (+ `epic_id` 2025-12-18, plus extra fields 2025-10-27), `tasks` (FKs to org/status/project/category/delay_reason/`parent_id` self-FK; weight/effort columns 2026-01-05) |
| Task support | `task_assignees` (pivot task↔user), `task_histories`, `task_attachments`, `task_discussions`, `task_discussion_attachments`, `kanban_columns`, `task_positions` (per-context ordering) |

Key relations: Org 1—N Users/Epics/Projects/Tasks/Statuses/Categories/DelayReasons; Epic 1—N Projects;
Project 1—N Tasks; Task self-tree (`parent_id`); Task N—M Users via `task_assignees`; Task 1—N
histories/discussions/attachments/positions.

Seeders: `DatabaseSeeder` runs 11 seeders (org → users → statuses → epics → projects → categories →
tasks → history → assignees → kanban columns → delay reasons). Plus runtime
`MasterDataGeneratorService::generate($orgId)` on new-org signup (so empty DB + signup still works).

---

## 6. Frontend structure (React)

- **Stack:** React 18.2, Vite 5, React Router 6 (`createBrowserRouter`), Axios 1.x,
  Zustand 5, React Hook Form + Zod, TanStack Table 8, DnD Kit 6/10, Recharts 2, Radix + Tailwind 3
  (`ui/*` is shadcn-style primitives), Tiptap 3 (rich text in discussions).
- **Entry:** `main.jsx` → `App.jsx` → `Router.jsx`. Two shells: `GuestLayout` (login/signup) and
  `AdminLayout` (everything else + sidebar).
- **API layer (the part to imitate):** no component calls Axios directly. `constants/api.js` is the
  endpoint table; `axios.client.js` owns baseURL + Bearer + 401 handling. Domain `store/*` modules
  call through it.
- **State:** `contexts/AuthContextProvider` (user + token, `localStorage.ACCESS_TOKEN`) +
  per-domain Zustand stores (`tasks`, `projects`, `epics`, `kanbanColumns`, `dashboard`, …) +
  ephemeral UI contexts (Toast, Sidebar, Load, Scroll).
- **Views:** Dashboard (metrics), Kanban (DnD by status), Tasks List (DataTable), Schedules
  (calendar/week), Projects/Epics/TaskStatuses/Categories/DelayReasons/Users/Organization CRUD pages.
- **Build:** `vite build` → `dist/`. Served statically (nginx `try_files … /index.html`; `vercel.json`
  rewrite mirrors this for Vercel preview). API base is build-time `VITE_API_BASE_URL`.

---

## 7. Auth mechanism

- **Sanctum personal-access tokens (Bearer), not cookies.** `signup` and `login` both
  `createToken('main')->plainTextToken`; client stores it as `localStorage.ACCESS_TOKEN` and sends
  `Authorization: Bearer <token>` on every request via the Axios request interceptor.
- **Signup doubles as org provisioning:** new `organization_name` → create org + generate master data
  + user `status=active`; joining with `organization_code` → user `status=pending` (needs approval —
  exact approval endpoint not traced; flagged TODO in STATE.md).
- **Session driver is `database`, but it is effectively unused for API auth** (tokens are stateless
  Bearer; session config only matters for web routes/CSRF which the SPA doesn't use).
- **Known bug (do not rely on):** `AuthController::logout` calls `$user->currentAccessToken()->delete`
  **without parentheses** — token is not actually revoked server-side; logout only clears
  localStorage client-side. Flagged in STATE.md.
- **CORS** is wide open (`allowed_origins: ['*']`, `supports_credentials: false`) — fine for Bearer
  SPA, must stay consistent on the new subdomain.
- **Sanctum `stateful` domains** default to localhost variants; Bearer-token auth doesn't need
  stateful cookies, so no change strictly required — but `SANCTUM_STATEFUL_DOMAINS` should list
  `project.otokse.com` for correctness (audit §7).

---

## 8. Deployment topology (production — approved 2026-10-13, ADR-012)

```
                           Cloudflare (proxied A: project.otokse.com → 66.253.10.48)
                                             │  :80 / :443
                                             ▼
                              ecommerce-nginx-1 (nginx:alpine, existing container)
                              conf.d/project.otokse.com.conf
                                │ resolver 127.0.0.11 valid=10s + variables
                    ┌───────────┴────────────┬──────────────────┐
                    ▼                        ▼                  ▼
            location /api/ →         location / →         location /storage/ →
   fastcgi project_backend:9000   static SPA from      alias project_storage vol
   (SCRIPT_FILENAME                project_frontend_    (local disk, 7d expires)
   /var/www/html/public/index.php) dist volume
                    │                        │                  │
                    ▼                        ▼                  ▼
         project_backend            frontend-build       project_storage vol
   (php:8.2-fpm only, no nginx,     (one-shot: copies    (mounted into backend
    :9000 internal,                  image dist → vol)     at storage/app/public)
    entrypoint migrates --force)
                    │
                    ▼
              project_mysql (mysql:8.0, internal only, named volume)
```

- Compose project at `/var/www/project` — own `project_network` + volumes
  (`project_mysql_data`, `project_storage`, `project_frontend_dist`). **No host ports.**
- `ecommerce-nginx-1` joins `project_network` (external) + mounts the two dist/storage
  volumes (external) — the only change to the ecommerce stack (snippet in the conf header).
- SPA calls same-origin `/api` (`frontend/.env.production` empty + trailing-slash
  normalization in `axios.client.js`). No `api.` subdomain.
- TLS: separate `project.otokse.com` cert via webroot (`certbot certonly --webroot`),
  independent renewal. HTTP-01 served from the :80 block before :443 is added.

## 9. Non-standard patterns & gotchas

1. **Backend was one container with php-fpm + nginx; production splits it** (ADR-012).
   The old `backend/Dockerfile` + `docker/start.sh` (archived to `.archive/docker-nginx.conf`)
   are superseded: backend image is now php-fpm-only on :9000, nginx lives in the
   shared `ecommerce-nginx-1` container. Don't revive the in-image nginx.
2. **Frontend image proxies `/api` to `http://backend:80`** (`frontend/nginx.conf:11-15`) — only works
   inside the old `shared_backend` compose network where a host named `backend` exists. Breaks under a
   new compose project/network unless reworked.
3. **Two response shapes.** `apiResponse()` (`{success,…}`) vs raw `response()` in login/logout and
   some controllers. Frontend parses per-call; don't assume one envelope.
4. **Late-hierarchy smell:** `Epic` was added months after `Project → Task` as the parent layer
   (postmortem §“Hierarchy Design”); some code paths still treat projects as top-level.
5. **Kanban positioning is contextual** (`task_positions` per context/contextId), not a single global
   order — `GetContextPositions` / `UpdateTaskPosition` / `AddNewTaskToAllContexts` own this.
6. **Stale deploy leftovers everywhere:** `backend/start.sh` (Cloudinary publish, commented-out migrate),
   `backend/conf/nginx/nginx-site.conf` (Render socket config), `frontend/old nginx.conf`
   (proxy to `laravel_nginx:8080`), `nginx/laravel.conf` (root-level sample pointing at
   `laravel_app:9000`). None are wired to the current compose; audit lists which to delete vs fix.
7. **Tests are placeholders.** Only `ExampleTest.php` in Feature/Unit; no coverage of Actions/Services.
   `phpunit.xml` has sqlite lines commented out — default DB is whatever `.env` says (MySQL).
