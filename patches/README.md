# Vendor patches

Patches applied after `composer install` / `composer update` by
[`scripts/apply-vendor-patches.sh`](../scripts/apply-vendor-patches.sh).

## `sabre-dav-calendar-timezone.patch`

**Problem:** Baikal stores `{urn:ietf:params:xml:ns:caldav}calendar-timezone` as a
plain Olson id (e.g. `America/Toronto`). Stock sabre/dav assumes an iCalendar
`VCALENDAR`/`VTIMEZONE` blob and calls `VObject\Reader::read()` on expand /
free-busy paths. Clients such as Home Assistant that send
`calendar-query` + `<C:expand/>` then get HTTP 500
(`ParseException: This parser only supports VCARD and VCALENDAR files`).
See [sabre-io/dav#1318](https://github.com/sabre-io/dav/issues/1318).

**Fix:** Add `Sabre\CalDAV\Plugin::resolveCalendarTimeZone()` which accepts:

1. plain timezone ids (`DateTimeZone`)
2. RFC 4791 VCALENDAR/VTIMEZONE blobs

…and use it in calendar-query expand, multiget expand, free-busy, ICS export,
and scheduling free-busy paths.

**Target:** `sabre/dav` **4.7.x** (locked in `composer.lock`). Refresh the patch
when upgrading sabre/dav if the surrounding code changes.

```bash
composer install   # runs post-install-cmd → apply-vendor-patches.sh
# or manually:
sh scripts/apply-vendor-patches.sh
```
