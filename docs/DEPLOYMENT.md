# Deployment guide (fork)

**Version:** `0.11.1-fork.4` (based on upstream Baikal 0.11.1)

This fork packages [Baïkal](https://sabre.io/baikal/) for Docker and TrueNAS SCALE, and adds admin hardening, system Tasks/Notes flags, health endpoints, a dual-format CalDAV calendar-timezone fix for Home Assistant, and a **user portal** for calendars and contacts.

## Images

| Image | When |
|-------|------|
| `ghcr.io/offsyanka99/baikal:0.11.1-fork.4` | **Pin for production** (this release) |
| `ghcr.io/offsyanka99/baikal:latest` | Default tracking `master` (GitHub Actions) |
| `ghcr.io/offsyanka99/baikal:sha-…` | Pin to a git SHA |
| Build from `Dockerfile` | Dev / offline packaging |

Multi-arch: `linux/amd64`, `linux/arm64`.

## TrueNAS SCALE

See [`truenas-scale.compose.yaml`](truenas-scale.compose.yaml).

1. Create dataset dirs and `chown -R 101:101` (nginx UID in the image).
2. Install via Custom App YAML. Prefer **`image: …:latest`** (or a pinned tag) — pull only; do not use the `build:` block on the NAS.
3. Set **`BAIKAL_SKIP_CHOWN=1`** after host `chown 101:101` so startup does not re-chown mounts (avoids hanging on `40-fix-baikal-file-permissions.sh`).
4. Complete the web installer once.
5. Put **HTTPS** in front (TrueNAS proxy, Caddy, Traefik). Do not expose plain HTTP to the internet.
6. After install, ensure `Specific/INSTALL_DISABLED` exists, or set env **`BAIKAL_LOCK_INSTALL=1`** so the installer cannot reopen if the marker is deleted.

### Stuck on `40-fix-baikal-file-permissions.sh`?

The entrypoint was doing a recursive `chown` that can take a very long time on TrueNAS bind mounts. Current images only chown `config/` + `Specific/`, and log start/done. If it still hangs:

```bash
# On the NAS host (adjust path):
chown -R 101:101 /mnt/tank/apps/baikal
```

Then in compose:

```yaml
environment:
  BAIKAL_SKIP_CHOWN: "1"
```

Redeploy / recreate the container (not only restart).

### Volumes to back up

| Mount | Contents |
|-------|----------|
| `/var/www/baikal/config` | `baikal.yaml` (admin password hash, CalDAV/CardDAV/Tasks/Notes flags, auth) |
| `/var/www/baikal/Specific` | SQLite DB, `INSTALL_DISABLED`, admin login rate-limit state |

## Endpoints

| Path | Purpose |
|------|---------|
| `/portal/` | **User portal** (calendars + contacts; DAV user login) |
| `/api/` | Portal JSON API (session cookie; same origin as SPA) |
| `/health.php` | Liveness JSON (`status`, `version`, install lock) |
| `/info.php` | Public feature flags (no secrets) |
| `/dav.php/` | Combined CalDAV + CardDAV + classic browser UI |
| `/cal.php/` | CalDAV only |
| `/card.php/` | CardDAV only |
| `/admin/` | Web admin |

## User portal

Modern UI (TypeScript SPA, dark theme aligned with bookmarks-sync admin style) for **end users**.  
Tabs: **Calendar** · **Contacts** · **Tasks** · **Notes**. Section help is under **(i)** icons.

| Step | Action |
|------|--------|
| 1 | Open `http://NAS-IP:31088/portal/` |
| 2 | Sign in with a **DAV user** (created in Admin → Users), not the admin password |
| 3 | **Calendar:** owned list (Edit / Delete), month grid with create/edit/delete events (RRULE), holidays/read-only; details, share, then import/export `.ics` in the Edit modal |
| 4 | **Contacts:** address books (delete confirm), contact search/CRUD, photos, birthday/special dates, custom fields, book + single-contact `.vcf` export |
| 5 | **Tasks / Notes:** CalDAV `VTODO` / `VJOURNAL` on writable calendars (bulk actions on tasks) |

### Screenshots

**Calendar** — owned calendars (Edit / Delete), badges (owner, read-only, holidays), add form, and month view of the selected calendar’s events:

![User portal — Calendar](images/portal-my-calendars.jpg)

**Calendar details** — edit name/color/description, share with other users, then import/export `.ics` (modal):

![User portal — Calendar details](images/portal-calendar-edit.jpg)

**Contacts** — address books (create/rename/delete), Google-style contact table, search, edit form with photo, import/export `.vcf`:

![User portal — Contacts](images/portal-my-contacts.jpg)

**Tasks** — sortable `VTODO` list (subtasks indented), multi-select bulk status/due/%, create/edit form with parent task:

![User portal — Tasks](images/portal-tasks.jpg)

**Notes** — sortable `VJOURNAL` list with preview, create/edit form (title, date, body) on a writable calendar:

![User portal — Notes](images/portal-notes.jpg)

- Backend: PHP API under `/api/` (session cookie; sabre CalDAV/CardDAV backends).
- Frontend source: [`portal/`](../portal/) (Vite + TypeScript); image build compiles into `html/portal/`.
- Footer **Docs** → [github.com/offsyanka99/Baikal/tree/master/docs](https://github.com/offsyanka99/Baikal/tree/master/docs).
- **`/dav.php/` is unchanged** — CalDAV/CardDAV for clients and classic browser backup.
- Portal meta (read-only / holidays flags): `Specific/portal_meta.json` (include in backups).
- **Read-only calendars** are enforced on CalDAV (`/dav.php/`, `/cal.php/`) via `ReadOnlyPlugin` — clients get **403** on write methods, not only a portal import block.
- Contact photos require **PHP GD** (`php8.2-gd` in the Docker image); stored as **vCard 3.0** `PHOTO;ENCODING=b` JPEG (avoids vCard 4 raw-binary corruption).
- Portal sessions: idle timeout from `session_max_age_minutes` (same as admin, default 15); login rate-limited; CSRF + same-origin checks on mutations.
- Optional portal locale helpers in `baikal.yaml` / env (override browser auto-detect):
  - `system.portal_time_format` or `TIME_FORMAT` / `BAIKAL_PORTAL_TIME_FORMAT`: `auto` | `12h` | `24h`
  - `system.portal_week_start` or `BAIKAL_PORTAL_WEEK_START`: `auto` | `monday` | `sunday`
- Portal debug logging (`off` by default; enable while troubleshooting):
  - `system.portal_log_level` or `PORTAL_LOG_LEVEL` / `BAIKAL_PORTAL_LOG_LEVEL`: `off` | `error` | `warn` | `info` | `debug`
  - **Browser:** open DevTools → Console; messages are prefixed `[baikal-portal]`
  - **Server:** same level writes request/outcome lines to PHP `error_log` (Docker: `docker logs baikal`)
  - Public `GET /api/ui` returns prefs (including log level) without a session

### API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/ui` | Public portal prefs (`timeFormat`, `weekStart`, `logLevel`) |
| POST | `/api/login` | DAV user session (+ `ui` prefs) |
| GET | `/api/me` | Session profile + `ui` prefs |
| GET | `/api/calendars` | List calendars |
| POST | `/api/calendars` | Create (`displayname`, `color?`, `description?`, `holidays?`, `holidayCountry?`, `readOnly?`) |
| PATCH | `/api/calendars/{id}` | Update name / color / description |
| GET | `/api/calendars/{id}/export` | Download `.ics` |
| POST | `/api/calendars/{id}/import` | Import `.ics` body `{ics}` |
| GET | `/api/calendars/{id}/events` | List events (`?from=&to=`) |
| POST | `/api/calendars/{id}/events` | Create VEVENT |
| GET/PATCH/DELETE | `/api/calendars/{id}/events/{uri}` | Get / update / delete VEVENT |
| POST/DELETE | `/api/calendars/{id}/shares` | Share / revoke |
| GET | `/api/addressbooks` | List address books |
| POST | `/api/addressbooks` | Create address book |
| PATCH | `/api/addressbooks/{id}` | Rename / description |
| DELETE | `/api/addressbooks/{id}` | Delete (`force` if non-empty) |
| GET | `/api/addressbooks/{id}/export` | Download `.vcf` |
| POST | `/api/addressbooks/{id}/import` | Import `.vcf` body `{vcf}` |
| GET | `/api/addressbooks/{id}/contacts` | List/search contacts (`?q=`) |
| POST | `/api/addressbooks/{id}/contacts` | Create contact |
| GET/PATCH/DELETE | `/api/addressbooks/{id}/contacts/{uri}` | Get / update / delete contact |
| GET | `/api/addressbooks/{id}/contacts/{uri}/export` | Download single contact `.vcf` |
| GET | `/api/addressbooks/{id}/contacts/{uri}/photo` | Contact photo JPEG |
| GET | `/api/holidays/countries` | Country list for holidays calendars |

See [`portal/README.md`](../portal/README.md).

Local SPA rebuild after UI edits:

```bash
cd portal && npm install && npm run build
# outputs to html/portal/
```

## Home Assistant / calendar-timezone

Baikal stores each calendar’s timezone as a **plain Olson id** (e.g. `America/Toronto`).
Stock sabre/dav expects a full iCalendar `VCALENDAR`/`VTIMEZONE` blob when clients
request `calendar-query` with `<C:expand/>` (Home Assistant does this). That
mismatch produced HTTP 500 / `ParseException` ([sabre-io/dav#1318](https://github.com/sabre-io/dav/issues/1318)).

This fork always applies a **dual-format** resolver after `composer install` (and
in the Docker image build): plain ids and RFC 4791 VTIMEZONE blobs both work.
No env flag required (unlike `ckulka/baikal`’s `APPLY_HOME_ASSISTANT_FIX`).
See [`patches/README.md`](../patches/README.md).

### Connecting Home Assistant

| Field | Example |
|-------|---------|
| URL | `https://nas.example/dav.php/` or `http://NAS-IP:31088/dav.php/` |
| Username / password | A Baikal **DAV user** (not the admin account) |
| Calendar | Path under that user (HA discovers calendars after auth) |

Prefer **HTTPS** (TrueNAS reverse proxy / Caddy / Traefik) when HA and Baikal
are not on a trusted LAN-only path. Digest auth is fine on LAN; for internet
exposure use TLS and consider Basic over HTTPS (see auth notes below).

## Authentication

### Admin UI

- Password stored with PHP `password_hash()` (bcrypt/argon depending on PHP).
- Legacy SHA-256 / old MD5 admin hashes are accepted once and upgraded on login.
- Rolling idle session (default **15 minutes**, configurable as **Admin session timeout**).
- Failed login rate limit: **10 attempts / 15 minutes / IP** (file under `Specific/`).
- Optional Fail2Ban via `failed_access_message` syslog lines.

### CalDAV / CardDAV users

| Mode | Storage | Recommendation |
|------|---------|----------------|
| **Digest** (default) | MD5 A1 hash `md5(user:realm:pass)` | LAN OK; weak if DB leaks — **use TLS** |
| **Basic** | Same digest hash table today | Prefer **only over HTTPS** |
| **Apache** | Web server auth | When reverse proxy handles users |

There is no separate “TasksDAV” / “NotesDAV”: tasks are **VTODO**, notes are **VJOURNAL** on CalDAV calendars.

## System settings (admin)

| Setting | Effect |
|---------|--------|
| Enable CardDAV / CalDAV | Protocol roots and plugins |
| Enable Tasks (VTODO) | Default calendars + UI checkbox for todos |
| Enable Notes (VJOURNAL) | Default calendars + UI checkbox for notes |
| Admin session timeout | Idle minutes for admin cookie session |
| WebDAV auth type | Digest / Basic / Apache |

## Environment variables (Docker / compose)

| Env | Values / default | Effect |
|-----|------------------|--------|
| `TZ` | e.g. `America/Toronto` | Container timezone (logs, PHP defaults) |
| `BAIKAL_LOCK_INSTALL` | `1` | Force installer lock even if `INSTALL_DISABLED` is missing |
| `BAIKAL_ALLOW_REINSTALL` | `1` | Allow re-opening the installer when lock env is set |
| `BAIKAL_SKIP_CHOWN` | `1` | Skip entrypoint chown of `config/` + `Specific/` (use after host `chown 101:101`; recommended on TrueNAS) |
| `TIME_FORMAT` / `BAIKAL_PORTAL_TIME_FORMAT` | `auto` (default), `12h`, `24h` | Portal time display |
| `BAIKAL_PORTAL_WEEK_START` | `auto` (default), `monday`, `sunday` | Portal calendar week start |
| `PORTAL_LOG_LEVEL` / `BAIKAL_PORTAL_LOG_LEVEL` | `off` (default), `error`, `warn`, `info`, `debug` | Portal debug logs (browser console + PHP `error_log`) |

YAML equivalents under `system.*` in `baikal.yaml`: `portal_time_format`, `portal_week_start`, `portal_log_level`. **Env overrides YAML.**

Leave `PORTAL_LOG_LEVEL` at `off` in production; use `debug` only while troubleshooting (verbose UI/API lines; no passwords).

## Installer lock

After a normal install, `Specific/INSTALL_DISABLED` is created and `/admin/install/` returns **403**.

| Env | Effect |
|-----|--------|
| `BAIKAL_LOCK_INSTALL=1` | Force lock even if the marker file is missing |
| `BAIKAL_ALLOW_REINSTALL=1` | Allow re-opening the wizard when lock env is set |

## Local Docker

```bash
docker build -t baikal:local .
docker run --rm -p 8080:80 \
  -v baikal-config:/var/www/baikal/config \
  -v baikal-data:/var/www/baikal/Specific \
  baikal:local
```

Open http://127.0.0.1:8080/ and complete setup.

### From source (without Docker)

```bash
composer install
# post-install applies patches/ (calendar-timezone, …)
php tests/php/CalendarTimeZoneResolveTest.php   # optional smoke check
```

Requires the `patch` command on `PATH`. Re-run after `composer update` if you
upgrade `sabre/dav` and the patch still applies; refresh
[`patches/sabre-dav-calendar-timezone.patch`](../patches/sabre-dav-calendar-timezone.patch)
if a new sabre/dav release changes those files.

## Upstream

Core CalDAV/CardDAV remains based on [sabre-io/Baikal](https://github.com/sabre-io/Baikal) **0.11.1**.  
Fork version scheme: `{upstream}-fork.{n}` (e.g. `0.11.1-fork.4`). Prefer rebasing packaging onto upstream releases regularly.

## Release notes

### 0.11.1-fork.4

- Portal calendar **event CRUD** (create/edit/delete VEVENT from month view) with **RRULE** support
- Single-contact `.vcf` export; address-book delete confirmation modal; contact birthday / special date
- Tasks bulk-bar UX (green apply icons; Delete / Clear selection on second row); Calendar details: Share before Import/export
- Portal time format / week start prefs (`portal_time_format`, `portal_week_start` or env overrides)
- Portal debug log level (`portal_log_level` / `PORTAL_LOG_LEVEL`: off|error|warn|info|debug)

### 0.11.1-fork.3

- Full portal contacts: address book CRUD, contact table/search/edit, photos, multi email/phone, Unicode custom fields
- CalDAV `ReadOnlyPlugin` for portal read-only calendars
- Portal auth hardening (rate limit, idle timeout, CSRF/same-origin), import quotas, GD photos, CSP
- Calendar tab: month event grid, Edit/Delete on owned calendars, details/share modal; Tasks/Notes tabs; bulk task actions
- Updated portal screenshots (Calendar, Calendar details, Contacts, Tasks, Notes)

### 0.11.1-fork.2

- Portal tabs: My Calendars / My Contacts
- Calendar import/export (`.ics`), holidays calendars, read-only flag
- Contacts import/export (`.vcf`)
- Info (i) modals; import result UI; large-import timeout handling

### 0.11.1-fork.1

- User portal: create/edit calendars (name, color, description), share/revoke
- HA-friendly dual-format calendar-timezone (no `APPLY_HOME_ASSISTANT_FIX`)
- Docker/GHCR multi-arch, TrueNAS compose, `/health.php` + `/info.php`
