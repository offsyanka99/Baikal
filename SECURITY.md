# Security Policy

## Reporting a Vulnerability

This is a **community fork** of Baïkal (`offsyanka99/Baikal`), not the upstream sabre-io project.

Please report security issues via GitHub Security Advisories on this repository:

https://github.com/offsyanka99/Baikal/security/advisories/new

Or open a private report against the repository if advisories are unavailable.

For upstream Baïkal issues unrelated to this fork, see [sabre-io/Baikal](https://github.com/sabre-io/Baikal) and [sabre.io](https://sabre.io/).

## Deployment notes

- Terminate **TLS** in front of the container (do not expose plain HTTP to the internet).
- Keep `Specific/INSTALL_DISABLED` in place after install, or set `BAIKAL_LOCK_INSTALL=1`.
- Restrict access to `/admin/`; use a strong admin password (stored with `password_hash`).
- Portal DAV-user sessions respect `session_max_age_minutes` (idle timeout) and login rate limits.
- Keep portal debug logging off in production (`PORTAL_LOG_LEVEL` / `portal_log_level` default `off`). Enable only temporarily when debugging.
- Back up `config/` and `Specific/` privately (database + password hashes).
