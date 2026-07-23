<?php

namespace Baikal\Portal;

use Sabre\CalDAV\Backend\PDO as CaldavBackend;
use Sabre\DAV\Sharing\Plugin as SharingPlugin;
use Sabre\DAV\UUIDUtil;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\Reader;

/**
 * Portal CRUD for VTODO (tasks) and VJOURNAL (notes) stored in CalDAV calendars.
 * Objects sync with CalDAV clients via the same calendarobjects table as events.
 */
class CalendarItemService {
    public const KIND_TASK = 'task';
    public const KIND_NOTE = 'note';

    private const COMPONENT = [
        self::KIND_TASK => 'VTODO',
        self::KIND_NOTE => 'VJOURNAL',
    ];

    private const MAX_SUMMARY = 500;
    private const MAX_DESCRIPTION = 20000;

    /** @var \PDO */
    private $pdo;

    /** @var CaldavBackend */
    private $backend;

    /** @var PortalMeta */
    private $meta;

    public function __construct(\PDO $pdo, ?PortalMeta $meta = null) {
        $this->pdo = $pdo;
        $this->backend = new CaldavBackend($pdo);
        $this->meta = $meta ?? new PortalMeta();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listItems(string $username, string $kind, string $query = '', string $sort = '', string $order = 'asc'): array {
        $component = $this->componentForKind($kind);
        $principal = 'principals/' . $username;

        // List objects of this component type on calendars the user can see
        $sql = 'SELECT o.uri, o.calendarid, o.componenttype, o.lastmodified, o.etag, o.calendardata,
                       i.id AS instance_id, i.displayname AS calendar_name, i.access, i.uri AS calendar_uri
                FROM calendarobjects o
                INNER JOIN calendarinstances i ON i.calendarid = o.calendarid AND i.principaluri = ?
                WHERE UPPER(o.componenttype) = ?
                ORDER BY o.lastmodified DESC';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$principal, $component]);

        $q = mb_strtolower(trim($query));
        $out = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $access = (int) ($row['access'] ?? 0);
            $canWrite = $this->accessCanWrite($access);
            $canRead = $canWrite || $access === SharingPlugin::ACCESS_READ
                || $access === SharingPlugin::ACCESS_SHAREDOWNER
                || $access === SharingPlugin::ACCESS_NOTSHARED;
            if (!$canRead) {
                continue;
            }
            $instanceId = (int) $row['instance_id'];
            $readOnly = $this->meta->isReadOnly($instanceId) || !$canWrite;
            $data = $this->calendardataToString($row['calendardata'] ?? '');
            $parsed = $kind === self::KIND_TASK
                ? $this->parseTodo($data)
                : $this->parseJournal($data);
            $item = array_merge($parsed, [
                'uri'          => (string) $row['uri'],
                'instanceId'   => $instanceId,
                'calendarId'   => (int) $row['calendarid'],
                'calendarName' => (string) ($row['calendar_name'] ?: $row['calendar_uri'] ?: 'Calendar'),
                'calendarUri'  => (string) ($row['calendar_uri'] ?? ''),
                'component'    => $component,
                'lastmodified' => (int) ($row['lastmodified'] ?? 0),
                'etag'         => trim((string) ($row['etag'] ?? ''), '"'),
                'readOnly'     => $readOnly,
                'canWrite'     => !$readOnly,
            ]);
            if ($q !== '' && !$this->matchesQuery($item, $q)) {
                continue;
            }
            $out[] = $item;
        }

        $this->sortItems($out, $kind, $sort, $order);

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    public function getItem(string $username, string $kind, int $instanceId, string $uri): array {
        $component = $this->componentForKind($kind);
        $calId = $this->requireAccess($username, $instanceId, false);
        $uri = $this->normalizeObjectUri($uri);
        $obj = $this->backend->getCalendarObject([$calId, $instanceId], $uri);
        if (!$obj || empty($obj['calendardata'])) {
            throw new ApiException(ucfirst($kind) . ' not found', 404);
        }
        $comp = strtoupper((string) ($obj['component'] ?? ''));
        if ($comp !== '' && $comp !== $component) {
            throw new ApiException('Object is not a ' . $component, 404);
        }
        $data = $this->calendardataToString($obj['calendardata']);
        $parsed = $kind === self::KIND_TASK ? $this->parseTodo($data) : $this->parseJournal($data);
        $meta = $this->calendarMeta($username, $instanceId);
        $access = (int) $meta['access'];
        $readOnly = $this->meta->isReadOnly($instanceId) || !$this->accessCanWrite($access);

        return array_merge($parsed, [
            'uri'          => $uri,
            'instanceId'   => $instanceId,
            'calendarId'   => $calId,
            'calendarName' => $meta['displayname'],
            'calendarUri'  => $meta['uri'],
            'component'    => $component,
            'lastmodified' => (int) ($obj['lastmodified'] ?? 0),
            'etag'         => trim((string) ($obj['etag'] ?? ''), '"'),
            'readOnly'     => $readOnly,
            'canWrite'     => !$readOnly,
        ]);
    }

    /**
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function createItem(string $username, string $kind, array $fields): array {
        $component = $this->componentForKind($kind);
        $instanceId = (int) ($fields['instanceId'] ?? $fields['calendarInstanceId'] ?? 0);
        if ($instanceId <= 0) {
            throw new ApiException('instanceId (calendar) is required', 400);
        }
        $calId = $this->requireAccess($username, $instanceId, true);
        if ($this->meta->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only', 403);
        }

        $summary = trim((string) ($fields['summary'] ?? ''));
        if ($summary === '') {
            throw new ApiException('Summary (title) is required', 400);
        }
        $summary = mb_substr($summary, 0, self::MAX_SUMMARY);
        $description = mb_substr(trim((string) ($fields['description'] ?? '')), 0, self::MAX_DESCRIPTION);

        $uid = UUIDUtil::getUUID();
        $uri = $this->objectUriFromUid($uid);
        $vcal = new VCalendar();
        $vcal->PRODID = '-//Baikal Portal//EN';
        $vcal->VERSION = '2.0';

        if ($kind === self::KIND_TASK) {
            $todo = $vcal->add('VTODO', [
                'UID'     => $uid,
                'DTSTAMP' => new \DateTime('now', new \DateTimeZone('UTC')),
                'SUMMARY' => $summary,
            ]);
            if ($description !== '') {
                $todo->DESCRIPTION = $description;
            }
            $this->applyTodoFields($todo, $fields, true);
            $this->applyParentRelation($todo, $fields, $calId, $uid, true);
        } else {
            $journal = $vcal->add('VJOURNAL', [
                'UID'     => $uid,
                'DTSTAMP' => new \DateTime('now', new \DateTimeZone('UTC')),
                'SUMMARY' => $summary,
            ]);
            if ($description !== '') {
                $journal->DESCRIPTION = $description;
            }
            $this->applyJournalFields($journal, $fields, true);
        }

        $serialized = $vcal->serialize();
        $vcal->destroy();
        $this->backend->createCalendarObject([$calId, $instanceId], $uri, $serialized);

        return $this->getItem($username, $kind, $instanceId, $uri);
    }

    /**
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function updateItem(string $username, string $kind, int $instanceId, string $uri, array $fields): array {
        $component = $this->componentForKind($kind);
        $calId = $this->requireAccess($username, $instanceId, true);
        if ($this->meta->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only', 403);
        }
        $uri = $this->normalizeObjectUri($uri);
        $obj = $this->backend->getCalendarObject([$calId, $instanceId], $uri);
        if (!$obj || empty($obj['calendardata'])) {
            throw new ApiException(ucfirst($kind) . ' not found', 404);
        }

        try {
            $vcal = Reader::read($this->calendardataToString($obj['calendardata']), Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            throw new ApiException('Invalid calendar data for this item', 500);
        }
        if (!$vcal instanceof VCalendar) {
            throw new ApiException('Invalid calendar object', 500);
        }

        $comp = null;
        foreach ($vcal->getComponents() as $c) {
            if (strtoupper($c->name) === $component) {
                $comp = $c;
                break;
            }
        }
        if ($comp === null) {
            $vcal->destroy();
            throw new ApiException('Object is not a ' . $component, 404);
        }

        if (array_key_exists('summary', $fields)) {
            $summary = mb_substr(trim((string) $fields['summary']), 0, self::MAX_SUMMARY);
            if ($summary === '') {
                throw new ApiException('Summary (title) cannot be empty', 400);
            }
            $comp->SUMMARY = $summary;
        }
        if (array_key_exists('description', $fields)) {
            $description = mb_substr(trim((string) $fields['description']), 0, self::MAX_DESCRIPTION);
            if ($description === '') {
                unset($comp->DESCRIPTION);
            } else {
                $comp->DESCRIPTION = $description;
            }
        }

        if ($kind === self::KIND_TASK) {
            $this->applyTodoFields($comp, $fields, false);
            $selfUid = isset($comp->UID) ? trim((string) $comp->UID) : '';
            $this->applyParentRelation($comp, $fields, $calId, $selfUid !== '' ? $selfUid : null, false);
        } else {
            $this->applyJournalFields($comp, $fields, false);
        }

        if (!isset($comp->DTSTAMP)) {
            $comp->DTSTAMP = new \DateTime('now', new \DateTimeZone('UTC'));
        } else {
            $comp->DTSTAMP = new \DateTime('now', new \DateTimeZone('UTC'));
        }

        $serialized = $vcal->serialize();
        $vcal->destroy();
        $this->backend->updateCalendarObject([$calId, $instanceId], $uri, $serialized);

        return $this->getItem($username, $kind, $instanceId, $uri);
    }

    public function deleteItem(string $username, string $kind, int $instanceId, string $uri): void {
        $this->componentForKind($kind);
        $calId = $this->requireAccess($username, $instanceId, true);
        if ($this->meta->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only', 403);
        }
        $uri = $this->normalizeObjectUri($uri);
        $obj = $this->backend->getCalendarObject([$calId, $instanceId], $uri);
        if (!$obj) {
            throw new ApiException(ucfirst($kind) . ' not found', 404);
        }
        // Orphan subtasks (clear RELATED-TO parent) so they stay usable after delete
        if ($kind === self::KIND_TASK && !empty($obj['calendardata'])) {
            $parsed = $this->parseTodo($this->calendardataToString($obj['calendardata']));
            $uid = trim((string) ($parsed['uid'] ?? ''));
            if ($uid !== '') {
                $this->detachChildren($calId, $instanceId, $uid);
            }
        }
        $this->backend->deleteCalendarObject([$calId, $instanceId], $uri);
    }

    /**
     * Bulk update or delete tasks/notes.
     *
     * @param list<array{instanceId?: int, uri?: string}> $items
     * @param array<string, mixed>                        $fields  For op=update: status, due, percent (tasks)
     *
     * @return array{ok: int, failed: int, errors: list<string>}
     */
    public function bulkItems(string $username, string $kind, string $op, array $items, array $fields = []): array {
        $this->componentForKind($kind);
        $op = strtolower(trim($op));
        if ($op !== 'delete' && $op !== 'update') {
            throw new ApiException('Bulk op must be "delete" or "update"', 400);
        }
        if ($items === []) {
            throw new ApiException('No items selected', 400);
        }
        if (count($items) > 200) {
            throw new ApiException('Too many items (max 200)', 400);
        }

        // Only allow safe bulk fields for tasks
        $allowedFields = [];
        if ($op === 'update') {
            if ($kind !== self::KIND_TASK) {
                throw new ApiException('Bulk update is only supported for tasks', 400);
            }
            foreach (['status', 'due', 'percent'] as $k) {
                if (array_key_exists($k, $fields)) {
                    $allowedFields[$k] = $fields[$k];
                }
            }
            if ($allowedFields === []) {
                throw new ApiException('No update fields (status, due, percent)', 400);
            }
        }

        $ok = 0;
        $failed = 0;
        $errors = [];
        $seen = [];
        foreach ($items as $i => $row) {
            if (!is_array($row)) {
                ++$failed;
                $errors[] = 'Item #' . ($i + 1) . ': invalid entry';
                continue;
            }
            $instanceId = (int) ($row['instanceId'] ?? 0);
            $uri = isset($row['uri']) ? (string) $row['uri'] : '';
            if ($instanceId <= 0 || $uri === '') {
                ++$failed;
                $errors[] = 'Item #' . ($i + 1) . ': instanceId and uri required';
                continue;
            }
            $dedupe = $instanceId . '|' . $uri;
            if (isset($seen[$dedupe])) {
                continue;
            }
            $seen[$dedupe] = true;
            try {
                if ($op === 'delete') {
                    $this->deleteItem($username, $kind, $instanceId, $uri);
                } else {
                    $this->updateItem($username, $kind, $instanceId, $uri, $allowedFields);
                }
                ++$ok;
            } catch (ApiException $e) {
                ++$failed;
                $errors[] = $uri . ': ' . $e->getMessage();
            } catch (\Throwable $e) {
                ++$failed;
                $errors[] = $uri . ': failed';
            }
        }

        return [
            'ok'     => $ok,
            'failed' => $failed,
            'errors' => array_slice($errors, 0, 20),
        ];
    }

    /**
     * Calendars the user can write tasks/notes into (for create form).
     *
     * @return list<array{id: int, displayname: string, color: string, components: string}>
     */
    public function writableCalendars(string $username, string $kind): array {
        $this->componentForKind($kind); // validate kind
        $principal = 'principals/' . $username;
        $raw = $this->backend->getCalendarsForUser($principal);
        $out = [];
        foreach ($raw as $cal) {
            $id = $cal['id'] ?? null;
            if (!is_array($id) || count($id) < 2) {
                continue;
            }
            $access = (int) ($cal['share-access'] ?? SharingPlugin::ACCESS_NOTSHARED);
            if (!$this->accessCanWrite($access)) {
                continue;
            }
            $instanceId = (int) $id[1];
            if ($this->meta->isReadOnly($instanceId)) {
                continue;
            }
            // Object componenttype is set on write; any writable calendar is OK in the portal.
            $out[] = [
                'id'          => $instanceId,
                'displayname' => (string) ($cal['{DAV:}displayname'] ?? $cal['uri'] ?? 'Calendar'),
                'color'       => (string) ($cal['{http://apple.com/ns/ical/}calendar-color'] ?? ''),
                'components'  => (string) ($cal['components'] ?? ''),
            ];
        }
        usort($out, static fn ($a, $b) => strcasecmp($a['displayname'], $b['displayname']));

        return $out;
    }

    private function componentForKind(string $kind): string {
        if (!isset(self::COMPONENT[$kind])) {
            throw new ApiException('Unknown item kind', 400);
        }

        return self::COMPONENT[$kind];
    }

    private function accessCanWrite(int $access): bool {
        return $access === SharingPlugin::ACCESS_SHAREDOWNER
            || $access === SharingPlugin::ACCESS_NOTSHARED
            || $access === SharingPlugin::ACCESS_READWRITE;
    }

    private function requireAccess(string $username, int $instanceId, bool $write): int {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT id, calendarid, access FROM calendarinstances WHERE id = ? AND principaluri = ?'
        );
        $stmt->execute([$instanceId, $principal]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiException('Calendar not found', 404);
        }
        $access = (int) $row['access'];
        $canWrite = $this->accessCanWrite($access);
        $canRead = $canWrite || $access === SharingPlugin::ACCESS_READ;
        if ($write && !$canWrite) {
            throw new ApiException('You do not have write access to this calendar', 403);
        }
        if (!$write && !$canRead) {
            throw new ApiException('You do not have access to this calendar', 403);
        }

        return (int) $row['calendarid'];
    }

