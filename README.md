# Liberty CAD

A dispatch / server-management dashboard for ER:LC private servers, built on the
[official ER:LC API](https://apidocs.erlc.gg/). Next.js (App Router) + TypeScript.

## What's in v1

- **Dashboard** – players, queue, on-duty units, active calls, join/kill/command logs, mod calls, staff, command console
- **Live map** – players and emergency calls plotted on the official map
  - **Automatic seasonal map** (Dec–Feb winter, otherwise fall) using the official images
  - **Per-user map settings** (Settings page): force fall/winter or follow the season, postals on/off, team colours, callsign labels, marker size
- **Dispatch** – active emergency calls and units on duty
- Password gate (`DASHBOARD_PASSWORD`) so only you can see data and run commands

## Setup

```bash
npm install
cp .env.example .env.local   # fill in ERLC_SERVER_KEY and DASHBOARD_PASSWORD
npm run dev
```

Get your server key in-game: private server **Settings → search "API key"** (requires the ER:LC API pack).

## Deploy

Push to GitHub, import the repo in Vercel, and add the env vars from `.env.example`
in the Vercel project settings. **Never commit your server key** – the ER:LC acceptable
use policy forbids exposing keys in public repos or client-side code. Keys here are only
read in server code (`lib/erlc.ts`, `app/api/*`).

## Map calibration

API coordinates have `(0,0)` at the map centre, `+X` right, `+Z` down, and the official
images are 5355×5355 px. The pixels-per-unit scale is not documented, so it is set by
`NEXT_PUBLIC_MAP_PX_PER_UNIT` (default `1`). If markers sit in the wrong place, compare a
known player position to the map and adjust.

## Rate limits

`lib/erlc.ts` caches responses for 4s, de-duplicates in-flight requests, and obeys
`Retry-After` on 429s, so any number of viewers share one upstream poll.

## Not built yet (next steps)

- Discord login + roles (admin / staff / dispatcher), per-server tenancy
- Database (Supabase/Neon): civilians, vehicles, warrants, citations, arrests, shifts, LOAs, applications, mod logs
- Settings stored per account instead of per browser (currently `localStorage`)
- Multi-server mode requires registering a **public application** with PRC (`Authorization` header)
- Event webhook endpoint (Ed25519 verification) for emergency calls and `;` commands
