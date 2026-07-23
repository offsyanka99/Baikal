Baïkal (fork)
=============

[![continuous-integration](https://github.com/offsyanka99/Baikal/actions/workflows/ci.yml/badge.svg)](https://github.com/offsyanka99/Baikal/actions/workflows/ci.yml)
[![docker](https://github.com/offsyanka99/Baikal/actions/workflows/docker.yml/badge.svg)](https://github.com/offsyanka99/Baikal/actions/workflows/docker.yml)

Fork of the [Baïkal](https://sabre.io/baikal/) CalDAV + CardDAV server with:

- **Docker** image and **TrueNAS SCALE** compose
- **GHCR** multi-arch images: `ghcr.io/offsyanka99/baikal`
- Admin hardening (`password_hash`, session timeout, login rate limit)
- System settings for **Tasks (VTODO)** and **Notes (VJOURNAL)**
- `/health.php` and `/info.php` for monitoring
- CalDAV **calendar-timezone** dual-format fix (plain Olson id + VTIMEZONE) for Home Assistant expand queries
- **User portal** (`/portal/`) — TypeScript SPA + PHP API to share calendars (bookmarks-sync style UI); `/dav.php/` kept as classic backup

Upstream project: [sabre-io/Baikal](https://github.com/sabre-io/Baikal).  
Official docs: [sabre.io/baikal](https://sabre.io/baikal/).

Quick start (Docker)
--------------------

```bash
docker pull ghcr.io/offsyanka99/baikal:latest
docker run -d --name baikal -p 8080:80 \
  -v baikal-config:/var/www/baikal/config \
  -v baikal-data:/var/www/baikal/Specific \
  ghcr.io/offsyanka99/baikal:latest
```

Then open http://127.0.0.1:8080/ and run the installer.

TrueNAS SCALE
-------------

Use [`docs/truenas-scale.compose.yaml`](docs/truenas-scale.compose.yaml)  
(Apps → Custom App → Install via YAML). Full notes: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Endpoints
---------

| Path | Use |
|------|-----|
| `/portal/` | **User portal** — sign in as a DAV user, share calendars |
| `/dav.php/` | CalDAV + CardDAV (clients + classic WebDAV browser) |
| `/admin/` | Web admin |
| `/api/` | Portal JSON API (session cookie) |
| `/health.php` | Liveness JSON |
| `/info.php` | Public status JSON |

User portal (calendar sharing)
------------------------------

1. Admin creates DAV users under `/admin/`.
2. Each user opens **`/portal/`**, signs in with **DAV** credentials.
3. Select a calendar → pick another user → **Read only** or **Full access** → Share / Revoke.

`/dav.php/` remains available as the original sabre browser (and for all CalDAV clients).

Home Assistant
--------------

Point the CalDAV integration at `http(s)://host/dav.php/` (or `/cal.php/`).
This fork accepts Baikal’s plain calendar timezone ids on expand queries, so
you do **not** need ckulka’s `APPLY_HOME_ASSISTANT_FIX` env var. Details:
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#home-assistant--calendar-timezone).

Upgrading from upstream Baikal
------------------------------

Follow [upstream upgrade instructions](https://sabre.io/baikal/upgrade/).  
Admin passwords using the old SHA-256 scheme are upgraded automatically on next successful login.

After `composer install` / `composer update`, vendor patches (including the
calendar-timezone fix) are applied automatically via
[`scripts/apply-vendor-patches.sh`](scripts/apply-vendor-patches.sh).

Credits
-------

Baikal was created by [Jérôme Schneider](https://github.com/jeromeschneider) from Net Gusto and [fruux](https://fruux.com/) and is maintained by volunteers. This fork adds packaging, hardening, and Home Assistant–friendly CalDAV timezone handling for self-hosted / TrueNAS deployments.
