# Baïkal user portal

TypeScript SPA for calendar sharing. Styled like the bookmarks-sync admin UI
(dark surface cards, sticky topnav, primary blue actions).

## Develop

```bash
# API + Baikal must already be running (e.g. docker on :8080)
cd portal
npm install
npm run dev     # http://127.0.0.1:5173/portal/  (proxies /api → :8080)
```

## Production build

```bash
npm run build   # → ../html/portal/
```

Docker image runs this build in a multi-stage `node` stage automatically.

## API (same origin)

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/login` | — |
| POST | `/api/logout` | session |
| GET | `/api/me` | session |
| GET | `/api/calendars` | session |
| GET | `/api/directory` | session |
| GET | `/api/calendars/{instanceId}/shares` | session |
| POST | `/api/calendars/{instanceId}/shares` | session body `{username, access}` |
| DELETE | `/api/calendars/{instanceId}/shares` | session body `{href}` |

`access`: `read` | `readwrite`.