    /**
     * @return array{displayname: string, uri: string, access: int}
     */
    private function calendarMeta(string $username, int $instanceId): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT displayname, uri, access FROM calendarinstances WHERE id = ? AND principaluri = ?'
        );
        $stmt->execute([$instanceId, $principal]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            return ['displayname' => 'Calendar', 'uri' => '', 'access' => 0];
        }

        return [
            'displayname' => (string) ($row['displayname'] ?: $row['uri'] ?: 'Calendar'),
            'uri'         => (string) ($row['uri'] ?? ''),
            'access'      => (int) $row['access'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function parseTodo(string $data): array {
        $empty = [
            'uid'         => '',
            'parentUid'   => null,
            'summary'     => '',
            'description' => '',
            'status'      => 'NEEDS-ACTION',
            'due'         => null,
            'priority'    => 0,
            'percent'     => 0,
            'completed'   => null,
        ];
        if (trim($data) === '') {
            return $empty;
        }
        try {
            $vcal = Reader::read($data, Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            return $empty;
        }
        $todo = null;
        foreach ($vcal->getComponents() as $c) {
            if (strtoupper($c->name) === 'VTODO') {
                $todo = $c;
                break;
            }
        }
        if ($todo === null) {
            $vcal->destroy();

            return $empty;
        }
        $status = isset($todo->STATUS) ? strtoupper(trim((string) $todo->STATUS)) : 'NEEDS-ACTION';
        if ($status === '') {
            $status = 'NEEDS-ACTION';
        }
        $due = null;
        if (isset($todo->DUE)) {
            try {
                $dt = $todo->DUE->getDateTime();
                $due = $dt->format('c');
            } catch (\Throwable $e) {
                $due = null;
            }
        }
        $completed = null;
        if (isset($todo->COMPLETED)) {
            try {
                $completed = $todo->COMPLETED->getDateTime()->format('c');
            } catch (\Throwable $e) {
                $completed = null;
            }
        }
        $priority = isset($todo->PRIORITY) ? (int) (string) $todo->PRIORITY : 0;
        $percent = isset($todo->{'PERCENT-COMPLETE'}) ? (int) (string) $todo->{'PERCENT-COMPLETE'} : 0;
        $uid = isset($todo->UID) ? trim((string) $todo->UID) : '';
        $out = [
            'uid'         => $this->utf8($uid),
            'parentUid'   => $this->parseParentUid($todo),
            'summary'     => $this->utf8(isset($todo->SUMMARY) ? (string) $todo->SUMMARY : ''),
            'description' => $this->utf8(isset($todo->DESCRIPTION) ? (string) $todo->DESCRIPTION : ''),
            'status'      => $status,
            'due'         => $due,
            'priority'    => max(0, min(9, $priority)),
            'percent'     => max(0, min(100, $percent)),
            'completed'   => $completed,
        ];
        $vcal->destroy();

        return $out;
    }

    /**
     * Parent link: RELATED-TO with RELTYPE=PARENT (RFC 5545 default RELTYPE is PARENT).
     * Used by Apple Reminders and other CalDAV clients for subtasks.
     *
     * @param mixed $todo VTODO component
     */
    private function parseParentUid($todo): ?string {
        if (!is_object($todo) || !method_exists($todo, 'select')) {
            return null;
        }
        foreach ($todo->select('RELATED-TO') as $rel) {
            $reltype = 'PARENT';
            if (isset($rel['RELTYPE'])) {
                $reltype = strtoupper(trim((string) $rel['RELTYPE']));
                if ($reltype === '') {
                    $reltype = 'PARENT';
                }
            }
            if ($reltype !== 'PARENT') {
                continue;
            }
            $val = trim((string) $rel);
            if ($val !== '') {
                return $this->utf8($val);
            }
        }

        return null;
    }

    /**
     * @param mixed                $todo   VTODO component
     * @param array<string, mixed> $fields
     */
    private function applyParentRelation($todo, array $fields, int $calId, ?string $selfUid, bool $isCreate): void {
        if (!$isCreate && !array_key_exists('parentUid', $fields)) {
            return;
        }
        $parentUid = '';
        if (array_key_exists('parentUid', $fields) && $fields['parentUid'] !== null) {
            $parentUid = trim((string) $fields['parentUid']);
        }
        $this->clearParentRelatedTo($todo);
        if ($parentUid === '') {
            return;
        }
        if ($selfUid !== null && $selfUid !== '' && strcasecmp($parentUid, $selfUid) === 0) {
            throw new ApiException('A task cannot be its own parent', 400);
        }
        if (!$this->todoUidExistsOnCalendar($calId, $parentUid)) {
            throw new ApiException('Parent task not found on this calendar', 400);
        }
        if ($selfUid !== null && $selfUid !== '' && $this->wouldCreateCycle($calId, $selfUid, $parentUid)) {
            throw new ApiException('Cannot set parent: would create a cycle', 400);
        }
        $todo->add('RELATED-TO', $parentUid, ['RELTYPE' => 'PARENT']);
    }

    /**
     * @param mixed $todo VTODO component
     */
    private function clearParentRelatedTo($todo): void {
        if (!is_object($todo) || !method_exists($todo, 'select')) {
            return;
        }
        foreach ($todo->select('RELATED-TO') as $rel) {
            $reltype = 'PARENT';
            if (isset($rel['RELTYPE'])) {
                $reltype = strtoupper(trim((string) $rel['RELTYPE']));
                if ($reltype === '') {
                    $reltype = 'PARENT';
                }
            }
            if ($reltype === 'PARENT') {
                $todo->remove($rel);
            }
        }
    }

    private function todoUidExistsOnCalendar(int $calId, string $uid): bool {
        $stmt = $this->pdo->prepare(
            "SELECT 1 FROM calendarobjects
             WHERE calendarid = ? AND uid = ? AND UPPER(componenttype) = 'VTODO'
             LIMIT 1"
        );
        $stmt->execute([$calId, $uid]);

        return (bool) $stmt->fetchColumn();
    }

    private function parentUidForTodoOnCalendar(int $calId, string $uid): ?string {
        $stmt = $this->pdo->prepare(
            "SELECT calendardata FROM calendarobjects
             WHERE calendarid = ? AND uid = ? AND UPPER(componenttype) = 'VTODO'
             LIMIT 1"
        );
        $stmt->execute([$calId, $uid]);
        $data = $stmt->fetchColumn();
        if (!is_string($data) && !is_resource($data)) {
            return null;
        }
        $parsed = $this->parseTodo($this->calendardataToString($data));
        $p = $parsed['parentUid'] ?? null;

        return is_string($p) && $p !== '' ? $p : null;
    }

    private function wouldCreateCycle(int $calId, string $selfUid, string $newParentUid): bool {
        $seen = [];
        $cur = $newParentUid;
        for ($i = 0; $i < 64; ++$i) {
            if ($cur === '' || $cur === null) {
                return false;
            }
            if (strcasecmp($cur, $selfUid) === 0) {
                return true;
            }
            $key = strtolower($cur);
            if (isset($seen[$key])) {
                return true;
            }
            $seen[$key] = true;
            $next = $this->parentUidForTodoOnCalendar($calId, $cur);
            if ($next === null || $next === '') {
                return false;
            }
            $cur = $next;
        }

        return true;
    }

    /**
     * When a parent task is deleted, clear RELATED-TO on children so they become top-level.
     */
    private function detachChildren(int $calId, int $instanceId, string $parentUid): void {
        $stmt = $this->pdo->prepare(
            "SELECT uri, calendardata FROM calendarobjects
             WHERE calendarid = ? AND UPPER(componenttype) = 'VTODO'"
        );
        $stmt->execute([$calId]);
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $data = $this->calendardataToString($row['calendardata'] ?? '');
            $parsed = $this->parseTodo($data);
            $p = $parsed['parentUid'] ?? null;
            if (!is_string($p) || strcasecmp($p, $parentUid) !== 0) {
                continue;
            }
            try {
                $vcal = Reader::read($data, Reader::OPTION_FORGIVING);
            } catch (\Throwable $e) {
                continue;
            }
            if (!$vcal instanceof VCalendar) {
                continue;
            }
            $todo = null;
            foreach ($vcal->getComponents() as $c) {
                if (strtoupper($c->name) === 'VTODO') {
                    $todo = $c;
                    break;
                }
            }
            if ($todo === null) {
                $vcal->destroy();
                continue;
            }
            $this->clearParentRelatedTo($todo);
            $todo->DTSTAMP = new \DateTime('now', new \DateTimeZone('UTC'));
            $serialized = $vcal->serialize();
            $vcal->destroy();
            try {
                $this->backend->updateCalendarObject([$calId, $instanceId], (string) $row['uri'], $serialized);
            } catch (\Throwable $e) {
                // best-effort; parent delete still proceeds
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function parseJournal(string $data): array {
        $empty = [
            'summary'     => '',
            'description' => '',
            'dtstart'     => null,
        ];
        if (trim($data) === '') {
            return $empty;
        }
        try {
            $vcal = Reader::read($data, Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            return $empty;
        }
        $journal = null;
        foreach ($vcal->getComponents() as $c) {
            if (strtoupper($c->name) === 'VJOURNAL') {
                $journal = $c;
                break;
            }
        }
        if ($journal === null) {
            $vcal->destroy();

            return $empty;
        }
        $dtstart = null;
        if (isset($journal->DTSTART)) {
            try {
                $dtstart = $journal->DTSTART->getDateTime()->format('c');
            } catch (\Throwable $e) {
                $dtstart = null;
            }
        }
        $out = [
            'summary'     => $this->utf8(isset($journal->SUMMARY) ? (string) $journal->SUMMARY : ''),
            'description' => $this->utf8(isset($journal->DESCRIPTION) ? (string) $journal->DESCRIPTION : ''),
            'dtstart'     => $dtstart,
        ];
        $vcal->destroy();

        return $out;
    }

    /**
     * @param array<string, mixed> $fields
     */
    private function applyTodoFields($todo, array $fields, bool $isCreate): void {
        if ($isCreate || array_key_exists('status', $fields)) {
            $status = strtoupper(trim((string) ($fields['status'] ?? 'NEEDS-ACTION')));
            $allowed = ['NEEDS-ACTION', 'IN-PROCESS', 'COMPLETED', 'CANCELLED'];
            if (!in_array($status, $allowed, true)) {
                $status = 'NEEDS-ACTION';
            }
            $todo->STATUS = $status;
            if ($status === 'COMPLETED') {
                if (!isset($todo->COMPLETED)) {
                    $todo->COMPLETED = new \DateTime('now', new \DateTimeZone('UTC'));
                }
                if (!isset($todo->{'PERCENT-COMPLETE'})) {
                    $todo->{'PERCENT-COMPLETE'} = 100;
                }
            } elseif (isset($todo->COMPLETED) && $status !== 'COMPLETED') {
                unset($todo->COMPLETED);
            }
        }
        if ($isCreate || array_key_exists('due', $fields)) {
            $dueRaw = $fields['due'] ?? null;
            unset($todo->DUE);
            if (is_string($dueRaw) && trim($dueRaw) !== '') {
                try {
                    $dt = new \DateTime(trim($dueRaw));
                    $todo->DUE = $dt;
                } catch (\Throwable $e) {
                    throw new ApiException('Invalid due date', 400);
                }
            }
        }
        if ($isCreate || array_key_exists('priority', $fields)) {
            $p = (int) ($fields['priority'] ?? 0);
            $p = max(0, min(9, $p));
            if ($p === 0) {
                unset($todo->PRIORITY);
            } else {
                $todo->PRIORITY = $p;
            }
        }
        if ($isCreate || array_key_exists('percent', $fields)) {
            $pct = (int) ($fields['percent'] ?? 0);
            $pct = max(0, min(100, $pct));
            if ($pct === 0 && !isset($fields['status'])) {
                unset($todo->{'PERCENT-COMPLETE'});
            } else {
                $todo->{'PERCENT-COMPLETE'} = $pct;
            }
        }
    }

    /**
     * @param array<string, mixed> $fields
     */
    private function applyJournalFields($journal, array $fields, bool $isCreate): void {
        if ($isCreate || array_key_exists('dtstart', $fields)) {
            $raw = $fields['dtstart'] ?? null;
            unset($journal->DTSTART);
            if (is_string($raw) && trim($raw) !== '') {
                try {
                    $journal->DTSTART = new \DateTime(trim($raw));
                } catch (\Throwable $e) {
                    throw new ApiException('Invalid note date', 400);
                }
            } elseif ($isCreate) {
                $journal->DTSTART = new \DateTime('now', new \DateTimeZone('UTC'));
            }
        } elseif ($isCreate && !isset($journal->DTSTART)) {
            $journal->DTSTART = new \DateTime('now', new \DateTimeZone('UTC'));
        }
    }

    /**
     * @param list<array<string, mixed>> $items
     */
    private function sortItems(array &$items, string $kind, string $sort, string $order): void {
        $order = strtolower($order) === 'desc' ? 'desc' : 'asc';
        $sort = strtolower(trim($sort));
        $allowedTask = ['summary', 'status', 'due', 'priority', 'percent', 'calendar', 'lastmodified'];
        $allowedNote = ['summary', 'dtstart', 'calendar', 'lastmodified'];
        $allowed = $kind === self::KIND_TASK ? $allowedTask : $allowedNote;
        if (!in_array($sort, $allowed, true)) {
            $sort = $kind === self::KIND_TASK ? 'due' : 'dtstart';
        }
        usort($items, static function ($a, $b) use ($sort, $order) {
            $av = $a[$sort] ?? null;
            $bv = $b[$sort] ?? null;
            if ($sort === 'calendar') {
                $av = $a['calendarName'] ?? '';
                $bv = $b['calendarName'] ?? '';
            }
            if ($av === null || $av === '') {
                $av = $order === 'asc' ? '~~~~' : '';
            }
            if ($bv === null || $bv === '') {
                $bv = $order === 'asc' ? '~~~~' : '';
            }
            if (is_numeric($av) && is_numeric($bv)) {
                $cmp = $av <=> $bv;
            } else {
                $cmp = strcasecmp((string) $av, (string) $bv);
            }

            return $order === 'desc' ? -$cmp : $cmp;
        });
    }

    /**
     * @param array<string, mixed> $item
     */
    private function matchesQuery(array $item, string $q): bool {
        $hay = mb_strtolower(implode(' ', [
            (string) ($item['summary'] ?? ''),
            (string) ($item['description'] ?? ''),
            (string) ($item['calendarName'] ?? ''),
            (string) ($item['status'] ?? ''),
        ]));

        return str_contains($hay, $q);
    }

    /**
     * @param mixed $data
     */
    private function calendardataToString($data): string {
        if (is_resource($data)) {
            $s = stream_get_contents($data);

            return is_string($s) ? $s : '';
        }

        return is_string($data) ? $data : '';
    }

    private function normalizeObjectUri(string $uri): string {
        $uri = rawurldecode(trim($uri));
        $uri = ltrim($uri, '/');
        if ($uri === '' || str_contains($uri, '..') || str_contains($uri, '/')) {
            throw new ApiException('Invalid object URI', 400);
        }

        return $uri;
    }

    private function objectUriFromUid(string $uid): string {
        $safe = preg_replace('/[^A-Za-z0-9_.@-]+/', '-', $uid) ?? '';
        $safe = trim($safe, '-.');
        if ($safe === '') {
            $safe = UUIDUtil::getUUID();
        }
        if (strlen($safe) > 180) {
            $safe = substr($safe, 0, 180);
        }

        return $safe . '.ics';
    }

    private function utf8(string $s): string {
        if ($s === '' || mb_check_encoding($s, 'UTF-8')) {
            return preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', '', $s) ?? $s;
        }
        $clean = @iconv('UTF-8', 'UTF-8//IGNORE', $s);
        if (!is_string($clean)) {
            $clean = mb_convert_encoding($s, 'UTF-8', 'ISO-8859-1');
        }

        return is_string($clean) ? (preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f]/', '', $clean) ?? $clean) : '';
    }
}
