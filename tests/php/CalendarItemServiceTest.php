<?php

/**
 * Unit checks for CalendarItemService VTODO/VJOURNAL parse helpers via create/list on SQLite.
 * Run: php tests/php/CalendarItemServiceTest.php.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\CalendarItemService;

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

// Minimal sabre schema subset
$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec(<<<'SQL'
CREATE TABLE calendars (id integer primary key, synctoken integer, components text);
CREATE TABLE calendarinstances (
  id integer primary key, calendarid integer, principaluri text, access integer,
  displayname text, uri text, description text, calendarorder integer, calendarcolor text,
  timezone text, transparent bool, share_href text, share_displayname text, share_invitestatus integer
);
CREATE TABLE calendarobjects (
  id integer primary key, calendardata blob, uri text, calendarid integer,
  lastmodified integer, etag text, size integer, componenttype text,
  firstoccurence integer, lastoccurence integer, uid text
);
CREATE TABLE calendarchanges (
  id integer primary key, uri text, synctoken integer, calendarid integer, operation integer
);
CREATE TABLE calendarsubscriptions (
  id integer primary key, uri text, principaluri text, source text, displayname text,
  refreshrate text, calendarorder integer, calendarcolor text, striptodos bool, stripalarms bool,
  stripattachments bool, lastmodified int
);
CREATE TABLE schedulingobjects (
  id integer primary key, principaluri text, calendardata blob, uri text,
  lastmodified integer, etag text, size integer
);
CREATE TABLE principals (id integer primary key, uri text, email text, displayname text);
CREATE TABLE users (id integer primary key, username text, digesta1 text);
SQL);

$pdo->exec("INSERT INTO principals (uri, email, displayname) VALUES ('principals/alice','a@x','Alice')");
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice','x')");
$pdo->exec("INSERT INTO calendars (id, synctoken, components) VALUES (1, 1, 'VEVENT,VTODO,VJOURNAL')");
$pdo->exec("INSERT INTO calendarinstances (id, calendarid, principaluri, access, displayname, uri)
  VALUES (10, 1, 'principals/alice', 1, 'Work', 'work')");

// Portal meta path in temp
$metaPath = sys_get_temp_dir() . '/baikal-items-meta-' . bin2hex(random_bytes(4)) . '.json';
$meta = new Baikal\Portal\PortalMeta($metaPath);
$svc = new CalendarItemService($pdo, $meta);

$task = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId'  => 10,
    'summary'     => 'Buy milk',
    'description' => '2%',
    'status'      => 'NEEDS-ACTION',
    'due'         => '2030-06-01T12:00:00+00:00',
    'priority'    => 5,
    'percent'     => 0,
]);
assert_true(($task['summary'] ?? '') === 'Buy milk', 'create task summary');
assert_true(($task['status'] ?? '') === 'NEEDS-ACTION', 'create task status');
assert_true(!empty($task['uri']), 'create task uri');
assert_true((int) ($task['instanceId'] ?? 0) === 10, 'create task instance');

$list = $svc->listItems('alice', CalendarItemService::KIND_TASK);
assert_true(count($list) === 1, 'list one task');
assert_true($list[0]['summary'] === 'Buy milk', 'list task summary');

$upd = $svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $task['uri'], [
    'status'  => 'COMPLETED',
    'percent' => 100,
]);
assert_true($upd['status'] === 'COMPLETED', 'update task completed');
assert_true((int) $upd['percent'] === 100, 'update task percent');

// Subtasks via RELATED-TO;RELTYPE=PARENT
assert_true(!empty($task['uid']), 'parent task has uid');
$sub = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Buy 2% milk',
    'status'     => 'NEEDS-ACTION',
    'parentUid'  => $task['uid'],
]);
assert_true(($sub['parentUid'] ?? null) === $task['uid'], 'subtask parentUid set');
assert_true(!empty($sub['uid']), 'subtask has uid');
$listWithSub = $svc->listItems('alice', CalendarItemService::KIND_TASK);
$foundSub = null;
foreach ($listWithSub as $row) {
    if (($row['uri'] ?? '') === $sub['uri']) {
        $foundSub = $row;
        break;
    }
}
assert_true($foundSub !== null && ($foundSub['parentUid'] ?? null) === $task['uid'], 'list includes parentUid');

// Clear parent
$cleared = $svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $sub['uri'], [
    'parentUid' => null,
]);
assert_true(($cleared['parentUid'] ?? null) === null, 'parent cleared');

// Re-attach and ensure delete parent detaches children
$svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $sub['uri'], [
    'parentUid' => $task['uid'],
]);
$svc->deleteItem('alice', CalendarItemService::KIND_TASK, 10, $task['uri']);
$afterDel = $svc->getItem('alice', CalendarItemService::KIND_TASK, 10, $sub['uri']);
assert_true(($afterDel['parentUid'] ?? null) === null, 'delete parent detaches subtask');
$svc->deleteItem('alice', CalendarItemService::KIND_TASK, 10, $sub['uri']);
assert_true(count($svc->listItems('alice', CalendarItemService::KIND_TASK)) === 0, 'subtask deleted');

// Fresh parent for later cleanup path already empty — create note tests next
$task = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Cleanup parent',
    'status'     => 'NEEDS-ACTION',
]);

$note = $svc->createItem('alice', CalendarItemService::KIND_NOTE, [
    'instanceId'  => 10,
    'summary'     => 'Meeting notes',
    'description' => 'Discussed roadmap',
]);
assert_true($note['summary'] === 'Meeting notes', 'create note');
$notes = $svc->listItems('alice', CalendarItemService::KIND_NOTE, '', 'summary', 'asc');
assert_true(count($notes) === 1, 'list one note');

$svc->deleteItem('alice', CalendarItemService::KIND_TASK, 10, $task['uri']);
assert_true(count($svc->listItems('alice', CalendarItemService::KIND_TASK)) === 0, 'task deleted');

$svc->deleteItem('alice', CalendarItemService::KIND_NOTE, 10, $note['uri']);
assert_true(count($svc->listItems('alice', CalendarItemService::KIND_NOTE)) === 0, 'note deleted');

@unlink($metaPath);

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}
echo "\nAll CalendarItemService tests passed.\n";
exit(0);
