# IrisFlow

**The best-loved features of Trello, Asana, ClickUp, and Monday.com — open source, self-hosted on Cloudflare's free tier, $0/month.**

IrisFlow is a project management tool for small teams (1–15 people) built on the EIM stack: **GitHub** for source, **Cloudflare** for hosting and data, and static-first, security-hardened, AI-findable pages. There is no database server, no Node runtime in production, and no build step — one Worker, one KV namespace, one HTML file.

## Feature matrix — what came from where

| Inspired by | Feature in IrisFlow |
|---|---|
| **Trello** | Drag-and-drop kanban board, cards with tags, checklists with progress bars, due-date chips, per-column quick add, add/rename/recolor columns |
| **Asana** | My Tasks across all projects (Overdue / Today / This week / Later), grouped list view, one-click complete circles, assignees, comments, activity log |
| **ClickUp** | Four views per project (Board / List / Table / Calendar), priority flags (Urgent / High / Normal / Low), time estimates, recurring tasks, per-project automation toggles |
| **Monday.com** | Customizable color-coded status pills, inline-editable table view, dashboard with per-project donut, workload bars, and progress tracks |

Plus things none of them give you for free:

- **Offline-first** — every change lands in `localStorage` instantly and syncs to KV on a debounce; going offline never loses work.
- **Conflict-safe** — saves carry a revision number; the Worker rejects stale writes (HTTP 409) and the client reloads the newer copy instead of clobbering it.
- **No lock-in** — the entire workspace is one JSON document in *your* Cloudflare account. Export/import from the workspace menu.
- **Zero third-party requests** — no font CDNs, no analytics, no trackers, no external scripts. System font stack only.

## Architecture

```
Browser (src/app.html — single-file SPA, vanilla JS, no dependencies)
  ⇅ fetch /api/data  (JSON doc + revision number)
Cloudflare Worker (src/worker.js — auth, optimistic concurrency, security headers)
  ⇅
Cloudflare KV (one key: the workspace document)
```

- **Auth:** a shared passphrase (`APP_PASSWORD` Worker secret). Sessions are HMAC-SHA256-signed expiry stamps in an `HttpOnly; Secure; SameSite=Strict` cookie — the cookie never contains the passphrase. If no secret is set, the app runs in open demo mode.
- **Security:** strict CSP, HSTS, X-Frame-Options DENY, nosniff, and a deny-all `robots.txt` on the app itself (the app is a private surface; the marketing page in `site/` is the public, AEO-optimized one).
- **Members** are lightweight profiles behind the shared passphrase — pick "I am" in the sidebar for assignments, comments, and My Tasks. For per-user credentials, put [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/) in front of the Worker (also free for small teams).

## Deploy (about five minutes)

```bash
cd irisflow
npx wrangler kv namespace create IRISFLOW_DATA    # copy the id into wrangler.toml
# set account_id in wrangler.toml (or export CLOUDFLARE_ACCOUNT_ID)
echo 'your-strong-passphrase' | npx wrangler secret put APP_PASSWORD
npx wrangler deploy
```

Your instance is live at `https://irisflow.<your-subdomain>.workers.dev`. First load seeds a demo workspace so you can feel the tool before wiring in real work.

### Marketing page (optional)

`site/` is a standalone public landing page built to the AEO checklist — JSON-LD (`SoftwareApplication` + `FAQPage`), `llms.txt`, AI-crawler-friendly `robots.txt`, sitemap, security `_headers`, semantic HTML, system fonts. Deploy it separately:

```bash
npx wrangler pages deploy site/ --project-name irisflow
```

Update the placeholder domain (`irisflow.pages.dev`) in `site/index.html`, `site/robots.txt`, and `site/sitemap.xml` if you use a custom domain.

## Cost

$0/month. Cloudflare's free tier allows 100,000 Worker requests/day and 1,000 KV writes/day. IrisFlow batches all changes into one debounced write, so even a busy team stays far below the limits.

## Data model

One JSON document: workspace → members + projects → statuses, automations, tasks (title, description, status, priority, assignees, due date, repeat rule, tags, checklist, comments, activity, estimate). Read `src/app.html` — the `seed()` function is the schema by example.

## Limits (by design)

- Single workspace per deployment; deploy the Worker twice for two workspaces.
- Shared-passphrase trust model — everyone with the passphrase can edit everything.
- Last-writer-wins at document granularity (with conflict detection); it's a small-team tool, not Jira.

## License

MIT — see [LICENSE](LICENSE).
