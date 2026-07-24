<?php

namespace Baikal\Portal;

use Sabre\CalDAV\Backend\PDO as CaldavBackend;
use Sabre\DAV\PropPatch;
use Sabre\DAV\Sharing\Plugin as SharingPlugin;
use Sabre\DAV\UUIDUtil;
use Sabre\DAV\Xml\Element\Sharee;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\Reader;

/**
 * Calendar listing and sharing via sabre/dav CalDAV backend.
 */
class ShareService {
    /** Soft cap on VEVENT/VTODO/VJOURNAL components per import request */
    private const MAX_IMPORT_COMPONENTS = 10000;

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
    public function listCalendars(string $username): array {
        $principal = 'principals/' . $username;
        $raw = $this->backend->getCalendarsForUser($principal);
        $out = [];

        foreach ($raw as $cal) {
            $id = $cal['id'] ?? null;
            if (!is_array($id) || count($id) < 2) {
                continue;
            }
            $access = (int) ($cal['share-access'] ?? SharingPlugin::ACCESS_NOTSHARED);
            $isOwner = $access === SharingPlugin::ACCESS_SHAREDOWNER
                || $access === SharingPlugin::ACCESS_NOTSHARED;
            $instanceId = (int) $id[1];
            $flags = $this->meta->get($instanceId);

            $out[] = [
                'id'               => $instanceId, // instance id (unique per principal view)
                'calendarId'       => (int) $id[0],
                'instanceId'       => $instanceId,
                'uri'              => (string) ($cal['uri'] ?? ''),
                'displayname'      => (string) ($cal['{DAV:}displayname'] ?? $cal['uri'] ?? 'Calendar'),
                'description'      => (string) ($cal['{urn:ietf:params:xml:ns:caldav}calendar-description'] ?? ''),
                'color'            => (string) ($cal['{http://apple.com/ns/ical/}calendar-color'] ?? ''),
                'access'           => $this->accessLabel($access),
                'accessCode'       => $access,
                'canShare'         => $isOwner,
                'components'       => (string) ($cal['components'] ?? ''),
                'readOnly'         => $flags['readOnly'],
                'holidaysCountry'  => $flags['holidaysCountry'],
            ];
        }

        usort($out, static function ($a, $b) {
            return strcasecmp($a['displayname'], $b['displayname']);
        });

        return $out;
    }

    /**
     * Create a calendar owned by the user.
     *
     * @param array{
     *   displayname?: string,
     *   description?: string,
     *   color?: string,
     *   readOnly?: bool,
     *   holidays?: bool,
     *   holidayCountry?: string
     * } $fields
     *
     * @return array<string, mixed>
     */
    public function createCalendar(string $username, array $fields): array {
        $holidays = !empty($fields['holidays']);
        $holidayCountry = strtoupper(trim((string) ($fields['holidayCountry'] ?? '')));
        $readOnly = !empty($fields['readOnly']);

        if ($holidays) {
            if ($holidayCountry === '' || !preg_match('/^[A-Z]{2}$/', $holidayCountry)) {
                throw new ApiException('Select a country for the holidays calendar', 400);
            }
            if (!Holidays::isValidCountryCode($holidayCountry)) {
                throw new ApiException('Unknown country code: ' . $holidayCountry, 400);
            }
        }

        $displayname = trim((string) ($fields['displayname'] ?? ''));
        if ($displayname === '' && $holidays) {
            $displayname = 'Holidays (' . $holidayCountry . ')';
        }
        if ($displayname === '') {
            throw new ApiException('Display name is required', 400);
        }
        $description = trim((string) ($fields['description'] ?? ''));
        if ($holidays && $description === '') {
            $description = 'Public holidays for ' . $holidayCountry . ' (this year and next).';
        }
        $color = $this->normalizeColor(isset($fields['color']) ? (string) $fields['color'] : ($holidays ? '#DC2626' : ''));

        $uri = $this->uniqueCalendarUri($username, $displayname);
        $properties = [
            '{DAV:}displayname' => $displayname,
            '{urn:ietf:params:xml:ns:caldav}calendar-description' => $description,
        ];
        if ($color !== '') {
            $properties['{http://apple.com/ns/ical/}calendar-color'] = $color;
        }
        // Respect system Tasks/Notes flags for supported components (CalDAV clients)
        $compList = \Baikal\Core\Tools::defaultCalendarComponents();
        $properties['{urn:ietf:params:xml:ns:caldav}supported-calendar-component-set'] =
            new \Sabre\CalDAV\Xml\Property\SupportedCalendarComponentSet(
                array_values(array_filter(explode(',', $compList)))
            );

        $ids = $this->backend->createCalendar('principals/' . $username, $uri, $properties);
        $instanceId = is_array($ids) ? (int) $ids[1] : 0;

        $this->meta->set($instanceId, [
            'readOnly'        => $readOnly,
            'holidaysCountry' => $holidays ? $holidayCountry : null,
        ]);

        $holidayImport = null;
        if ($holidays) {
            $ics = Holidays::buildIcs($holidayCountry, $displayname);
            // Bypass read-only for the initial seed import
            $holidayImport = $this->importCalendar($username, $instanceId, $ics, true);
        }

        foreach ($this->listCalendars($username) as $cal) {
            if ((int) $cal['id'] === $instanceId) {
                if ($holidayImport !== null) {
                    $cal['holidayImport'] = $holidayImport;
                }

                return $cal;
            }
        }

        return [
            'id'              => $instanceId,
            'calendarId'      => is_array($ids) ? (int) $ids[0] : 0,
            'instanceId'      => $instanceId,
            'uri'             => $uri,
            'displayname'     => $displayname,
            'description'     => $description,
            'color'           => $color,
            'access'          => 'owner',
            'accessCode'      => SharingPlugin::ACCESS_SHAREDOWNER,
            'canShare'        => true,
            'components'      => \Baikal\Core\Tools::defaultCalendarComponents(),
            'readOnly'        => $readOnly,
            'holidaysCountry' => $holidays ? $holidayCountry : null,
            'holidayImport'   => $holidayImport,
        ];
    }

