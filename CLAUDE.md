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

- `index.html` — entire site, inline CSS + JS.
- `hero-video.mp4` — 960×540 H.264 + AAC stereo, 82s, ~9.4 MB. Click-to-play (no autoplay).
- `hero-poster.webp` — 1920×1103 16:9, ~60 KB.
- `workers/ss-form/` — Cloudflare Worker (form relay), `account_id` pinned to Kelli's.
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
   wrangler pages deploy . --project-name surplus-secure --branch main --commit-dirty=true
   ```
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
- **Cloudflare account drift** — `wrangler.toml` `account_id` is repo-bound to Kelli's account in every Worker dir. Don't change it.
- **Pages custom domain CNAMEs** — must point to `surplus-secure-2bp.pages.dev` (the account-specific URL), NOT `surplus-secure.pages.dev` (the shared subdomain name). Pointing at the shared name causes routing ambiguity if any other CF account ever creates a project of the same name.
