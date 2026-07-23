<?php

/**
 * Unit checks for Baikal\Core\Plugins\ReadOnlyPlugin + PortalMeta.
 *
 * Run: php tests/php/ReadOnlyPluginTest.php
 * Requires: composer install
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Plugins\ReadOnlyPlugin;
use Baikal\Portal\PortalMeta;
use Sabre\DAV\Sharing\Plugin as SharingPlugin;

$failures = 0;

function assert_true(bool $cond, string $msg): void {
    global $failures;
    if ($cond) {
        echo "OK  $msg\n";

        return;
    }
    echo "FAIL $msg\n";
    ++$failures;
}

$tmpDir = sys_get_temp_dir() . '/baikal-ro-test-' . bin2hex(random_bytes(4));
mkdir($tmpDir, 0700, true);
$metaPath = $tmpDir . '/portal_meta.json';

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec(<<<'SQL'
CREATE TABLE calendarinstances (
    id integer primary key asc NOT NULL,
    calendarid integer,
    principaluri text,
    access integer,
    displayname text,
    uri text NOT NULL,
    description text,
    calendarorder integer,
    calendarcolor text,
    timezone text,
    transparent bool,
    share_href text,
    share_displayname text,
    share_invitestatus integer DEFAULT 2
);
SQL);

// Owner instance of calendar 10 — will be marked read-only
$pdo->exec(
    "INSERT INTO calendarinstances (id, calendarid, principaluri, access, displayname, uri)
     VALUES (1, 10, 'principals/alice', " . SharingPlugin::ACCESS_SHAREDOWNER . ", 'Holidays', 'holidays')"
);
// Writable calendar for same user
$pdo->exec(
    "INSERT INTO calendarinstances (id, calendarid, principaluri, access, displayname, uri)
     VALUES (2, 20, 'principals/alice', " . SharingPlugin::ACCESS_NOTSHARED . ", 'Personal', 'default')"
);
// Sharee view of calendar 10 (different instance id)
$pdo->exec(
    "INSERT INTO calendarinstances (id, calendarid, principaluri, access, displayname, uri)
     VALUES (3, 10, 'principals/bob', " . SharingPlugin::ACCESS_READWRITE . ", 'Alice Holidays', 'alice-holidays')"
);

$meta = new PortalMeta($metaPath);
$meta->set(1, ['readOnly' => true]);
$meta->set(2, ['readOnly' => false]);

$plugin = new ReadOnlyPlugin($pdo, $meta);

// --- path parsing / owner flag ---
assert_true(
    $plugin->isReadOnlyCalendarPath('calendars/alice/holidays') === true,
    'owner RO calendar path is read-only'
);
assert_true(
    $plugin->isReadOnlyCalendarPath('calendars/alice/holidays/event.ics') === true,
    'object under RO calendar is read-only'
);
assert_true(
    $plugin->isReadOnlyCalendarPath('calendars/alice/default') === false,
    'writable calendar is not read-only'
);
assert_true(
    $plugin->isReadOnlyCalendarPath('calendars/alice/default/uid.ics') === false,
    'object under writable calendar is not read-only'
);

// --- sharee inherits owner flag via calendarid ---
assert_true(
    $plugin->isReadOnlyCalendarPath('calendars/bob/alice-holidays') === true,
    'sharee path inherits owner read-only via calendarid'
);

// --- special collections / non-matches ---
assert_true(
    $plugin->isReadOnlyCalendarPath('calendars/alice/inbox') === false,
    'inbox is never treated as portal read-only'
);
assert_true(
    $plugin->isReadOnlyCalendarPath('calendars/alice/outbox') === false,
    'outbox is never treated as portal read-only'
);
assert_true(
    $plugin->isReadOnlyCalendarPath('addressbooks/alice/default') === false,
    'address book paths are ignored (P1 is calendars only)'
);
assert_true(
    $plugin->isReadOnlyCalendarPath('principals/alice') === false,
    'non-calendar paths are ignored'
);
assert_true(
    $plugin->isReadOnlyCalendarPath('') === false,
    'empty path is ignored'
);

// --- leading/trailing slashes ---
assert_true(
    $plugin->isReadOnlyCalendarPath('/calendars/alice/holidays/') === true,
    'slashes are normalized'
);

// --- PortalMeta persistence ---
$meta2 = new PortalMeta($metaPath);
assert_true($meta2->isReadOnly(1) === true, 'PortalMeta reloads readOnly=true from disk');
assert_true($meta2->isReadOnly(2) === false, 'PortalMeta reloads readOnly=false from disk');
assert_true($meta2->isReadOnly(999) === false, 'missing instance defaults to not read-only');

// cleanup
@unlink($metaPath);
@rmdir($tmpDir);

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}

echo "\nAll ReadOnlyPlugin tests passed.\n";
exit(0);
