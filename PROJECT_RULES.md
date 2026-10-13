# PROJECT_RULES.md — Workflow Conventions

> Borrowed from the ecommerce repo's GSD methodology, trimmed for a single Laravel + React repo.
> Canonical here; no per-subproject duplicates.

---

## Core protocol

**SPEC → PLAN → EXECUTE → VERIFY → COMMIT**

1. **SPEC:** define requirements until `Status: FINALIZED` (small `.gsd/SPEC.md` per feature or inline brief).
2. **PLAN:** decompose into tasks with `<verify>` + `<done>` per task.
3. **EXECUTE:** implement task by task, smallest diff first.
4. **VERIFY:** prove with captured output (command results, HTTP responses, screenshots for complex UI only).
5. **COMMIT:** one task = one commit, `type(scope): description`.

**Planning lock:** no implementation code until requirements are FINALIZED.

## Proof requirements

| Change type | Required proof |
|-------------|----------------|
| API endpoint | HTTP response (curl/HTTPie output) |
| UI change | screenshot for new/complex layout; none for token-driven tweaks |
| Build | `npm run build` / `composer install` output |
| Tests | `php artisan test` (backend) / `npm run build + lint` (frontend) output |
| Config/infra | verification command (`nginx -t`, `docker compose config`, container health) |

Never accept "it looks correct" / "this should work". Always require captured output or explicit
user confirmation.

## Testing protocol

- **Backend gate:** full `php artisan test` before marking backend work complete (suite is currently
  placeholders — add feature tests for touched endpoints: positive, validation, authz, 404).
- **Frontend gate:** `npm run build` + `npm run lint` clean before marking frontend work complete.
- **Test-failure rule:** assume the *test* is wrong first; check route/rules/contract; only touch prod
  code when the test is proven correct and a recent change broke it; after 3 failed attempts, dump
  state into `.gsd/STATE.md` and ask the user.

## Search-first + context hygiene

- Grep/ripgrep before full reads; targeted line ranges only; don't reload understood files.
- Stop before quality degrades (~50% context); state-dump after 3 failures; fresh session per wave.
- Plans stay human-readable: **What Will Happen** (user-visible narrative) → **How Verified**
  (command → expected) → **Functional Success Criteria** (checkboxes, no code jargon).

## Commits

```
type(scope): description
```

Types: `feat|fix|docs|refactor|test|chore`. Scope is area (`backend`, `frontend`, `infra`, `docs`,
`gsd`). Verify before commit; never commit secrets (`.env` stays untracked).

## Quick reference

```
Before coding  → SPEC FINALIZED
Before file read → search first, then targeted read
After each task → verify + commit + update .gsd/STATE.md
After 3 failures → state dump + fresh session
Before "Done" → empirical proof captured
Same VPS → check ports/names/network before publishing anything
```
