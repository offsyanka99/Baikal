<?php

namespace Baikal\Portal;

use Sabre\CalDAV\Backend\PDO as CaldavBackend;
use Sabre\DAV\Sharing\Plugin as SharingPlugin;
use Sabre\DAV\Xml\Element\Sharee;

/**
 * Calendar listing and sharing via sabre/dav CalDAV backend.
 */
class ShareService {
    /** @var \PDO */
    private $pdo;

    /** @var CaldavBackend */
    private $backend;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
        $this->backend = new CaldavBackend($pdo);
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

            $out[] = [
                'id'          => (int) $id[1], // instance id (unique per principal view)
                'calendarId'  => (int) $id[0],
                'instanceId'  => (int) $id[1],
                'uri'         => (string) ($cal['uri'] ?? ''),
                'displayname' => (string) ($cal['{DAV:}displayname'] ?? $cal['uri'] ?? 'Calendar'),
                'description' => (string) ($cal['{urn:ietf:params:xml:ns:caldav}calendar-description'] ?? ''),
                'color'       => (string) ($cal['{http://apple.com/ns/ical/}calendar-color'] ?? ''),
                'access'      => $this->accessLabel($access),
                'accessCode'  => $access,
                'canShare'    => $isOwner,
                'components'  => (string) ($cal['components'] ?? ''),
            ];
        }

        usort($out, static function ($a, $b) {
            return strcasecmp($a['displayname'], $b['displayname']);
        });

        return $out;
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
                'email'       => (string) ($row['email'] ?? ''),
            ];
        }

        return $out;
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function requireOwnedCalendarId(string $username, int $instanceId): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT id, calendarid, access, principaluri
             FROM calendarinstances
             WHERE id = ? AND principaluri = ?'
        );
        $stmt->execute([$instanceId, $principal]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiException('Calendar not found', 404);
        }
        $access = (int) $row['access'];
        if ($access !== SharingPlugin::ACCESS_SHAREDOWNER && $access !== SharingPlugin::ACCESS_NOTSHARED) {
            throw new ApiException('Only the calendar owner can manage shares', 403);
        }

        return [(int) $row['calendarid'], (int) $row['id']];
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
}
