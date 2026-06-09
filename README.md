# BugID — identificator de insecte/păianjeni

PWA care identifică insecte/păianjeni dintr-o poză: verdict de siguranță, info pe
categorii, poze de referință (iNaturalist) și jurnal local. Frontend pe GitHub Pages,
proxy pe Cloudflare Worker (`bugid-proxy`) care ține cheia Gemini.

## Dezvoltare
- `npm install`
- `npm test` — rulează testele (Vitest)
- `npx wrangler dev --cwd worker` — Worker local (necesită `worker/.dev.vars` cu GEMINI_API_KEY)
- Servește rădăcina static (`npx http-server . -p 8080`)

## Deploy
- Worker: `npx wrangler deploy --cwd worker` (setează secret cu `wrangler secret put GEMINI_API_KEY`)
- Frontend: GitHub Pages din branch `main`. Setează `WORKER_URL` în `api.js` la URL-ul Worker-ului
  și `ALLOWED_ORIGIN` în `wrangler.toml` la URL-ul GitHub Pages.
