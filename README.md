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
| `/dav.php/` | CalDAV + CardDAV |
| `/admin/` | Web admin |
| `/health.php` | Liveness JSON |
| `/info.php` | Public status JSON |

Upgrading from upstream Baikal
------------------------------

Follow [upstream upgrade instructions](https://sabre.io/baikal/upgrade/).  
Admin passwords using the old SHA-256 scheme are upgraded automatically on next successful login.

Credits
-------

Baikal was created by [Jérôme Schneider](https://github.com/jeromeschneider) from Net Gusto and [fruux](https://fruux.com/) and is maintained by volunteers. This fork adds packaging and hardening for self-hosted / TrueNAS deployments.
