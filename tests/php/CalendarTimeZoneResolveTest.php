<?php

/**
 * Unit checks for Sabre\CalDAV\Plugin::resolveCalendarTimeZone().
 *
 * Run: php tests/php/CalendarTimeZoneResolveTest.php
 * Requires: composer install (+ vendor patch applied).
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Sabre\CalDAV\Plugin;

$failures = 0;

function assert_true(bool $cond, string $msg): void
{
    global $failures;
    if ($cond) {
        echo "OK  $msg\n";
        return;
    }
    echo "FAIL $msg\n";
    ++$failures;
}

if (!method_exists(Plugin::class, 'resolveCalendarTimeZone')) {
    fwrite(STDERR, "FAIL resolveCalendarTimeZone missing — run: sh scripts/apply-vendor-patches.sh\n");
    exit(1);
}

// Plain Olson id (Baikal PDO storage)
$tz = Plugin::resolveCalendarTimeZone('America/Toronto');
assert_true($tz instanceof DateTimeZone, 'plain America/Toronto returns DateTimeZone');
assert_true('America/Toronto' === $tz->getName(), 'plain America/Toronto name');

$tz = Plugin::resolveCalendarTimeZone('UTC');
assert_true('UTC' === $tz->getName(), 'plain UTC');

// Whitespace
$tz = Plugin::resolveCalendarTimeZone("  Europe/Paris \n");
assert_true('Europe/Paris' === $tz->getName(), 'trimmed plain id');

// Empty / invalid → UTC
assert_true('UTC' === Plugin::resolveCalendarTimeZone('')->getName(), 'empty → UTC');
assert_true('UTC' === Plugin::resolveCalendarTimeZone('Not/A_Real_Zone')->getName(), 'invalid → UTC');

// RFC 4791-style VCALENDAR with VTIMEZONE (minimal)
$ical = <<<'ICS'
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//test//EN
BEGIN:VTIMEZONE
TZID:Europe/Berlin
BEGIN:STANDARD
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
END:DAYLIGHT
END:VTIMEZONE
END:VCALENDAR
ICS;

$tz = Plugin::resolveCalendarTimeZone($ical);
assert_true($tz instanceof DateTimeZone, 'VTIMEZONE blob returns DateTimeZone');
assert_true('Europe/Berlin' === $tz->getName(), 'VTIMEZONE blob resolves Europe/Berlin');

// Garbage that looks like iCal
$tz = Plugin::resolveCalendarTimeZone("BEGIN:VCALENDAR\nGARBAGE\nEND:VCALENDAR");
assert_true($tz instanceof DateTimeZone, 'broken iCal still returns DateTimeZone');
assert_true('UTC' === $tz->getName(), 'broken iCal → UTC');

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}

echo "\nAll resolveCalendarTimeZone checks passed.\n";
exit(0);
