# Surplus Secure

Michigan tax foreclosure surplus fund recovery — digital asset system for attorney Kelli Meeks.

Built and maintained by [Ebony Iris Media LLC](https://ebonyirismedia.com).

## Repository Structure

```
├── index.html                  # Production landing page (Cloudflare Pages)
├── platform/                   # Admin dashboard + KV API (Cloudflare Worker)
│   ├── src/worker.js           # Worker source code
│   ├── wrangler.toml           # Cloudflare config
│   └── .github/workflows/     # CI/CD deployment
├── brand-assets/               # Logos, business cards, social templates, email signature
├── docs/deliverables/          # Client-facing guides (GBP, engagement automation, handoff)
├── county-database/            # 83-county Michigan operational database
│   ├── data/                   # County records, FOIA templates, pipeline stages
│   └── docs/                   # Business playbook, customer journey, Kelli's guide
└── admin-preview/              # Standalone admin dashboard demo (no API needed)
```

## Deployment

**Landing Page** → Cloudflare Pages (auto-deploys from this repo on push to `main`)

**Admin Dashboard** → Cloudflare Workers + KV (see `platform/README.md`)

## KV Namespaces

| Namespace | ID | Purpose |
|-----------|------|---------|
| surplus-secure-content | `0df9acd7ac6a4ccf97967b00af48605c` | Landing page editable content |
| surplus-secure-data | `4c0e187f29874f7db7410174e264041a` | County operational data |

## Cost

$0/month — Cloudflare free tier covers everything.
