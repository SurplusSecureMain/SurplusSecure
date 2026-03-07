# Surplus Secure Platform

Admin dashboard + KV-backed content API for Surplus Secure.  
Cloudflare Workers + KV. No database. No subscriptions beyond Cloudflare free tier.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Cloudflare Worker              │
│                                             │
│  /admin    → Admin Dashboard (auth-gated)   │
│  /api/*    → KV Read/Write API              │
│  /login    → Auth handler                   │
│                                             │
│  ┌─────────┐         ┌─────────┐           │
│  │ CONTENT │ KV      │  DATA   │ KV        │
│  │ site    │         │ counties│           │
│  │ content │         │ pipeline│           │
│  └─────────┘         └─────────┘           │
└─────────────────────────────────────────────┘
```

## Setup (One-Time)

### 1. Create KV Namespaces

```bash
npx wrangler kv:namespace create CONTENT
npx wrangler kv:namespace create DATA
```

Copy the IDs into `wrangler.toml`.

### 2. Set the Admin Password

```bash
npx wrangler secret put APP_PASSWORD
```

Enter a strong password. This protects the `/admin` dashboard.

### 3. Deploy

```bash
npx wrangler deploy
```

### 4. Seed Initial Data

Visit `https://your-worker.workers.dev/admin`, log in, and the county data auto-seeds on first load. Or manually:

```bash
curl -X POST https://your-worker.workers.dev/api/seed
```

## GitHub Actions (CI/CD)

Add these repository secrets:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `APP_PASSWORD` | Admin dashboard password |
| `CF_SUBDOMAIN` | Your workers.dev subdomain |

Every push to `main` auto-deploys.

## Admin Dashboard

**Site Editor** — Edit landing page content (headlines, CTAs, testimonials, contact info). Changes save to KV and are available instantly via the `/api/content/public` endpoint.

**County Database** — 83 Michigan counties with editable operational fields: priority tier, FOIA status, FOIA method, pipeline stage, and notes. Search, filter by region/tier/FOIA status.

**Pipeline** — Visual overview of counties by recovery stage.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/content/public` | No | Public content (CORS-enabled, for landing page) |
| GET | `/api/content` | Yes | All site content |
| PUT | `/api/content` | Yes | Update site content |
| GET | `/api/counties` | Yes | All county data |
| PUT | `/api/counties` | Yes | Update all county data |
| PUT | `/api/county` | Yes | Update single county |
| POST | `/api/seed` | Yes | Reset to default data |

## Landing Page Integration

Add this script to the landing page HTML (before `</body>`) to pull editable content from KV:

```html
<script>
(async () => {
  try {
    const res = await fetch('https://YOUR-WORKER.workers.dev/api/content/public');
    const c = await res.json();
    document.querySelectorAll('[data-editable]').forEach(el => {
      const key = el.dataset.editable;
      if (c[key]) el.textContent = c[key];
    });
  } catch(e) { /* defaults in HTML are fine */ }
})();
</script>
```

Then add `data-editable` attributes to the landing page:

```html
<h2 data-editable="hero_headline">We're on your side.</h2>
<p data-editable="hero_description">After a tax foreclosure sale...</p>
```

## Custom Domain

To put the admin on `admin.surplus-secure.com`:

1. In Cloudflare dashboard → Workers → surplus-secure-platform → Triggers
2. Add Custom Domain: `admin.surplus-secure.com`
3. DNS automatically configured if domain is on Cloudflare

## Cost

$0/month on Cloudflare free tier:
- Workers: 100,000 requests/day
- KV: 100,000 reads/day, 1,000 writes/day
- More than sufficient for admin usage
