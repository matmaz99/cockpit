# Cockpit

One page to follow the four regulation products side by side: Portail DPE, Parksun, Cadastre tertiaire, DPE immeuble.

- **Read-only.** The cockpit never writes to a product's store, database or repo. Blob access is limited to `list()` and `get()`; Supabase is read through the existing `admin_*` SQL functions.
- **Single operator.** Login with `ADMIN_USER` / `ADMIN_PASSWORD`; an HMAC-signed cookie (`ck_admin`, 7 days) is checked in `src/proxy.ts` on every route. Copied from the Parksun admin.
- **Design system.** `src/app/globals.css` and `src/components/ds/*` are copies of Parksun's; cockpit-only classes live in `src/app/cockpit.css` (`ck-*`).
- **Hosting.** Vercel project `cockpit`, team matmaz99s-projects, default `.vercel.app` address for now.
- **Secrets.** Names in `.env.example`; values only in the Vercel project settings.

## Layout

| Path | Role |
|---|---|
| `src/lib/model.ts` | Normalised types every adapter returns |
| `src/lib/products.ts` | The four products: hosts, Vercel ids, repos, Resend domains, data store, env var names |
| `src/lib/auth.ts`, `src/proxy.ts`, `src/app/login`, `src/app/api/{login,logout}` | Operator login |
| `src/app/page.tsx` | Portfolio view |
| `src/components/Charts.tsx` | Daily bars, funnel, count table (from Parksun) |

## Week 1

| Day | Build | Status |
|---|---|---|
| 1 | Skeleton, design system, login, product registry, portfolio shell | done |
| 2 | Blob adapter (Parksun, Cadastre tertiaire, DPE immeuble), normalised funnel, product page | done |
| 3 | Portail DPE adapter on the Supabase admin functions, leads pages | done |
| 4 | Hourly snapshot job and cockpit Blob store, ops page (deploys, errors, e-mail, data freshness) | |
| 5 | Governance from the repos' docs, health signal, week-over-week | |
