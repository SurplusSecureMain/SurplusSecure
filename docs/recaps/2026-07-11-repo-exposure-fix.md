# Deploy Recap — Repo Exposure Fix + Dark-Mode Headings

**Date shipped:** July 11, 2026
**PR:** [#21](https://github.com/SurplusSecureMain/SurplusSecure/pull/21) (squash-merged to `main` as `b8a4dff`)
**Deployed:** `wrangler pages deploy public/` → production deployments `0387dbb2` and `ff00f995` on project `surplus-secure`

---

## What was wrong

Every prior Pages deploy shipped the **entire repository root** as live static files. That meant the following were publicly downloadable at surplussecure.com until this fix went live:

- `CLAUDE.md` — internal operational documentation (architecture, deploy ritual, account IDs)
- `README.md` — internal project readme
- `docs/` — internal documentation and deliverables
- `platform/` — **admin dashboard source, including its auth code**
- `workers/` — Cloudflare Worker source (contact-form relay)
- `county-database/` — county data tooling
- `brand-assets/` — raw brand files

This was the most severe finding of the AEO standards audit (branch `aeo-standards-audit`).

## What shipped

### 1. Deploy scope restructure (the exposure fix)

- Moved the public site into a dedicated `public/` folder: `index.html`, `hero-video.mp4`, `hero-poster.webp`.
- The deploy command is now `wrangler pages deploy public/` — **never** repo root. The new deployment manifest contains only those three files; every other repo path now falls back to the homepage instead of serving source files.
- Guardrails updated so this can't silently regress:
  - `CLAUDE.md` deploy instructions now specify `public/` and explain why.
  - The `ship-surplus` skill now hard-codes the `public/` scope, forbids adding back-office folders to `public/`, and documents this incident as the reason.

### 2. Dark-mode heading fix

Headings that were invisible in dark mode (dark text on dark background) are now legible: hero `h1`, process section title, CTA `h2`, and footer logo text.

## Verification (on the live canonical domain)

| Check | Result |
|---|---|
| `/platform/` and subpaths (admin source, auth code) | ✅ No longer served — homepage fallback |
| `/workers/`, `/county-database/`, `/docs/`, `/brand-assets/` | ✅ No longer served — homepage fallback |
| Homepage, hero video (byte-range), contact CTAs | ✅ Intact |
| Dark-mode heading styles | ✅ Live (`prefers-color-scheme: dark` rules present) |
| `/CLAUDE.md`, `/README.md` | ⚠️ Deployment is correct (cache-busted requests return the homepage fallback), but a Cloudflare-side cache is still serving stale copies of these two URLs |

## Outstanding items

1. **Cache purge (only remaining step of this fix).** The two stale markdown URLs are held in a Cloudflare cache with a 7-day TTL that redeploys do not evict. Clearing them requires a zone-level **Purge Everything** (Cloudflare dash → Kelli's account → surplussecure.com → Caching → Configuration). If not purged, they expire on their own by **July 18, 2026**. The sensitive admin source is already confirmed gone either way.
2. **Rest of the AEO standards audit** (separate PRs to follow): inventory `index.html` against the aeo-site-kit properties, add `robots.txt` / `llms.txt` / `sitemap.xml` / `_headers`, self-host fonts (remove the Google Fonts CDN dependency), accessibility fixes (contrast, alt text, ARIA, headings), and the email/address contact-classification decisions.

## Operational notes for future deploys

- **Pages is not Git-connected** — merging a PR does not deploy. Always run the `wrangler pages deploy public/` step afterward.
- The Keychain API token (`cf-kelli-migration`) had expired; the deploy worked via the local wrangler OAuth session (ramayan@ebonyiris.com), which has member access to Kelli's account. That OAuth session **cannot** purge zone cache — that needs the dash or a token with `Zone · Cache Purge` scope.
- Files removed from a deployment can keep serving stale on the custom domain for up to 7 days. To tell "wrong deployment" apart from "stale cache," request the URL with a cache-busting query parameter (e.g. `?cb=1`) — if that returns fresh content, the deployment is correct and only the cache is stale.