    /**
     * Update display name, description, and/or color on an owned calendar.
     *
     * @param array{displayname?: string, description?: string, color?: string} $fields
     *
     * @return array<string, mixed>
     */
    public function updateCalendar(string $username, int $instanceId, array $fields): array {
        $calId = $this->requireOwnedCalendarId($username, $instanceId);
        $mutations = [];

        if (array_key_exists('displayname', $fields)) {
            $name = trim((string) $fields['displayname']);
            if ($name === '') {
                throw new ApiException('Display name cannot be empty', 400);
            }
            if (mb_strlen($name) > 200) {
                throw new ApiException('Display name is too long (max 200)', 400);
            }
            $mutations['{DAV:}displayname'] = $name;
        }

        if (array_key_exists('description', $fields)) {
            $desc = trim((string) $fields['description']);
            if (mb_strlen($desc) > 2000) {
                throw new ApiException('Description is too long (max 2000)', 400);
            }
            $mutations['{urn:ietf:params:xml:ns:caldav}calendar-description'] = $desc;
        }

        if (array_key_exists('color', $fields)) {
            $mutations['{http://apple.com/ns/ical/}calendar-color'] = $this->normalizeColor((string) $fields['color']);
        }

        if ($mutations === []) {
            throw new ApiException('No fields to update (displayname, description, color)', 400);
        }

        $propPatch = new PropPatch($mutations);
        $this->backend->updateCalendar($calId, $propPatch);
        if (!$propPatch->commit()) {
            throw new ApiException('Failed to update calendar properties', 500);
        }

        foreach ($this->listCalendars($username) as $cal) {
            if ((int) $cal['id'] === $instanceId) {
                return $cal;
            }
        }

        throw new ApiException('Calendar updated but could not be reloaded', 500);
    }

    /**
     * Permanently delete an owned calendar (and all objects / share instances).
     */
    public function deleteCalendar(string $username, int $instanceId): void {
        $calId = $this->requireOwnedCalendarId($username, $instanceId);
        // sabre only fully wipes when access is SHAREDOWNER; NOTSHARED would orphan data
        $stmt = $this->pdo->prepare('SELECT access FROM calendarinstances WHERE id = ?');
        $stmt->execute([$instanceId]);
        $access = (int) $stmt->fetchColumn();
        if ($access === SharingPlugin::ACCESS_NOTSHARED) {
            $upd = $this->pdo->prepare('UPDATE calendarinstances SET access = ? WHERE id = ?');
            $upd->execute([SharingPlugin::ACCESS_SHAREDOWNER, $instanceId]);
        }
        $this->backend->deleteCalendar($calId);
        $this->meta->remove($instanceId);
    }

    /**
     * List VEVENT occurrences in [from, to] (inclusive, YYYY-MM-DD) for month view.
     * Expands RRULE within the range. Caps at 500 events.
     *
     * @return list<array{uid: string, uri: string, summary: string, start: string, end: string|null, allDay: bool}>
     */
    public function listEvents(string $username, int $instanceId, string $from, string $to): array {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            throw new ApiException('from and to must be YYYY-MM-DD', 400);
        }
        try {
            $start = new \DateTimeImmutable($from . ' 00:00:00', new \DateTimeZone('UTC'));
            $end = new \DateTimeImmutable($to . ' 23:59:59', new \DateTimeZone('UTC'));
        } catch (\Throwable $e) {
            throw new ApiException('Invalid date range', 400);
        }
        if ($end < $start) {
            throw new ApiException('to must be on or after from', 400);
        }
        if ($end->getTimestamp() - $start->getTimestamp() > 100 * 86400) {
            throw new ApiException('Date range too large (max ~3 months)', 400);
        }

        $calId = $this->requireCalendarAccess($username, $instanceId, false);
        $calendarPk = (int) $calId[0];
        $fromTs = $start->getTimestamp();
        $toTs = $end->getTimestamp();

        $stmt = $this->pdo->prepare(
            'SELECT uri, calendardata, uid
             FROM calendarobjects
             WHERE calendarid = ?
               AND UPPER(componenttype) = ?
               AND (firstoccurence IS NULL OR firstoccurence <= ?)
               AND (lastoccurence IS NULL OR lastoccurence >= ?)'
        );
        $stmt->execute([$calendarPk, 'VEVENT', $toTs, $fromTs]);

        $events = [];
        $max = 500;
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if (count($events) >= $max) {
                break;
            }
            $data = $row['calendardata'] ?? '';
            if (is_resource($data)) {
                $data = stream_get_contents($data);
            }
            if (!is_string($data) || trim($data) === '') {
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
            $uri = (string) ($row['uri'] ?? '');
            $fallbackUid = (string) ($row['uid'] ?? '');
            try {
                $expanded = $vcal->expand(
                    new \DateTime($from . ' 00:00:00', new \DateTimeZone('UTC')),
                    new \DateTime($to . ' 23:59:59', new \DateTimeZone('UTC'))
                );
            } catch (\Throwable $e) {
                $expanded = $vcal;
            }
            foreach ($expanded->getComponents() as $comp) {
                if (strtoupper($comp->name) !== 'VEVENT') {
                    continue;
                }
                if (count($events) >= $max) {
                    break 2;
                }
                if (!isset($comp->DTSTART)) {
                    continue;
                }
                try {
                    $dtStart = $comp->DTSTART;
                    $allDay = !$dtStart->hasTime();
                    $startDt = $dtStart->getDateTime();
                    $startStr = $allDay ? $startDt->format('Y-m-d') : $startDt->format('c');
                    $endStr = null;
                    if (isset($comp->DTEND)) {
                        $endDt = $comp->DTEND->getDateTime();
                        if ($allDay || !$comp->DTEND->hasTime()) {
                            // Exclusive DTEND → inclusive last day for the month grid
                            $inclusive = new \DateTime($endDt->format('Y-m-d') . ' 00:00:00', new \DateTimeZone('UTC'));
                            if ($inclusive > $startDt) {
                                $inclusive->modify('-1 day');
                            }
                            $endStr = $inclusive->format('Y-m-d');
                        } else {
                            $endStr = $endDt->format('c');
                        }
                    } elseif (isset($comp->DURATION) && !$allDay) {
                        try {
                            $endDt = clone $startDt;
                            $endDt->add($comp->DURATION->getDateInterval());
                            $endStr = $endDt->format('c');
                        } catch (\Throwable $e) {
                            $endStr = null;
                        }
                    }
                    $summary = isset($comp->SUMMARY) ? trim((string) $comp->SUMMARY) : '';
                    $uid = isset($comp->UID) ? trim((string) $comp->UID) : $fallbackUid;
                    $events[] = [
                        'uid'     => $uid,
                        'uri'     => $uri,
                        'summary' => $summary !== '' ? $summary : '(No title)',
                        'start'   => $startStr,
                        'end'     => $endStr,
                        'allDay'  => $allDay,
                    ];
                } catch (\Throwable $e) {
                    continue;
                }
            }
            $vcal->destroy();
        }

