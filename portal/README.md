# Baïkal user portal

**Version:** `0.11.1-fork.3`

TypeScript SPA for calendars and contacts. Styled like the bookmarks-sync
admin UI (dark surface cards, sticky topnav, primary blue actions, footer pinned
to the viewport bottom).

## Tabs

| Tab | Features |
|-----|----------|
| **My Calendars** | Create/edit, holidays, read-only (also enforced on CalDAV), share, import/export `.ics` |
| **My Contacts** | Address books (create/rename/delete), contact table/search, per-contact CRUD, multi email/phone, photos, Unicode custom fields, import/export `.vcf` |

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
| POST | `/api/addressbooks` | session body `{displayname, description?, uri?}` |
| PATCH | `/api/addressbooks/{id}` | session body `{displayname?, description?}` |
| DELETE | `/api/addressbooks/{id}` | session body `{force?}` (force required if non-empty) |
| GET | `/api/addressbooks/{id}/export` | session → `.vcf` download |
| POST | `/api/addressbooks/{id}/import` | session body `{vcf}` |
| GET | `/api/addressbooks/{id}/contacts` | session `?q=` search |
| POST | `/api/addressbooks/{id}/contacts` | session create contact JSON |
| GET | `/api/addressbooks/{id}/contacts/{uri}` | session |
| PATCH | `/api/addressbooks/{id}/contacts/{uri}` | session update (merge) |
| DELETE | `/api/addressbooks/{id}/contacts/{uri}` | session |
| GET | `/api/addressbooks/{id}/contacts/{uri}/photo` | session → JPEG |
| GET | `/api/holidays/countries` | session |

Contact write body (create/update): `firstname`, `lastname`, `fullname`, `org`, `title`, `emails[]`, `phones[{type,value}]`, `address{street,city,region,postal,country}`, `url`, `note`, `custom[{label,value}]` (stored as vCard `X-*` properties), `photoBase64?`, `removePhoto?`.  
Updates merge into the existing vCard so unknown standard properties (e.g. `CATEGORIES`) are preserved. Editable custom fields are plain-text `X-*` properties.

`access`: `read` | `readwrite`.  
`color`: `#RGB`, `#RRGGBB`, or `#RRGGBBAA` (empty clears).
