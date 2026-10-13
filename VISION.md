# VISION.md — Otokse Project Management

> Guiding light for this repo. If a decision conflicts with this document, resolve it here first.
> Read alongside `.gsd/STATE.md` and `ROADMAP.md` at session start.

---

## 1. What this is

A **portfolio project-management web app** (Laravel API + React SPA + MySQL) demonstrating
full-stack system design: org-scoped multi-tenancy, role-based access, task hierarchies, Kanban,
reporting, and file-backed discussions. Previously live as a beta at `otokse.lidta.com`;
being prepared for `project.otokse.com` as a **small, low-traffic portfolio subdomain** on the
same VPS as the ecommerce platform.

## 2. Why it exists

Per `PROJECT_POSTMORTEM.md`: an ~8-month internal build that succeeded as a **learning and
systems-design exercise** — clean API layering, centralized frontend API constants, validation +
Resource transformers — but was **stopped intentionally** as a product (adoption friction, crowded
market, expanding scope, diminishing refactor returns). Its second life is as **evidence of work**:
a deployable, explorable artifact for recruiters/hiring managers, not a business.

## 3. Target audience

| Audience | What they get |
|----------|---------------|
| Recruiters / hiring managers | A live subdomain to click through (dashboard, Kanban, tasks, reports) + readable codebase |
| Fellow developers | Action/Service layering, org-scoping, position-system patterns to read |
| Demo users | Test/dummy data only — beta disclaimers apply (see README) |

No real teams, no SLA, no paying users.

## 4. Scope — what it does / doesn't do

**Does (shipped, beta):** orgs + `org_code` join; roles (Employee/Manager/Admin/Super Admin);
Epics → Projects → Tasks (+ subtasks); statuses/categories/delay reasons; Kanban/list/calendar/week
views; dashboards (org + user); task history/discussions/attachments; grouped lists.

**Doesn't do (and won't for this deployment):** notifications/mentions, user tagging, CSV/Excel
import-export, Gantt/timeline, automation rules, archiving, SSO/MFA, backup/restore, AI insights,
email verification/enforcement, payments, or any third-party service. See `ROADMAP.md` for the
pending vs out-of-scope split.

## 5. Operating constraints for this deployment

- **Subdomain only** (`project.otokse.com`); user adds the DNS A record. No new domain purchase.
- **Same VPS as ecommerce** (Zenlayer Manila `66.253.10.48`, `deploy` user) — respect its ports
  (3000, 3001, 9000, 80, 443), its `ecommerce` Docker network, and its host-Nginx + Certbot setup.
- **No third-party services** — mail stays `log`, storage stays local disk, queue/cache stay
  `database`/`sync`-compatible. No Redis unless we choose to add it (we don't need to).
- **Low-traffic portfolio** — no HA, no scaling story; single MySQL container with a named volume is fine.

## 6. Future aspirations

None as a product — the postmortem decision to stop stands. Aspirations are limited to:
keeping the demo deployable and honest (beta disclaimers stay), small polish that aids
evaluation (seed demo org, fix logout revocation, tighten CORS/stateful domains), and reusing
proven patterns elsewhere. Anything resembling a product revival (notifications, Gantt, AI,
import/export) is explicitly out of scope for the deployment track.
