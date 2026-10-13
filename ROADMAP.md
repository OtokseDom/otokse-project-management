# ROADMAP.md — Status and Future Work

> Source: `README.md` (features/upcoming), `PROJECT_POSTMORTEM.md` (retrospective),
> git history (last commit 2026-02-22). Status as of 2026-10-13.

---

## Complete (shipped, beta)

- **Orgs & access:** org create/join via `org_code`; roles Employee/Manager/Admin/Super Admin;
  basic email+password auth; org profile page.
- **Hierarchy:** Epics → Projects → Tasks; parent/subtask nesting; statuses; categories; delay reasons.
- **Task engine:** full CRUD; bulk update/delete; move; per-context positions (`task_positions`);
  history audit trail; discussions + file attachments; relation pre-delete checks.
- **Views:** List (DataTable, sortable/searchable), Kanban (DnD, status columns), Calendar
  (`start_date`/`end_date`), Week (`start_time`/`end_time`), Grouped lists (by status/category/project).
- **Dashboards:** org dashboard + user dashboard with date/project/epic/user filters and
  delay/efficiency/workload metrics (`ReportService`, `DashboardReportController`, `UserReportController`).
- **Infra:** Docker images for backend + frontend; `docker-compose.yml` (mysql/backend/frontend);
  Render-oriented nginx samples; Vercel rewrite; demo seeders + new-org master-data generator.

## Pending (acknowledged, not scheduled — product is stopped)

From `README.md §Upcoming` + postmortem deferred list:

- [ ] Notifications & mentions (task discussions/updates)
- [ ] User tagging in comments
- [ ] Import / Export (CSV, Excel, JSON)
- [ ] Gantt / Timeline view
- [ ] Grouped-list expansion, task archiving, advanced Kanban sorting
- [ ] Task automation rules (auto-assign / status)
- [ ] Stronger auth (email verification enforcement, password strength, SSO/MFA)
- [ ] Data backup & restore
- [ ] AI insights / data-entry companion

None of the above is in the deployment track. Implementing any of them requires a new decision
overriding ADR-011.

## Technical debt (acknowledged, deferred)

- [ ] **Response-envelope normalization** — `apiResponse()` (`{success,…}`) vs raw `response()`
  shapes per endpoint (deferred per 2026-10-13 decision; frontend absorbs per-call).
- [ ] **Test coverage** — only placeholder `ExampleTest`s; add feature tests per touched endpoint
  before any future backend change.
- [ ] **Dependency freshness** — Laravel 11.15 → 12.x major available (do NOT upgrade for this
  deploy); Radix/Tiptap/TanStack minors pending (`npm outdated` 2026-10-13).

## Out of scope (will not do)

- Payments, billing, or any third-party gateway
- External email delivery, external object storage/CDN, external APIs
- Multi-region/HA, horizontal scaling, uptime SLOs
- Product revival (new modules, market launch, user migration)

## Deployment track (next — gated on user approval of the audit)

1. Approve Phase-2 audit findings (blockers vs warnings).
2. Fix blockers (compose network/ports/names, backend serving split or re-port, frontend API URL
   strategy, `APP_URL`/env, migration step, storage volume).
3. Provision on VPS: new compose project, host-Nginx `project.otokse.com` block (HTTP → Certbot → HTTPS),
   A record, first deploy + migrate + smoke test.
4. Seed demo org (optional) and verify dashboards/Kanban/uploads.
