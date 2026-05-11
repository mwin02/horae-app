# Horae — Landing site

Marketing site for [usehorae.com](https://usehorae.com). Next.js 15 (App Router) +
Tailwind v4, deployed on Vercel.

This sits alongside the React Native app in the same repo. It does **not**
share code with the app — the only crossover is `docs/privacy-policy.md`,
which is copied into `landing/content/` automatically on `dev` / `build`
so we have one canonical privacy policy.

## Local dev

```bash
cd landing
npm install
npm run dev
# → http://localhost:3000
```

`npm run dev` automatically runs `sync:docs` first, which copies the
privacy policy from `../docs/`.

Other useful scripts:

| script | what it does |
| --- | --- |
| `npm run build` | Production build (runs `sync:docs` first) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run sync:docs` | Manually re-copy `../docs/privacy-policy.md` |

## Project structure

```
landing/
  app/
    layout.tsx             # fonts (Manrope + Plus Jakarta), metadata
    page.tsx               # /
    privacy/page.tsx       # renders content/privacy-policy.md via react-markdown
    support/page.tsx       # mailto card + FAQ
    opengraph-image.tsx    # 1200×630 OG image, generated at request time
    robots.ts, sitemap.ts  # SEO
    globals.css            # Tailwind v4 @theme tokens + article-body styles
  components/
    Hero.tsx, Manifesto.tsx, SectionFeatures.tsx,
    PrivacyBand.tsx, FinalCTA.tsx, Header.tsx, Footer.tsx
    Logo.tsx, AppStoreBadge.tsx, LiveTimer.tsx
    hero/         # tilted phone visual (AppHeroVisual + AppArcRing + SuggestionCard)
    features/     # the three feature-card visuals (TimerVisual, GoalVisual, LockVisual)
    article/      # ArticleShell — used by /privacy and /support
  lib/content.ts           # reads content/privacy-policy.md
  public/icon.png          # from ../assets/images/icon.png
```

## Outstanding launch TODOs

Search the codebase for `TODO(launch)` to find the one remaining item:

1. **App Store URL** — `AppStoreBadge.tsx` links to `#`. Swap in the real
   App Store URL once Apple approves the app.

The following items were resolved during build-out and are kept here as
a record of what's already in place:

- **App Store badge artwork** — Apple's official SVG is in
  `public/app-store-badge.svg` and rendered by `AppStoreBadge.tsx`.
- **Support email** — `support@usehorae.com` is live (Cloudflare Email
  Routing on `usehorae.com`). Referenced in `Footer.tsx` and
  `app/support/page.tsx`.
- **App screenshots** — three real iOS screenshots live in `public/`:
  `hero-screenshot.png`, `feature-timer.jpg`, `feature-goals.jpg`. If
  the in-app UI changes meaningfully before launch, retake and replace
  these.

## Deploy (Vercel + Cloudflare)

### Vercel

1. Import the GitHub repo into Vercel.
2. **Root Directory:** `landing` (Vercel detects Next.js automatically).
3. Build command, install command, output dir: leave defaults.
4. Environment variables: none required.

The `prebuild` script runs `sync:docs`, which only depends on
`../docs/privacy-policy.md` already being in the checkout. Vercel clones
the whole repo (not just the root dir), so the file is present.

### DNS (Cloudflare)

Domain is registered through Cloudflare.

1. In Vercel, add `usehorae.com` and `www.usehorae.com` as domains for
   the project.
2. In Cloudflare DNS, follow Vercel's instructions:
   - `A` record at apex pointing to `76.76.21.21` (Vercel's anycast IP).
   - `CNAME www → cname.vercel-dns.com`.
3. **Set both records to "DNS only" (grey cloud), not "Proxied"** — Vercel
   handles TLS itself and proxying through Cloudflare on top breaks the
   automatic cert issuance.
4. In Vercel, set the apex as the **primary domain** and configure `www`
   to redirect to it.

### Smoke-test the deploy

```bash
curl -I https://usehorae.com/
curl -I https://usehorae.com/privacy
curl -I https://usehorae.com/support
curl -I https://www.usehorae.com/      # should be 308 → apex
```

All four return 200 (or 308 for the www redirect). View source on the
homepage and confirm no requests to `fonts.googleapis.com` (fonts are
self-hosted via `next/font`).
