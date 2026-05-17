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

**Landing Page** → Cloudflare Pages (manual `wrangler pages deploy` — Pages is not Git-connected here; see `CLAUDE.md` for the full ship ritual)

**Admin Dashboard** → Cloudflare Workers + KV (see `platform/README.md`)

## KV Namespaces

| Namespace | ID | Purpose |
|-----------|------|---------|
| surplus-secure-content | `be436a122b274134b34c4f9a5a14f489` | Landing page editable content |
| surplus-secure-data | `bfdb05c089624a79b62251f6c8ad5c1e` | County operational data |

## Cost

$0/month — Cloudflare free tier covers everything.
