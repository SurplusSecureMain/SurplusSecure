# SurplusSecure — operational context

Marketing site for **Surplus Secure**, a Michigan tax-foreclosure surplus-funds recovery practice run by attorney **Kelli Meeks**. Single-page static site (`index.html`) + a Cloudflare Worker that relays the contact form to her Gmail.

## This repo's role

`SurplusSecureMain/SurplusSecure` (this repo) is the **production canonical source**. As of 2026-05-16, `surplussecure.com` is served end-to-end from Kelli's own Cloudflare account; the previous EIM-owned setup is decommissioned.

- Live production: **https://surplussecure.com** (also `https://www.surplussecure.com`).
- Direct Pages URL: **https://surplus-secure-2bp.pages.dev** (Kelli's Pages project; **manual** `wrangler pages deploy`, not Git-connected).
- Cloudflare account: **`6a09797d8994f0915708aec9f6354645`** (Kelli's, created 2026-05-07).
- Worker: **`ss-form.kelli-6a0.workers.dev`** (deployed under same Kelli account).
- Hyphenated `surplus-secure.com` 301-redirects (path + query preserved) to canonical via a Single Redirect rule on its own zone in the same account.

## Local clone

`~/SurplusSecure-kelli/`

The legacy clone at `~/SurplusSecure-work/` is deprecated — kept for historical reference and short-window rollback only; nothing shipped from there affects production anymore.

## Stack

- **`public/` is the ONLY directory that gets deployed.** `wrangler pages deploy public/` uploads exactly what's in that folder — nothing else in the repo (CLAUDE.md, docs/, platform/, county-database/, workers/, brand-assets/, tools/, admin-preview/) is ever public. Before 2026-07-09 the ship ritual deployed the repo root (`wrangler pages deploy .`), which silently served all of those — including the admin dashboard's auth source and this file — live at surplussecure.com. If you ever add a new top-level file/folder that should be public, it has to be added inside `public/`, not the repo root.
- `public/index.html` — entire site, inline CSS + JS.
- `public/hero-video.mp4` — H.264 + AAC stereo, 82s, **16.1 MB**, faststart (`moov` before `mdat`). Click-to-play (no autoplay).
- `public/hero-poster.webp` — 1080×1080 square, ~64 KB.
- `public/robots.txt`, `public/llms.txt`, `public/sitemap.xml`, `public/_headers` — AEO Site Protocol + security headers.
- `public/og-image.png` — 1200×630 social share card. Regenerate from `tools/` if the hero headline changes.
- `public/favicon-32.png`, `public/apple-touch-icon.png`, `public/icon.svg` — copied from `brand-assets/`. The SVG must stay free of the `@import` of Google Fonts that `brand-assets/surplus-secure-icon.svg` still carries.
- `public/images/`, `public/fonts/` — self-hosted images and fonts (no third-party font CDN). Fonts are DM Serif Display (400 + italic) and Source Sans 3 (variable 300–700, roman + italic), latin + latin-ext subsets, served with `font-display: swap`.
- `workers/ss-form/` — Cloudflare Worker (form relay), `account_id` pinned to Kelli's. Deployed separately via `wrangler deploy` from its own directory — unaffected by the `public/` restructure.
- `platform/` — admin dashboard + KV API Worker (deployed to Kelli account as `surplus-secure-platform`; not bound to a public hostname yet).
- `county-database/` — 83-county Michigan data Worker (deployed to Kelli account as `surplus-secure`; not bound to a public hostname yet).

## Contact form delivery flow

```
Browser form (index.html)
  → POST https://ss-form.kelli-6a0.workers.dev  (Cloudflare Worker)
  → POST https://script.google.com/macros/s/.../exec  (Google Apps Script web app)
  → GmailApp.sendEmail to kelli@surplussecure.com
```

Worker secrets:
- `APPS_SCRIPT_URL` — full `/exec` URL of deployed Apps Script.
- `APPS_SCRIPT_SECRET` — HMAC-style shared secret matched by the script.

The Apps Script (`SS Form Mailer`) lives in Kelli's Google Workspace and runs as her account, so emails appear from `kelli@surplussecure.com`. The `email` field on the form lands in the message's `Reply-To` header — recipient is always Kelli's inbox.

The Worker handles the Apps Script 302 manually — `script.google.com/.../exec` redirects to `script.googleusercontent.com/macros/echo` and only accepts GET on the second hop. Don't add `--post301`-equivalent flags or set `redirect: 'follow'` with body re-send.

## Ship ritual

1. Branch off `main`: `git checkout -b descriptive-name`.
2. Edit. Commit. Push.
3. `gh pr create --base main --head <branch> --title ... --body ...`
4. `gh pr merge <num> --squash --delete-branch --repo SurplusSecureMain/SurplusSecure`
5. **Pages is NOT Git-connected.** Manually redeploy:
   ```
   export CLOUDFLARE_API_TOKEN=<...>
   export CLOUDFLARE_ACCOUNT_ID=6a09797d8994f0915708aec9f6354645
   wrangler pages deploy public/ --project-name surplus-secure --branch main --commit-dirty=true
   ```
   **Always deploy `public/`, never `.`** — deploying repo root ships CLAUDE.md, docs/, platform/, workers/, etc. as public files (this happened in production until 2026-07-09).
6. Verify: `curl -s https://surplussecure.com | grep <change>`.

**Never push directly to main.** Always go through a PR.

## Worker (re)deploy

```
cd workers/ss-form
wrangler deploy
```

Set/rotate secrets:
```
echo '<value>' | wrangler secret put APPS_SCRIPT_URL
echo '<value>' | wrangler secret put APPS_SCRIPT_SECRET
```

Tail logs: `wrangler tail`.

## Verify production health

```
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://surplussecure.com
curl -s -X POST https://ss-form.kelli-6a0.workers.dev \
  -F "firstName=HealthCheck" -F "phone=" -F "email=ramayan@ebonyiris.com" -F "website="
# Expect HTTP 200 + {"success":true}; an email should land in kelli@surplussecure.com.
```

## Things not to break

- **Click-to-play hero video, with audio.** Don't add `autoplay`, don't `muted`. The current script creates `<video controls autoplay playsinline>` only on user click — autoplay-with-audio works because of the user gesture.
- **No black bars / no fake background padding** on the hero video.
- **`tel:` and `sms:` CTAs** are split (`Call (734) 215-5540` vs `Text (734) 215-5540`) — don't merge them back into a single "Call or Text" tel: link; that confused users.
- **Honeypot field `website`** — silently succeed if filled. Don't add visible validation.
- **`content-visibility: auto` on page sections.** Do not reintroduce it. Combined with `scroll-behavior: smooth` it broke every in-page anchor below the fold — the browser computed the scroll target from the `contain-intrinsic-size` estimate, then real content rendered mid-animation and moved the destination. "Why Us" landed 211px off and "FAQ" scrolled to the bottom of the page.
- **No third-party runtime requests.** Fonts are self-hosted; there is no analytics, no pixel, no CDN. A page load should make zero requests off `surplussecure.com`. The `_headers` CSP enforces this — adding an external asset means editing the CSP too.
- **Gold as text on light backgrounds.** `--gold` (#C8A456) is only ~2.2:1 on white/cream. Use `--gold-text` for body-size text and `--gold-strong` for large text and UI glyphs; both flip automatically in dark mode. `--gold` itself is for fills, borders, and text on the dark navy sections.
- **Self-serving review schema.** `aggregateRating` and on-site `Review` nodes were removed — Google's rich-result policy disallows reviews a business hosts about itself, and they risk a manual action. The visible testimonials stay; don't re-add the markup.
- **Cloudflare account drift** — `wrangler.toml` `account_id` is repo-bound to Kelli's account in every Worker dir. Don't change it.
- **Pages custom domain CNAMEs** — must point to `surplus-secure-2bp.pages.dev` (the account-specific URL), NOT `surplus-secure.pages.dev` (the shared subdomain name). Pointing at the shared name causes routing ambiguity if any other CF account ever creates a project of the same name.
