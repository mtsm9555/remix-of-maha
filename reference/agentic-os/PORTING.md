# agentic-os-personal — porting status

Source: https://github.com/vivekmishraishere/agentic-os-personal

This folder is a **read-only reference copy** of the original Node.js/Express
app. It is NOT wired into the Lovable build (it lives outside `src/`, is not
imported anywhere, and its `package.json` is ignored). Use it as a spec while
porting features to this app.

## Why not run it as-is

The original app is an Express server with SQLite (`node-sqlite3-wasm`),
`p-queue`, long-lived process, Google OAuth callbacks, and a Zernio scheduler.
This Lovable project is TanStack Start on Cloudflare Workers — no Express, no
persistent process, no local SQLite. So we port features one-by-one into:

- **TanStack server functions** (`src/lib/**/*.functions.ts`) for app-internal RPC
- **Server routes** under `src/routes/api/public/*` for webhooks (Zernio callbacks)
- **Supabase** (Lovable Cloud) for persistence, replacing SQLite
- **Lovable AI Gateway** for AI calls, replacing OpenRouter

## Ported so far (option 1)

| Original                                        | Ported to                                  | Notes                          |
| ----------------------------------------------- | ------------------------------------------ | ------------------------------ |
| `server/collectors/rss.js` (`collectRss`)       | `src/lib/agentic/rss.functions.ts`         | Uses `rss-parser`, stateless   |
| `server/ai/rankArticles.js` (`rankPendingArticles`) | `src/lib/agentic/rank.functions.ts`     | Uses Lovable AI, stateless     |
| `server/prompts/rank.md`                        | Inlined in `rank.functions.ts`             |                                |

Both accept input, return output — no DB writes yet. Wire a Supabase
`articles` table (columns: id, title, url, summary, topic_tags, published_at,
priority_score, reason, suggested_angle) when you want persistence.

## Not yet ported

- `server/collectors/firecrawl.js` — needs `FIRECRAWL_API_KEY` secret
- `server/zernio.js` + `server/webhooks/zernio.js` — needs `ZERNIO_API_KEY`,
  webhook route under `src/routes/api/public/zernio.ts` with HMAC verify
- `server/google/oauth.js`, `server/google/gmail.js` — use Lovable's Google
  connector instead of hand-rolled OAuth
- `server/ai/contentAgent.js`, `expenseExtractor.js`, `assistant.js`
- `server/sqlite.js`, `db.js` — replace with Supabase migrations
- `server/jobRunner.js`, `autoSync.js`, `sourceScheduler.js` — replace with
  pg_cron hitting `/api/public/*` endpoints (stable URL:
  `project--{project-id}.lovable.app`)

## Option 3 — keep it standalone on Hostinger

If you'd rather not port everything, deploy the reference app on Hostinger
(see `HOSTINGER.md`) and call it from this Lovable app over HTTP. Add its
public URL as a secret (e.g. `AGENTIC_OS_BASE_URL`) and wrap calls in a
TanStack server fn that `fetch()`s it. The Lovable frontend never talks to
Hostinger directly — always via a server fn — so the base URL and any shared
secret stay server-side.
