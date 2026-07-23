# Baïkal user portal

**Version:** `0.11.1-fork.2`

TypeScript SPA for calendars and contacts. Styled like the bookmarks-sync
admin UI (dark surface cards, sticky topnav, primary blue actions, footer pinned
to the viewport bottom).

## Tabs

| Tab | Features |
|-----|----------|
| **My Calendars** | Create/edit, holidays, read-only, share, import/export `.ics` |
| **My Contacts** | Address books, import/export `.vcf` |

Section help lives under **(i)** info modals.

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
| POST | `/api/calendars` | session body `{displayname, description?, color?, holidays?, holidayCountry?, readOnly?}` |
| PATCH | `/api/calendars/{instanceId}` | session body `{displayname?, description?, color?}` |
| GET | `/api/calendars/{instanceId}/export` | session → `.ics` download |
| POST | `/api/calendars/{instanceId}/import` | session body `{ics}` (merge by UID) |
| GET | `/api/directory` | session |
| GET | `/api/calendars/{instanceId}/shares` | session |
| POST | `/api/calendars/{instanceId}/shares` | session body `{username, access}` |
| DELETE | `/api/calendars/{instanceId}/shares` | session body `{href}` |
| GET | `/api/addressbooks` | session |
| GET | `/api/addressbooks/{id}/export` | session → `.vcf` download |
| POST | `/api/addressbooks/{id}/import` | session body `{vcf}` |
| GET | `/api/holidays/countries` | session |

`access`: `read` | `readwrite`.  
`color`: `#RGB`, `#RRGGBB`, or `#RRGGBBAA` (empty clears).
