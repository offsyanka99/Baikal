# Baïkal user portal

**Version:** `0.11.1-fork.1`

TypeScript SPA for calendar create/edit and sharing. Styled like the bookmarks-sync
admin UI (dark surface cards, sticky topnav, primary blue actions, footer pinned
to the viewport bottom).

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
| POST | `/api/calendars` | session body `{displayname, description?, color?}` |
| PATCH | `/api/calendars/{instanceId}` | session body `{displayname?, description?, color?}` |
| GET | `/api/directory` | session |
| GET | `/api/calendars/{instanceId}/shares` | session |
| POST | `/api/calendars/{instanceId}/shares` | session body `{username, access}` |
| DELETE | `/api/calendars/{instanceId}/shares` | session body `{href}` |

`access`: `read` | `readwrite`.  
`color`: `#RGB`, `#RRGGBB`, or `#RRGGBBAA` (empty clears).
