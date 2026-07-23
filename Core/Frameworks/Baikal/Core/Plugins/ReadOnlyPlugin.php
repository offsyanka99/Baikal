<?php

namespace Baikal\Core\Plugins;

use Baikal\Portal\PortalMeta;
use Sabre\DAV\Exception\Forbidden;
use Sabre\DAV\Server;
use Sabre\DAV\ServerPlugin;
use Sabre\DAV\Sharing\Plugin as SharingPlugin;
use Sabre\HTTP\RequestInterface;
use Sabre\HTTP\ResponseInterface;

/**
 * Blocks CalDAV write methods on calendars marked read-only in portal meta.
 *
 * Portal stores the flag in Specific/portal_meta.json (keyed by calendar instance id).
 * Without this plugin, clients (DAVx⁵, Thunderbird, Home Assistant, …) could still
 * PUT/DELETE events on the owner's calendar over /dav.php/ or /cal.php/.
 */
class ReadOnlyPlugin extends ServerPlugin {
    /** @var \PDO */
    protected $pdo;

    /** @var PortalMeta */
    protected $meta;

    /** @var Server */
    protected $server;

    public function __construct(\PDO $pdo, ?PortalMeta $meta = null) {
        $this->pdo = $pdo;
        $this->meta = $meta ?? new PortalMeta();
    }

    public function initialize(Server $server) {
        $this->server = $server;
        // After auth (priority 10 on beforeMethod:*); same priority is fine — auth is registered first.
        $server->on('beforeMethod:PUT', [$this, 'beforeWrite'], 90);
        $server->on('beforeMethod:DELETE', [$this, 'beforeWrite'], 90);
        $server->on('beforeMethod:MKCOL', [$this, 'beforeWrite'], 90);
        $server->on('beforeMethod:PROPPATCH', [$this, 'beforeWrite'], 90);
        $server->on('beforeMethod:MOVE', [$this, 'beforeWrite'], 90);
        $server->on('beforeMethod:COPY', [$this, 'beforeWrite'], 90);
        // Some clients POST to a calendar collection to create objects
        $server->on('beforeMethod:POST', [$this, 'beforeWrite'], 90);
    }

    /**
     * @return void
     */
    public function beforeWrite(RequestInterface $request, ResponseInterface $response) {
        $path = $this->server->getRequestUri();
        $method = strtoupper($request->getMethod());

        // Allow free-busy / scheduling POST on special collections only
        if ($method === 'POST' && $this->isSchedulingCollectionPath($path)) {
            return;
        }

        if ($this->isReadOnlyCalendarPath($path)) {
            throw new Forbidden('This calendar is marked read-only and cannot be modified via CalDAV.');
        }

        if ($method === 'MOVE' || $method === 'COPY') {
            $dest = $this->destinationPath($request);
            if ($dest !== null && $this->isReadOnlyCalendarPath($dest)) {
                throw new Forbidden('This calendar is marked read-only and cannot be modified via CalDAV.');
            }
        }
    }

    /**
     * inbox/outbox/notifications under calendars/{user}/ — scheduling, not calendar data.
     */
    protected function isSchedulingCollectionPath(string $path): bool {
        $path = trim($path, '/');
        if (!preg_match('#^calendars/([^/]+)/([^/]+)#', $path, $m)) {
            return false;
        }
        $col = rawurldecode($m[2]);

        return $col === 'inbox' || $col === 'outbox' || $col === 'notifications';
    }

    /**
     * Whether the calendar collection identified by a DAV path is portal-read-only.
     *
     * Path format (after baseUri strip): calendars/{username}/{calendarUri}[/…]
     */
    public function isReadOnlyCalendarPath(string $path): bool {
        $path = trim($path, '/');
        if (!preg_match('#^calendars/([^/]+)/([^/]+)#', $path, $matches)) {
            return false;
        }

        $principalUri = 'principals/' . rawurldecode($matches[1]);
        $calendarUri = rawurldecode($matches[2]);

        // Special scheduling collections are not calendarinstances rows.
        if ($calendarUri === 'inbox' || $calendarUri === 'outbox' || $calendarUri === 'notifications') {
            return false;
        }

        $stmt = $this->pdo->prepare(
            'SELECT id, calendarid FROM calendarinstances WHERE principaluri = ? AND uri = ?'
        );
        $stmt->execute([$principalUri, $calendarUri]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            return false;
        }

        $instanceId = (int) $row['id'];
        if ($this->meta->isReadOnly($instanceId)) {
            return true;
        }

        // Shared instances use a different instance id; the portal flag is stored on the owner.
        $calendarId = (int) ($row['calendarid'] ?? 0);
        if ($calendarId <= 0) {
            return false;
        }

        return $this->ownerInstanceIsReadOnly($calendarId);
    }

    /**
     * True if any owner/not-shared instance of this calendar is marked read-only.
     */
    protected function ownerInstanceIsReadOnly(int $calendarId): bool {
        $stmt = $this->pdo->prepare(
            'SELECT id FROM calendarinstances WHERE calendarid = ? AND access IN (?, ?)'
        );
        $stmt->execute([
            $calendarId,
            SharingPlugin::ACCESS_NOTSHARED,
            SharingPlugin::ACCESS_SHAREDOWNER,
        ]);

        while ($owner = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if ($this->meta->isReadOnly((int) $owner['id'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Resolve MOVE/COPY Destination header to a path relative to baseUri, or null.
     */
    protected function destinationPath(RequestInterface $request): ?string {
        $dest = $request->getHeader('Destination');
        if ($dest === null || $dest === '') {
            return null;
        }

        try {
            return $this->server->calculateUri($dest);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function getPluginName() {
        return 'baikal-readonly';
    }

    /**
     * @return array{name: string, description: string}
     */
    public function getPluginInfo() {
        return [
            'name'        => $this->getPluginName(),
            'description' => 'Prevents CalDAV modifications on calendars marked read-only in the user portal.',
        ];
    }
}