        usort($events, static function ($a, $b) {
            return strcmp((string) $a['start'], (string) $b['start']);
        });

        return $events;
    }

    /**
     * Full VEVENT detail for the portal edit modal.
     *
     * @return array<string, mixed>
     */
    public function getEvent(string $username, int $instanceId, string $uri): array {
        $calId = $this->requireCalendarAccess($username, $instanceId, false);
        $uri = $this->normalizeObjectUri($uri);
        $obj = $this->backend->getCalendarObject($calId, $uri);
        if (!$obj || empty($obj['calendardata'])) {
            throw new ApiException('Event not found', 404);
        }
        $comp = strtoupper((string) ($obj['component'] ?? $obj['componenttype'] ?? ''));
        if ($comp !== '' && $comp !== 'VEVENT') {
            throw new ApiException('Object is not a VEVENT', 404);
        }
        $data = $this->calendardataToString($obj['calendardata']);
        $parsed = $this->parseEvent($data);
        $meta = $this->getCalendarMeta($username, $instanceId);
        $row = $this->loadInstance($username, $instanceId);
        $access = (int) $row['access'];
        $canWriteAccess = $access === SharingPlugin::ACCESS_SHAREDOWNER
            || $access === SharingPlugin::ACCESS_NOTSHARED
            || $access === SharingPlugin::ACCESS_READWRITE;
        $readOnly = $this->meta->isReadOnly($instanceId) || !$canWriteAccess;

        return array_merge($parsed, [
            'uri'          => $uri,
            'instanceId'   => $instanceId,
            'calendarId'   => (int) $calId[0],
            'calendarName' => $meta['displayname'],
            'calendarUri'  => $meta['uri'],
            'readOnly'     => $readOnly,
            'canWrite'     => !$readOnly,
        ]);
    }

    /**
     * Create a new VEVENT on a writable calendar.
     *
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function createEvent(string $username, int $instanceId, array $fields): array {
        $calId = $this->requireCalendarAccess($username, $instanceId, true);
        if ($this->meta->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only', 403);
        }
        $summary = mb_substr(trim((string) ($fields['summary'] ?? '')), 0, 500);
        if ($summary === '') {
            throw new ApiException('Title is required', 400);
        }

        $uid = UUIDUtil::getUUID();
        $uri = $this->objectUriFromUid($uid);
        $vcal = new VCalendar();
        $vcal->PRODID = '-//Baikal Portal//EN';
        $vcal->VERSION = '2.0';
        $event = $vcal->add('VEVENT', [
            'UID'     => $uid,
            'DTSTAMP' => new \DateTime('now', new \DateTimeZone('UTC')),
            'SUMMARY' => $summary,
        ]);
        // Defaults if client omitted dates (single all-day today)
        if (!array_key_exists('start', $fields) || $fields['start'] === null || $fields['start'] === '') {
            $fields['start'] = (new \DateTime('today', new \DateTimeZone('UTC')))->format('Y-m-d');
            $fields['allDay'] = true;
        }
        if (!array_key_exists('allDay', $fields)) {
            $fields['allDay'] = is_string($fields['start'] ?? null)
                && preg_match('/^\d{4}-\d{2}-\d{2}$/', trim((string) $fields['start']));
        }
        $this->applyEventFields($event, $fields);
        if (!isset($event->DTSTART)) {
            throw new ApiException('Start date/time is required', 400);
        }
        $serialized = $vcal->serialize();
        $vcal->destroy();
        $this->backend->createCalendarObject($calId, $uri, $serialized);

        return $this->getEvent($username, $instanceId, $uri);
    }

    /**
     * Update VEVENT fields; optional move to another writable calendar via instanceId.
     *
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function updateEvent(string $username, int $instanceId, string $uri, array $fields): array {
        $sourceCalId = $this->requireCalendarAccess($username, $instanceId, true);
        if ($this->meta->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only', 403);
        }
        $uri = $this->normalizeObjectUri($uri);
        $obj = $this->backend->getCalendarObject($sourceCalId, $uri);
        if (!$obj || empty($obj['calendardata'])) {
            throw new ApiException('Event not found', 404);
        }

        try {
            $vcal = Reader::read($this->calendardataToString($obj['calendardata']), Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            throw new ApiException('Invalid calendar data for this event', 500);
        }
        if (!$vcal instanceof VCalendar) {
            throw new ApiException('Invalid calendar object', 500);
        }
        $event = null;
        foreach ($vcal->getComponents() as $c) {
            if (strtoupper($c->name) === 'VEVENT') {
                $event = $c;
                break;
            }
        }
        if ($event === null) {
            $vcal->destroy();
            throw new ApiException('Object is not a VEVENT', 404);
        }

        $this->applyEventFields($event, $fields);
        $event->DTSTAMP = new \DateTime('now', new \DateTimeZone('UTC'));
        if (!isset($event->UID) || trim((string) $event->UID) === '') {
            $event->UID = UUIDUtil::getUUID();
        }

        $serialized = $vcal->serialize();
        $vcal->destroy();

        $targetInstanceId = $instanceId;
        if (array_key_exists('instanceId', $fields)) {
            $targetInstanceId = (int) $fields['instanceId'];
            if ($targetInstanceId <= 0) {
                throw new ApiException('Invalid target calendar', 400);
            }
        }

        if ($targetInstanceId === $instanceId) {
            $this->backend->updateCalendarObject($sourceCalId, $uri, $serialized);

            return $this->getEvent($username, $instanceId, $uri);
        }

        // Move to another calendar
        $targetCalId = $this->requireCalendarAccess($username, $targetInstanceId, true);
        if ($this->meta->isReadOnly($targetInstanceId)) {
            throw new ApiException('Target calendar is marked read-only', 403);
        }
        $newUri = $uri;
        $existing = $this->backend->getCalendarObject($targetCalId, $newUri);
        if ($existing) {
            $uid = '';
            try {
                $tmp = Reader::read($serialized, Reader::OPTION_FORGIVING);
                if ($tmp instanceof VCalendar && isset($tmp->VEVENT->UID)) {
                    $uid = trim((string) $tmp->VEVENT->UID);
                }
                if ($tmp) {
                    $tmp->destroy();
                }
            } catch (\Throwable $e) {
                $uid = '';
            }
            $newUri = $this->objectUriFromUid($uid !== '' ? $uid : UUIDUtil::getUUID());
        }
        $this->backend->createCalendarObject($targetCalId, $newUri, $serialized);
        $this->backend->deleteCalendarObject($sourceCalId, $uri);

        return $this->getEvent($username, $targetInstanceId, $newUri);
    }

    public function deleteEvent(string $username, int $instanceId, string $uri): void {
        $calId = $this->requireCalendarAccess($username, $instanceId, true);
        if ($this->meta->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only', 403);
        }
        $uri = $this->normalizeObjectUri($uri);
        $obj = $this->backend->getCalendarObject($calId, $uri);
        if (!$obj) {
            throw new ApiException('Event not found', 404);
        }
        $comp = strtoupper((string) ($obj['component'] ?? $obj['componenttype'] ?? ''));
        if ($comp !== '' && $comp !== 'VEVENT') {
            throw new ApiException('Object is not a VEVENT', 404);
        }
        $this->backend->deleteCalendarObject($calId, $uri);
    }

    /**
     * @return array<string, mixed>
     */
    private function parseEvent(string $data): array {
        $empty = [
            'uid'         => '',
            'summary'     => '',
            'description' => '',
            'location'    => '',
            'start'       => null,
            'end'         => null,
            'allDay'      => false,
            'hasRrule'    => false,
            'repeat'      => [
                'freq'     => '',
                'interval' => 1,
                'until'    => null,
                'count'    => null,
                'byDay'    => [],
            ],
        ];
        if (trim($data) === '') {
            return $empty;
        }
        try {
            $vcal = Reader::read($data, Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            return $empty;
        }
        $event = null;
        foreach ($vcal->getComponents() as $c) {
            if (strtoupper($c->name) === 'VEVENT') {
                $event = $c;
                break;
            }
        }
        if ($event === null) {
            $vcal->destroy();

            return $empty;
        }
        $allDay = false;
        $start = null;
        $end = null;
        if (isset($event->DTSTART)) {
            try {
                $allDay = !$event->DTSTART->hasTime();
                $startDt = $event->DTSTART->getDateTime();
                $start = $allDay ? $startDt->format('Y-m-d') : $startDt->format('c');
            } catch (\Throwable $e) {
                $start = null;
            }
        }
        if (isset($event->DTEND)) {
            try {
                $endDt = $event->DTEND->getDateTime();
                if ($allDay || !$event->DTEND->hasTime()) {
                    // iCal all-day DTEND is exclusive → expose inclusive last day to the UI
                    // (DateTimeImmutable::modify returns a new instance — always reassign)
                    $inclusive = new \DateTime($endDt->format('Y-m-d') . ' 00:00:00', new \DateTimeZone('UTC'));
                    if ($start !== null) {
                        $startDay = new \DateTime(substr($start, 0, 10) . ' 00:00:00', new \DateTimeZone('UTC'));
                        if ($inclusive > $startDay) {
                            $inclusive->modify('-1 day');
                        }
                    }
                    $end = $inclusive->format('Y-m-d');
                } else {
                    $end = $endDt->format('c');
                }
            } catch (\Throwable $e) {
                $end = null;
            }
        } elseif (isset($event->DURATION) && $start !== null && !$allDay) {
            try {
                $startDt = $event->DTSTART->getDateTime();
                $endDt = clone $startDt;
                $endDt->add($event->DURATION->getDateInterval());
                $end = $endDt->format('c');
            } catch (\Throwable $e) {
                $end = null;
            }
        }
        $repeat = $this->parseRrule(isset($event->RRULE) ? $event->RRULE : null);
        $out = [
            'uid'         => isset($event->UID) ? trim((string) $event->UID) : '',
            'summary'     => isset($event->SUMMARY) ? trim((string) $event->SUMMARY) : '',
            'description' => isset($event->DESCRIPTION) ? (string) $event->DESCRIPTION : '',
            'location'    => isset($event->LOCATION) ? trim((string) $event->LOCATION) : '',
            'start'       => $start,
            'end'         => $end,
            'allDay'      => $allDay,
            'hasRrule'    => $repeat['freq'] !== '',
            'repeat'      => $repeat,
        ];
        $vcal->destroy();

        return $out;
    }

    /**
     * @param mixed $rruleProperty
     *
     * @return array{freq: string, interval: int, until: string|null, count: int|null, byDay: list<string>}
     */
    private function parseRrule($rruleProperty): array {
        $empty = [
            'freq'     => '',
            'interval' => 1,
            'until'    => null,
            'count'    => null,
            'byDay'    => [],
        ];
        if ($rruleProperty === null) {
            return $empty;
        }
        try {
            $parts = is_object($rruleProperty) && method_exists($rruleProperty, 'getParts')
                ? $rruleProperty->getParts()
                : [];
            if (!is_array($parts) || $parts === []) {
                // Fallback parse "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE"
                $raw = trim((string) $rruleProperty);
                if ($raw === '') {
                    return $empty;
                }
                $parts = [];
                foreach (explode(';', $raw) as $seg) {
                    if (str_contains($seg, '=')) {
                        [$k, $v] = explode('=', $seg, 2);
                        $parts[strtoupper(trim($k))] = trim($v);
                    }
                }
            }
        } catch (\Throwable $e) {
            return $empty;
        }
        $freq = strtoupper((string) ($parts['FREQ'] ?? ''));
        $allowed = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        if (!in_array($freq, $allowed, true)) {
            return $empty;
        }
        $interval = max(1, min(99, (int) ($parts['INTERVAL'] ?? 1)));
        $until = null;
        if (!empty($parts['UNTIL'])) {
            $u = (string) $parts['UNTIL'];
            // YYYYMMDD or YYYYMMDDTHHMMSSZ
            if (preg_match('/^(\d{4})(\d{2})(\d{2})/', $u, $m)) {
                $until = $m[1] . '-' . $m[2] . '-' . $m[3];
            }
        }
        $count = null;
        if (isset($parts['COUNT']) && (int) $parts['COUNT'] > 0) {
            $count = min(999, (int) $parts['COUNT']);
        }
        $byDay = [];
        if (!empty($parts['BYDAY'])) {
            $rawDays = is_array($parts['BYDAY']) ? $parts['BYDAY'] : explode(',', (string) $parts['BYDAY']);
            $ok = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            foreach ($rawDays as $d) {
                $d = strtoupper(preg_replace('/[^A-Z]/', '', (string) $d) ?? '');
                if (in_array($d, $ok, true)) {
                    $byDay[] = $d;
                }
            }
        }

        return [
            'freq'     => $freq,
            'interval' => $interval,
            'until'    => $until,
            'count'    => $count,
            'byDay'    => array_values(array_unique($byDay)),
        ];
    }

    /**
     * @param array<string, mixed> $repeat
     */
    private function buildRruleString(array $repeat): ?string {
        $freq = strtoupper(trim((string) ($repeat['freq'] ?? '')));
        if ($freq === '' || $freq === 'NONE') {
            return null;
        }
        $allowed = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        if (!in_array($freq, $allowed, true)) {
            throw new ApiException('Invalid repeat frequency', 400);
        }
        $interval = max(1, min(99, (int) ($repeat['interval'] ?? 1)));
        $parts = ['FREQ=' . $freq];
        if ($interval !== 1) {
            $parts[] = 'INTERVAL=' . $interval;
        }
        $byDay = $repeat['byDay'] ?? $repeat['byday'] ?? [];
        if (is_array($byDay) && $byDay !== [] && $freq === 'WEEKLY') {
            $ok = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            $days = [];
            foreach ($byDay as $d) {
                $d = strtoupper(trim((string) $d));
                if (in_array($d, $ok, true)) {
                    $days[] = $d;
                }
            }
            if ($days !== []) {
                $parts[] = 'BYDAY=' . implode(',', array_unique($days));
            }
        }
        $until = isset($repeat['until']) ? trim((string) $repeat['until']) : '';
        $count = isset($repeat['count']) ? (int) $repeat['count'] : 0;
        if ($until !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $until)) {
            $parts[] = 'UNTIL=' . str_replace('-', '', $until);
        } elseif ($count > 0) {
            $parts[] = 'COUNT=' . min(999, $count);
        }

        return implode(';', $parts);
    }

    /**
     * @param mixed                $event  VEVENT component
     * @param array<string, mixed> $fields
     */
    private function applyEventFields($event, array $fields): void {
        if (array_key_exists('summary', $fields)) {
            $summary = mb_substr(trim((string) $fields['summary']), 0, 500);
            if ($summary === '') {
                throw new ApiException('Title is required', 400);
            }
            $event->SUMMARY = $summary;
        }
        if (array_key_exists('description', $fields)) {
            $desc = mb_substr(trim((string) $fields['description']), 0, 20000);
            if ($desc === '') {
                unset($event->DESCRIPTION);
            } else {
                $event->DESCRIPTION = $desc;
            }
        }
        if (array_key_exists('location', $fields)) {
            $loc = mb_substr(trim((string) $fields['location']), 0, 500);
            if ($loc === '') {
                unset($event->LOCATION);
            } else {
                $event->LOCATION = $loc;
            }
        }

        if (array_key_exists('repeat', $fields)) {
            $rep = $fields['repeat'];
            unset($event->RRULE);
            if ($rep === null || $rep === '' || $rep === false) {
                // cleared
            } elseif (is_array($rep)) {
                $rule = $this->buildRruleString($rep);
                if ($rule !== null) {
                    $event->add('RRULE', $rule);
                }
            } elseif (is_string($rep) && trim($rep) !== '') {
                $event->add('RRULE', trim($rep));
            }
        }

        $touchStart = array_key_exists('start', $fields) || array_key_exists('allDay', $fields);
        $touchEnd = array_key_exists('end', $fields) || array_key_exists('allDay', $fields) || array_key_exists('start', $fields);
        if (!$touchStart && !$touchEnd) {
            return;
        }

        $allDay = array_key_exists('allDay', $fields)
            ? !empty($fields['allDay'])
            : (isset($event->DTSTART) && !$event->DTSTART->hasTime());

        if ($touchStart || array_key_exists('allDay', $fields)) {
            $startRaw = array_key_exists('start', $fields)
                ? $fields['start']
                : (isset($event->DTSTART) ? $event->DTSTART->getDateTime()->format('c') : null);
            if (!is_string($startRaw) || trim($startRaw) === '') {
                throw new ApiException('Start date/time is required', 400);
            }
            try {
                if ($allDay) {
                    $day = substr(trim($startRaw), 0, 10);
                    $dt = new \DateTime($day . ' 00:00:00', new \DateTimeZone('UTC'));
                    unset($event->DTSTART);
                    $event->DTSTART = $dt;
                    $event->DTSTART['VALUE'] = 'DATE';
                } else {
                    $raw = trim($startRaw);
                    // Date-only after all-day→timed conversion: start of that local day
                    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
                        $dt = new \DateTime($raw . ' 00:00:00', new \DateTimeZone(date_default_timezone_get() ?: 'UTC'));
                    } else {
                        $dt = new \DateTime($raw);
                    }
                    unset($event->DTSTART);
                    $event->DTSTART = $dt;
                }
            } catch (\Throwable $e) {
                throw new ApiException('Invalid start date/time', 400);
            }
        }

        if ($touchEnd || array_key_exists('allDay', $fields)) {
            unset($event->DURATION);
            $endRaw = array_key_exists('end', $fields) ? $fields['end'] : null;
            if ($endRaw === null || (is_string($endRaw) && trim($endRaw) === '')) {
                // All-day single-day: DTEND = start + 1 day (exclusive)
                if ($allDay && isset($event->DTSTART)) {
                    try {
                        $s = $event->DTSTART->getDateTime();
                        $dt = clone $s;
                        $dt->modify('+1 day');
                        $event->DTEND = $dt;
                        $event->DTEND['VALUE'] = 'DATE';
                    } catch (\Throwable $e) {
                        unset($event->DTEND);
                    }
                } else {
                    unset($event->DTEND);
                }
            } else {
                try {
                    if ($allDay) {
                        // UI sends inclusive last day → store exclusive DTEND (+1 day)
                        $day = substr(trim((string) $endRaw), 0, 10);
                        $dt = new \DateTime($day . ' 00:00:00', new \DateTimeZone('UTC'));
                        $dt->modify('+1 day');
                        if (isset($event->DTSTART)) {
                            $s = $event->DTSTART->getDateTime();
                            if ($dt <= $s) {
                                $dt = clone $s;
                                $dt->modify('+1 day');
                            }
                        }
                        $event->DTEND = $dt;
                        $event->DTEND['VALUE'] = 'DATE';
                    } else {
                        $raw = trim((string) $endRaw);
                        // Date-only payload after all-day→timed: treat as end-of-day local/UTC
                        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
                            $dt = new \DateTime($raw . ' 23:59:59', new \DateTimeZone(date_default_timezone_get() ?: 'UTC'));
                        } else {
                            $dt = new \DateTime($raw);
                        }
                        unset($event->DTEND);
                        $event->DTEND = $dt;
                        // Ensure timed multi-day still has end after start
                        if (isset($event->DTSTART)) {
                            $s = $event->DTSTART->getDateTime();
                            if ($dt <= $s) {
                                $fix = clone $s;
                                $fix->modify('+1 hour');
                                $event->DTEND = $fix;
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    throw new ApiException('Invalid end date/time', 400);
                }
            }
        }
    }

    private function normalizeObjectUri(string $uri): string {
        $uri = rawurldecode(trim($uri));
        $uri = ltrim($uri, '/');
        if ($uri === '' || str_contains($uri, '..') || str_contains($uri, '/')) {
            throw new ApiException('Invalid object URI', 400);
        }

        return $uri;
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

    /**
     * Export all objects in a calendar as a single .ics file.
     *
     * @return array{ics: string, filename: string, count: int}
     */
    public function exportCalendar(string $username, int $instanceId): array {
        $calId = $this->requireCalendarAccess($username, $instanceId, false);
        $meta = $this->getCalendarMeta($username, $instanceId);

        $objects = $this->backend->getCalendarObjects($calId);
        $uris = [];
        foreach ($objects as $obj) {
            if (!empty($obj['uri'])) {
                $uris[] = (string) $obj['uri'];
            }
        }

        $blobs = [];
        if ($uris !== []) {
            foreach ($this->backend->getMultipleCalendarObjects($calId, $uris) as $row) {
                if (!empty($row['calendardata'])) {
                    $blobs[(string) $row['uri']] = $row['calendardata'];
                }
            }
        }

        $calendar = new VCalendar();
        $calendar->VERSION = '2.0';
        $calendar->PRODID = '-//Baikal Portal//EN';
        $calendar->{'X-WR-CALNAME'} = $meta['displayname'];
        if ($meta['color'] !== '') {
            $calendar->{'X-APPLE-CALENDAR-COLOR'} = $meta['color'];
        }

        $collectedTimezones = [];
        $timezones = [];
        $components = [];
        $count = 0;

        foreach ($blobs as $inputObject) {
            try {
                $nodeComp = Reader::read($inputObject);
            } catch (\Throwable $e) {
                continue;
            }
            foreach ($nodeComp->children() as $child) {
                switch ($child->name) {
                    case 'VEVENT':
                    case 'VTODO':
                    case 'VJOURNAL':
                        $components[] = clone $child;
                        ++$count;
                        break;
                    case 'VTIMEZONE':
                        $tzid = (string) $child->TZID;
                        if ($tzid !== '' && !in_array($tzid, $collectedTimezones, true)) {
                            $timezones[] = clone $child;
                            $collectedTimezones[] = $tzid;
                        }
                        break;
                }
            }
            $nodeComp->destroy();
        }

        foreach ($timezones as $tz) {
            $calendar->add($tz);
        }
        foreach ($components as $comp) {
            $calendar->add($comp);
        }

        $safeName = preg_replace('/[^a-zA-Z0-9-_ ]/u', '', $meta['displayname']) ?: 'calendar';
        $safeName = trim(preg_replace('/\s+/', '-', $safeName) ?? 'calendar', '-');
        $filename = $safeName . '-' . date('Y-m-d') . '.ics';

        return [
            'ics'      => $calendar->serialize(),
            'filename' => $filename,
            'count'    => $count,
        ];
    }

    /**
     * Import events/tasks/notes from an .ics payload into a writable calendar.
     *
     * Optimized for large Thunderbird exports (thousands of components):
     * longer PHP time limit, one-shot existing-URI lookup, lean VTIMEZONE attach.
     *
     * Optional $onProgress(current, total, imported, updated, skipped) for streaming UIs.
     *
     * @param callable(int, int, int, int, int): void|null $onProgress
     *
     * @return array{imported: int, updated: int, skipped: int}
     */
    public function importCalendar(string $username, int $instanceId, string $icsData, bool $allowReadOnly = false, ?callable $onProgress = null): array {
        // Large .ics files (Thunderbird full export) exceed the default 30s easily.
        if (function_exists('set_time_limit')) {
            @set_time_limit(600);
        }
        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '256M');

        $calId = $this->requireCalendarAccess($username, $instanceId, true);
        if (!$allowReadOnly && $this->meta->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only. Import is disabled so events stay unchanged.', 403);
        }

        // Strip UTF-8 BOM (common from Windows / Thunderbird)
        if (strncmp($icsData, "\xEF\xBB\xBF", 3) === 0) {
            $icsData = substr($icsData, 3);
        }
        $icsData = trim($icsData);
        if ($icsData === '') {
            throw new ApiException('ICS data is empty', 400);
        }
        if (strlen($icsData) > 20 * 1024 * 1024) {
            throw new ApiException('ICS file is too large (max 20 MB)', 400);
        }

        try {
            $parsed = Reader::read($icsData, Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            throw new ApiException('Invalid ICS data: ' . $e->getMessage(), 400);
        }

        if ($parsed->name !== 'VCALENDAR') {
            // Single component without envelope — wrap
            if (in_array($parsed->name, ['VEVENT', 'VTODO', 'VJOURNAL'], true)) {
                $wrap = new VCalendar();
                $wrap->VERSION = '2.0';
                $wrap->add(clone $parsed);
                $parsed->destroy();
                $parsed = $wrap;
            } else {
                $name = $parsed->name;
                $parsed->destroy();
                throw new ApiException('ICS must be a VCALENDAR (got ' . $name . ')', 400);
            }
        }

        /** @var array<string, \Sabre\VObject\Component> $timezonesById */
        $timezonesById = [];
        $toImport = [];
        foreach ($parsed->getComponents() as $comp) {
            if ($comp->name === 'VTIMEZONE') {
                $tzid = isset($comp->TZID) ? (string) $comp->TZID : '';
                if ($tzid !== '' && !isset($timezonesById[$tzid])) {
                    $timezonesById[$tzid] = clone $comp;
                }
            } elseif (in_array($comp->name, ['VEVENT', 'VTODO', 'VJOURNAL'], true)) {
                $toImport[] = clone $comp;
            }
        }
        $parsed->destroy();

        if ($toImport === []) {
            throw new ApiException('No VEVENT, VTODO, or VJOURNAL components found in ICS', 400);
        }
        if (count($toImport) > self::MAX_IMPORT_COMPONENTS) {
            throw new ApiException('Too many components in import (max ' . self::MAX_IMPORT_COMPONENTS . '). Split the .ics file.', 400);
        }

        // Preload existing object URIs for this calendar (one query vs N)
        $existingUris = $this->listExistingObjectUris($calId);

        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $n = 0;
        $total = count($toImport);
        // ~100 UI updates max (not every component on huge files)
        $progressEvery = max(1, (int) min(25, max(1, (int) floor($total / 100))));

        if ($onProgress !== null) {
            $onProgress(0, $total, 0, 0, 0);
        }

        foreach ($toImport as $comp) {
            ++$n;
            // Keep the request alive on very large files
            if (($n % 50) === 0 && function_exists('set_time_limit')) {
                @set_time_limit(600);
            }

            $uid = isset($comp->UID) ? (string) $comp->UID : '';
            if ($uid === '') {
                $uid = UUIDUtil::getUUID();
                $comp->UID = $uid;
            }

            $uri = $this->objectUriFromUid($uid);

            try {
                $object = new VCalendar();
                $object->VERSION = '2.0';
                $object->PRODID = '-//Baikal Portal//EN';
                foreach ($this->referencedTimezoneIds($comp) as $tzid) {
                    if (isset($timezonesById[$tzid])) {
                        $object->add(clone $timezonesById[$tzid]);
                    }
                }
                $object->add($comp);
                $serialized = $object->serialize();
                $object->destroy();

                if (isset($existingUris[$uri])) {
                    $this->backend->updateCalendarObject($calId, $uri, $serialized);
                    ++$updated;
                } else {
                    $this->backend->createCalendarObject($calId, $uri, $serialized);
                    $existingUris[$uri] = true;
                    ++$imported;
                }
            } catch (\Throwable $e) {
                error_log('portal import object ' . $uri . ': ' . $e->getMessage());
                ++$skipped;
            }

            if ($onProgress !== null && ($n === $total || ($n % $progressEvery) === 0)) {
                $onProgress($n, $total, $imported, $updated, $skipped);
            }
        }

        foreach ($timezonesById as $tz) {
            $tz->destroy();
        }

        return [
            'imported' => $imported,
            'updated'  => $updated,
            'skipped'  => $skipped,
        ];
    }

    /**
     * @param array{0: int, 1: int} $calId
     *
     * @return array<string, true> map of existing object URIs
     */
    private function listExistingObjectUris(array $calId): array {
        list($calendarId) = $calId;
        $stmt = $this->pdo->prepare(
            'SELECT uri FROM calendarobjects WHERE calendarid = ?'
        );
        $stmt->execute([(int) $calendarId]);
        $map = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if (!empty($row['uri'])) {
                $map[(string) $row['uri']] = true;
            }
        }

        return $map;
    }

    /**
     * Collect TZID parameter values referenced by a component.
     *
     * @return list<string>
     */
    private function referencedTimezoneIds($comp): array {
        $ids = [];
        foreach ($comp->children() as $child) {
            if (!$child instanceof \Sabre\VObject\Property) {
                continue;
            }
            if (isset($child['TZID'])) {
                $ids[(string) $child['TZID']] = true;
            }
        }

        return array_keys($ids);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listShares(string $username, int $instanceId): array {
        $calId = $this->requireOwnedCalendarId($username, $instanceId);
        $invites = $this->backend->getInvites($calId);
        $out = [];

        foreach ($invites as $sharee) {
            $access = (int) $sharee->access;
            // Skip the owner row
            if ($access === SharingPlugin::ACCESS_SHAREDOWNER || $access === SharingPlugin::ACCESS_NOTSHARED) {
                continue;
            }
            $principal = (string) ($sharee->principal ?? '');
            $shareUsername = $this->usernameFromPrincipal($principal);
            $out[] = [
                'href'        => (string) $sharee->href,
                'principal'   => $principal,
                'username'    => $shareUsername,
                'displayname' => (string) ($sharee->properties['{DAV:}displayname'] ?? $shareUsername),
                'access'      => $this->accessLabel($access),
                'accessCode'  => $access,
                'status'      => (int) ($sharee->inviteStatus ?? 0),
            ];
        }

        return $out;
    }

    public function addOrUpdateShare(string $ownerUsername, int $instanceId, string $shareUsername, string $access): array {
        $shareUsername = trim($shareUsername);
        if ($shareUsername === '') {
            throw new ApiException('Share target username is required', 400);
        }
        if (strcasecmp($shareUsername, $ownerUsername) === 0) {
            throw new ApiException('You cannot share a calendar with yourself', 400);
        }

        $accessCode = $this->parseAccess($access);
        // Portal "read-only for everyone" forces sharees to read-only access
        if ($this->meta->isReadOnly($instanceId)) {
            $accessCode = SharingPlugin::ACCESS_READ;
        }
        $target = $this->resolveUser($shareUsername);
        $calId = $this->requireOwnedCalendarId($ownerUsername, $instanceId);

        $sharee = new Sharee([
            'href'          => $target['href'],
            'principal'     => $target['principal'],
            'access'        => $accessCode,
            'inviteStatus'  => SharingPlugin::INVITE_ACCEPTED,
            'properties'    => [
                '{DAV:}displayname' => $target['displayname'],
            ],
        ]);

        $this->backend->updateInvites($calId, [$sharee]);

        return [
            'href'        => $target['href'],
            'username'    => $target['username'],
            'displayname' => $target['displayname'],
            'access'      => $this->accessLabel($accessCode),
            'accessCode'  => $accessCode,
        ];
    }

    public function revokeShare(string $ownerUsername, int $instanceId, string $href): void {
        $href = trim($href);
        if ($href === '') {
            throw new ApiException('Share href is required', 400);
        }
        $calId = $this->requireOwnedCalendarId($ownerUsername, $instanceId);

        $sharee = new Sharee([
            'href'   => $href,
            'access' => SharingPlugin::ACCESS_NOACCESS,
        ]);
        $this->backend->updateInvites($calId, [$sharee]);
    }

    /**
     * Directory of other Baikal users for the share picker.
     *
     * @return list<array<string, string>>
     */
    public function directory(string $currentUsername): array {
        $driver = (string) $this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
        if ($driver === 'sqlite') {
            $sql = "SELECT p.uri, p.displayname, p.email
                    FROM principals p
                    INNER JOIN users u ON p.uri = 'principals/' || u.username
                    ORDER BY lower(coalesce(nullif(p.displayname, ''), u.username)), p.uri";
        } else {
            // MySQL / PostgreSQL
            $sql = "SELECT p.uri, p.displayname, p.email
                    FROM principals p
                    INNER JOIN users u ON p.uri = CONCAT('principals/', u.username)
                    ORDER BY LOWER(COALESCE(NULLIF(p.displayname, ''), u.username)), p.uri";
        }
        $stmt = $this->pdo->query($sql);

        $out = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $username = $this->usernameFromPrincipal((string) $row['uri']);
            if ($username === '' || strcasecmp($username, $currentUsername) === 0) {
                continue;
            }
            $out[] = [
                'username'    => $username,
                'displayname' => (string) ($row['displayname'] ?: $username),
                // Email omitted from directory for privacy (username is enough to share)
            ];
        }

        return $out;
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function requireOwnedCalendarId(string $username, int $instanceId): array {
        $row = $this->loadInstance($username, $instanceId);
        $access = (int) $row['access'];
        if ($access !== SharingPlugin::ACCESS_SHAREDOWNER && $access !== SharingPlugin::ACCESS_NOTSHARED) {
            throw new ApiException('Only the calendar owner can manage shares', 403);
        }

        return [(int) $row['calendarid'], (int) $row['id']];
    }

    /**
     * @return array{0: int, 1: int} [calendarId, instanceId]
     */
    private function requireCalendarAccess(string $username, int $instanceId, bool $write): array {
        $row = $this->loadInstance($username, $instanceId);
        $access = (int) $row['access'];
        $isOwner = $access === SharingPlugin::ACCESS_SHAREDOWNER
            || $access === SharingPlugin::ACCESS_NOTSHARED;
        $canWrite = $isOwner || $access === SharingPlugin::ACCESS_READWRITE;
        $canRead = $canWrite || $access === SharingPlugin::ACCESS_READ;

        if ($write && !$canWrite) {
            throw new ApiException('You do not have write access to this calendar', 403);
        }
        if (!$write && !$canRead) {
            throw new ApiException('You do not have access to this calendar', 403);
        }

        return [(int) $row['calendarid'], (int) $row['id']];
    }

    /**
     * @return array<string, mixed>
     */
    private function loadInstance(string $username, int $instanceId): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT id, calendarid, access, principaluri, displayname, description, calendarcolor, uri
             FROM calendarinstances
             WHERE id = ? AND principaluri = ?'
        );
        $stmt->execute([$instanceId, $principal]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiException('Calendar not found', 404);
        }

        return $row;
    }

    /**
     * @return array{displayname: string, color: string, uri: string}
     */
    private function getCalendarMeta(string $username, int $instanceId): array {
        $row = $this->loadInstance($username, $instanceId);

        return [
            'displayname' => (string) ($row['displayname'] ?: $row['uri'] ?: 'Calendar'),
            'color'       => (string) ($row['calendarcolor'] ?? ''),
            'uri'         => (string) ($row['uri'] ?? ''),
        ];
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

    /**
     * @return array{username: string, principal: string, href: string, displayname: string, email: string}
     */
    private function resolveUser(string $username): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT u.username, p.uri, p.email, p.displayname
             FROM users u
             LEFT JOIN principals p ON p.uri = ?
             WHERE u.username = ?'
        );
        $stmt->execute([$principal, $username]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiException('User not found: ' . $username, 404);
        }
        $email = trim((string) ($row['email'] ?? ''));
        if ($email === '') {
            // sabre share_href uniqueness; mailto still required by CalDAV sharing UX
            $email = $username . '@local';
        }

        return [
            'username'    => (string) $row['username'],
            'principal'   => $principal,
            'href'        => 'mailto:' . $email,
            'displayname' => (string) ($row['displayname'] ?: $username),
            'email'       => $email,
        ];
    }

    private function parseAccess(string $access): int {
        $a = strtolower(trim($access));
        if ($a === 'read' || $a === 'readonly' || $a === 'read-only' || $a === '2') {
            return SharingPlugin::ACCESS_READ;
        }
        if ($a === 'readwrite' || $a === 'read-write' || $a === 'full' || $a === '3') {
            return SharingPlugin::ACCESS_READWRITE;
        }
        throw new ApiException('access must be "read" or "readwrite"', 400);
    }

    private function accessLabel(int $code): string {
        switch ($code) {
            case SharingPlugin::ACCESS_READ:
                return 'read';
            case SharingPlugin::ACCESS_READWRITE:
                return 'readwrite';
            case SharingPlugin::ACCESS_SHAREDOWNER:
                return 'owner';
            case SharingPlugin::ACCESS_NOTSHARED:
                return 'owner';
            default:
                return 'unknown';
        }
    }

    private function usernameFromPrincipal(string $principal): string {
        if (strpos($principal, 'principals/') === 0) {
            return substr($principal, strlen('principals/'));
        }

        return $principal;
    }

    /**
     * Normalize Apple-style calendar color (#RGB / #RRGGBB / #RRGGBBAA) or empty to clear.
     */
    private function normalizeColor(string $color): string {
        $color = trim($color);
        if ($color === '') {
            return '';
        }
        if ($color[0] !== '#') {
            $color = '#' . $color;
        }
        if (!preg_match('/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/', $color)) {
            throw new ApiException('Color must be #RGB, #RRGGBB, or #RRGGBBAA', 400);
        }

        // Expand #RGB → #RRGGBB for clients
        if (strlen($color) === 4) {
            $color = '#' . $color[1] . $color[1] . $color[2] . $color[2] . $color[3] . $color[3];
        }

        return strtoupper($color);
    }

    private function uniqueCalendarUri(string $username, string $displayname): string {
        $base = strtolower($displayname);
        $base = preg_replace('/[^a-z0-9]+/', '-', $base) ?? 'calendar';
        $base = trim($base, '-');
        if ($base === '') {
            $base = 'calendar';
        }
        $base = substr($base, 0, 40);
        $uri = $base;
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM calendarinstances WHERE principaluri = ? AND uri = ? LIMIT 1'
        );
        $n = 0;
        while (true) {
            $stmt->execute([$principal, $uri]);
            if (!$stmt->fetchColumn()) {
                return $uri;
            }
            ++$n;
            $uri = $base . '-' . ($n > 3 ? UUIDUtil::getUUID() : (string) $n);
            if ($n > 20) {
                return $base . '-' . UUIDUtil::getUUID();
            }
        }
    }
}
