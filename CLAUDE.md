# SurplusSecure — operational context

Marketing site for **Surplus Secure**, a Michigan tax-foreclosure surplus-funds recovery practice run by attorney **Kelli Meeks**. Single-page static site (`index.html`) + a Cloudflare Worker that relays the contact form to her Gmail.

## This repo's role

`SurplusSecureMain/SurplusSecure` (this repo) is the **canonical-going-forward source**, set up under Kelli's own Cloudflare account during a copy-first migration:

- Staging URL: **https://surplus-secure-2bp.pages.dev** (Cloudflare Pages, **manual** `wrangler pages deploy`; not Git-connected yet).
- Cloudflare account: **`6a09797d8994f0915708aec9f6354645`** (Kelli's, created 2026-05-07).
- Worker: **`ss-form.kelli-6a0.workers.dev`** (deployed under same Kelli account).

Production at `surplussecure.com` is still served from the EIM-owned account/repo (`EbonyIrisMedia/SurplusSecure`). After verification on the staging URL, the `surplussecure.com` zone moves to Kelli's account and Pages adopts the custom domain.

**Until the domain shift completes, every change shipped here must also be shipped to the legacy repo** (see "Sister repo" below).

## Local clone

`~/SurplusSecure-kelli/`

The other clone is at `~/SurplusSecure-work/` (legacy production repo).

## Stack

- `index.html` — entire site, inline CSS + JS.
- `hero-video.mp4` — 960×540 H.264 + AAC stereo, 82s, ~9.4 MB. Click-to-play (no autoplay).
- `hero-poster.webp` — 1920×1103 16:9, ~60 KB.
- `workers/ss-form/` — Cloudflare Worker (form relay).
- `wrangler.toml` `account_id = "6a09797d8994f0915708aec9f6354645"`.

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

The Apps Script (`SS Form Mailer`) lives in Kelli's Google Workspace and runs as her account, so emails appear from `kelli@surplussecure.com`.

The Worker handles the Apps Script 302 manually — `script.google.com/.../exec` redirects to `script.googleusercontent.com/macros/echo` and only accepts GET on the second hop. Don't add `--post301`-equivalent flags or set `redirect: 'follow'` with body re-send.

## Ship ritual (single-repo)

1. Branch off `main`: `git checkout -b descriptive-name`.
2. Edit. Commit. Push.
3. `gh pr create --base main --head <branch> --title ... --body ...`
4. `gh pr merge <num> --squash --delete-branch --repo SurplusSecureMain/SurplusSecure`
5. **Pages is NOT Git-connected here.** Manually redeploy:
   ```
   export CLOUDFLARE_API_TOKEN=<...>
   export CLOUDFLARE_ACCOUNT_ID=6a09797d8994f0915708aec9f6354645
   wrangler pages deploy . --project-name surplus-secure --branch main --commit-dirty=true
   ```
6. Verify: `curl -s https://surplus-secure-2bp.pages.dev | grep <change>`.

**Never push directly to main.** Always go through a PR.

## Sister repo: dual-repo ship

Until the domain shift is done, every site change ships to **both** repos:

1. Apply the change here.
2. Mirror to `~/SurplusSecure-work/`. **Watch for `WORKER_URL` drift in `index.html`:** this repo uses `https://ss-form.kelli-6a0.workers.dev`; the sister uses `https://ss-form.ebony-iris.workers.dev`. After `cp index.html`, restore the sister's value with sed.
3. Branch + commit + push + PR + merge in each repo.
4. The legacy repo's Pages auto-deploys from `main` (no manual command). This repo's Pages requires `wrangler pages deploy` (above).
5. Verify both: `curl -s https://surplus-secure-2bp.pages.dev` and `curl -s https://surplussecure.com`.

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

## Verify staging health

```
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://surplus-secure-2bp.pages.dev
curl -s -X POST https://ss-form.kelli-6a0.workers.dev \
  -F "firstName=HealthCheck" -F "phone=" -F "email=ramayan@ebonyiris.com" -F "website="
# Expect HTTP 200 + {"success":true}; an email should land in Kelli's inbox.
```

## Things not to break

- **Click-to-play hero video, with audio.** Don't add `autoplay`, don't `muted`. The current script creates `<video controls autoplay playsinline>` only on user click — autoplay-with-audio works because of the user gesture.
- **No black bars / no fake background padding** on the hero video.
- **`tel:` and `sms:` CTAs** are split (`Call (734) 215-5540` vs `Text (734) 215-5540`) — don't merge them back into a single "Call or Text" tel: link; that confused users.
- **Honeypot field `website`** — silently succeed if filled. Don't add visible validation.
- **Cloudflare account drift** — never deploy this repo's Worker into the legacy account or vice versa. `wrangler.toml` `account_id` is repo-bound.

## Surface area I shouldn't touch

- `admin-preview/`, `county-database/`, `platform/`, `tools/` — not part of the live site. Out of scope unless the user explicitly asks.
