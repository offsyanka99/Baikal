<?php

namespace Baikal\Portal;

use Symfony\Component\Yaml\Yaml;

/**
 * JSON API router for the user portal SPA.
 */
class App {
    /** @var Auth */
    private $auth;

    /** @var ShareService */
    private $shares;

    /** @var ContactService */
    private $contacts;

    /** @var CalendarItemService */
    private $items;

    /** @var array<string, mixed> */
    private $config;

    /** @var array<string, mixed>|null Cached JSON body (php://input is one-shot) */
    private $jsonBodyCache;

    /** True when a streaming / download response was already sent (skip json()). */
    private $responseSent = false;

    public function __construct(\PDO $pdo, array $config) {
        $this->config = $config;
        $realm = (string) ($config['system']['auth_realm'] ?? 'BaikalDAV');
        $sessionMax = Auth::DEFAULT_SESSION_MAX_AGE;
        if (isset($config['system']['session_max_age_minutes'])
            && is_numeric($config['system']['session_max_age_minutes'])
            && (int) $config['system']['session_max_age_minutes'] > 0
        ) {
            $sessionMax = (int) $config['system']['session_max_age_minutes'] * 60;
        }
        $this->auth = new Auth($pdo, $realm, $sessionMax);
        $this->shares = new ShareService($pdo);
        $this->contacts = new ContactService($pdo);
        $this->items = new CalendarItemService($pdo);
    }

    /**
     * Portal UI prefs (time format / week start / log level). Env overrides YAML.
     * TIME_FORMAT / BAIKAL_PORTAL_TIME_FORMAT: auto|12h|24h
     * BAIKAL_PORTAL_WEEK_START: auto|monday|sunday
     * PORTAL_LOG_LEVEL / BAIKAL_PORTAL_LOG_LEVEL: off|error|warn|info|debug.
     *
     * @return array{timeFormat: string, weekStart: string, logLevel: string}
     */
    private function portalUiSettings(): array {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        $time = strtolower(trim((string) (
            getenv('TIME_FORMAT')
            ?: getenv('BAIKAL_PORTAL_TIME_FORMAT')
            ?: ($sys['portal_time_format'] ?? 'auto')
        )));
        if (!in_array($time, ['auto', '12h', '24h'], true)) {
            $time = 'auto';
        }
        $week = strtolower(trim((string) (
            getenv('BAIKAL_PORTAL_WEEK_START')
            ?: ($sys['portal_week_start'] ?? 'auto')
        )));
        if (!in_array($week, ['auto', 'monday', 'sunday'], true)) {
            $week = 'auto';
        }

        return [
            'timeFormat' => $time,
            'weekStart'  => $week,
            'logLevel'   => $this->portalLogLevel(),
        ];
    }

    /**
     * Portal log level (SPA console + optional server request log). Env overrides YAML.
     * PORTAL_LOG_LEVEL / BAIKAL_PORTAL_LOG_LEVEL / system.portal_log_level: off|error|warn|info|debug.
     */
    private function portalLogLevel(): string {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        $level = strtolower(trim((string) (
            getenv('PORTAL_LOG_LEVEL')
            ?: getenv('BAIKAL_PORTAL_LOG_LEVEL')
            ?: ($sys['portal_log_level'] ?? 'off')
        )));
        if (!in_array($level, ['off', 'error', 'warn', 'info', 'debug'], true)) {
            return 'off';
        }

        return $level;
    }

    /** Whether server-side portal request logging is enabled for this level. */
    private function portalServerLogEnabled(string $min = 'info'): bool {
        $order = ['off' => 0, 'error' => 1, 'warn' => 2, 'info' => 3, 'debug' => 4];
        $cur = $order[$this->portalLogLevel()] ?? 0;
        $need = $order[$min] ?? 3;

        return $cur >= $need;
    }

    /**
     * Server-side portal request log → Specific/portal_debug.log only.
     *
     * Never use PHP error_log() here: php-fpm writes that to stderr and nginx
     * logs every line as [error], even for successful 200 responses.
     */
    private function portalServerLog(string $message, string $min = 'info'): void {
        if (!$this->portalServerLogEnabled($min)) {
            return;
        }
        $dir = defined('PROJECT_PATH_SPECIFIC')
            ? PROJECT_PATH_SPECIFIC
            : (defined('PROJECT_PATH_ROOT') ? PROJECT_PATH_ROOT . 'Specific/' : '');
        if ($dir === '' || !is_dir($dir) || !is_writable($dir)) {
            return;
        }
        $path = rtrim($dir, '/') . '/portal_debug.log';
        $ts = date('Y-m-d H:i:s');
        $level = strtoupper($min);
        @file_put_contents(
            $path,
            '[' . $ts . '] [' . $level . '] Baikal portal: ' . $message . "\n",
            FILE_APPEND | LOCK_EX
        );
    }

    /**
     * Bootstrap Flake/Baikal and return App. PROJECT_PATH_ROOT must already be defined.
     */
    public static function bootstrap(): self {
        Auth::startSession();

        if (!defined('PROJECT_PATH_ROOT')) {
            throw new ApiException('PROJECT_PATH_ROOT not defined', 500);
        }

        \Flake\Framework::bootstrap();
        \Baikal\Framework::bootstrap();

        $configPath = PROJECT_PATH_CONFIG . 'baikal.yaml';
        if (!is_readable($configPath)) {
            throw new ApiException('Baikal is not configured yet', 503);
        }
        $config = Yaml::parseFile($configPath);
        if (!is_array($config)) {
            throw new ApiException('Invalid baikal.yaml', 503);
        }

        if (!isset($GLOBALS['DB']) || !is_object($GLOBALS['DB'])) {
            throw new ApiException('Database is not available', 503);
        }

        return new self($GLOBALS['DB']->getPDO(), $config);
    }

    public function handle(string $method, string $path): void {
        $method = strtoupper($method);
        $path = '/' . trim($path, '/');
        if ($path === '/') {
            $path = '';
        }

        $t0 = microtime(true);
        $this->portalServerLog($method . ' ' . $path, 'debug');

        try {
            // Binary/download responses (ICS / VCF export)
            if ($method === 'GET' && preg_match('#^/calendars/(\d+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->shares->exportCalendar($username, (int) $m[1]);
                $this->fileDownload($export['ics'], $export['filename'], 'text/calendar; charset=utf-8');
                $this->portalServerLog(
                    sprintf('%s %s → 200 export (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            if ($method === 'GET' && preg_match('#^/addressbooks/(\d+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->contacts->exportAddressBook($username, (int) $m[1]);
                $this->fileDownload($export['vcf'], $export['filename'], 'text/vcard; charset=utf-8');
                $this->portalServerLog(
                    sprintf('%s %s → 200 export (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            // Single contact VCF export
            if ($method === 'GET' && preg_match('#^/addressbooks/(\d+)/contacts/([^/]+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->contacts->exportContact($username, (int) $m[1], rawurldecode($m[2]));
                $this->fileDownload($export['vcf'], $export['filename'], 'text/vcard; charset=utf-8');
                $this->portalServerLog(
                    sprintf('%s %s → 200 export (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            // Contact photo binary (JPEG)
            if ($method === 'GET' && preg_match('#^/addressbooks/(\d+)/contacts/([^/]+)/photo$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $photo = $this->contacts->getContactPhoto($username, (int) $m[1], rawurldecode($m[2]));
                if ($photo === null) {
                    throw new ApiException('Contact has no photo', 404);
                }
                http_response_code(200);
                header('Content-Type: ' . $photo['contentType']);
                header('Cache-Control: private, max-age=300');
                header('X-Content-Type-Options: nosniff');
                header('Content-Length: ' . (string) strlen($photo['bytes']));
                echo $photo['bytes'];
                $this->portalServerLog(
                    sprintf('%s %s → 200 photo (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }

            $result = $this->dispatch($method, $path);
            if ($this->responseSent) {
                $this->portalServerLog(
                    sprintf('%s %s → stream done (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            $this->json(200, $result);
            $this->portalServerLog(
                sprintf('%s %s → 200 (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                'info'
            );
        } catch (ApiException $e) {
            // 401 before login is normal; keep it at info so debug stays calm
            $lvl = 'info';
            if ($e->getStatus() >= 500) {
                $lvl = 'error';
            } elseif ($e->getStatus() >= 400 && $e->getStatus() !== 401) {
                $lvl = 'warn';
            }
            $this->portalServerLog(
                sprintf(
                    '%s %s → %d %s (%dms)',
                    $method,
                    $path,
                    $e->getStatus(),
                    $e->getMessage(),
                    (int) ((microtime(true) - $t0) * 1000)
                ),
                $lvl
            );
            $this->json($e->getStatus(), ['error' => $e->getMessage()]);
        } catch (\Throwable $e) {
            error_log('Baikal portal API: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
            $this->portalServerLog(
                sprintf('%s %s → 500 %s', $method, $path, $e->getMessage()),
                'error'
            );
            $msg = 'Internal server error';
            // Surface timeout clearly for large imports (Thunderbird full calendar/contacts)
            if (stripos($e->getMessage(), 'Maximum execution time') !== false) {
                $msg = 'Import timed out. Try a smaller export, or import again (already-imported items update faster).';
            }
            $this->json(500, ['error' => $msg]);
        }
    }

    /**
     * @return array<string, mixed>|list<mixed>
     */
    private function dispatch(string $method, string $path) {
        // Public portal UI prefs (no auth) — SPA applies log level before login
        if ($method === 'GET' && $path === '/ui') {
            return ['ui' => $this->portalUiSettings()];
        }

        if ($method === 'POST' && $path === '/login') {
            $this->assertSameOrigin();
            $body = $this->jsonBody();
            $user = $this->auth->login(
                (string) ($body['username'] ?? ''),
                (string) ($body['password'] ?? '')
            );
            $this->portalServerLog('login ok user=' . (string) ($user['username'] ?? ''), 'info');

            return [
                'user' => $user,
                'ui'   => $this->portalUiSettings(),
            ];
        }

        // State-changing requests: same-origin + CSRF (when a session exists)
        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $this->assertSameOrigin();
            $sessionUser = $this->auth->username();
            if ($path === '/logout') {
                if ($sessionUser !== null) {
                    $this->auth->assertCsrf($this->csrfFromRequest());
                }
                $this->auth->logout();
                $this->portalServerLog('logout', 'info');

                return ['ok' => true];
            }
            if ($sessionUser === null) {
                throw new ApiException('Not authenticated', 401);
            }
            $this->auth->assertCsrf($this->csrfFromRequest());
        }

        if ($method === 'GET' && ($path === '/me' || $path === '')) {
            $username = $this->auth->requireUser();
            $profile = $this->auth->profile($username);
            $profile['csrfToken'] = $this->auth->csrfToken();

            return [
                'user'      => $profile,
                'csrfToken' => $this->auth->csrfToken(),
                'version'   => defined('BAIKAL_VERSION') ? BAIKAL_VERSION : null,
                'davPath'   => '/dav.php/',
                'ui'        => $this->portalUiSettings(),
            ];
        }

        $username = $this->auth->requireUser();

        if ($method === 'GET' && $path === '/directory') {
            return ['users' => $this->shares->directory($username)];
        }

        if ($method === 'GET' && $path === '/holidays/countries') {
            return ['countries' => Holidays::countries()];
        }

        if ($method === 'GET' && $path === '/calendars') {
            return ['calendars' => $this->shares->listCalendars($username)];
        }

        // POST /calendars — create (optional holidays + readOnly)
        if ($method === 'POST' && $path === '/calendars') {
            $body = $this->jsonBody();
            $cal = $this->shares->createCalendar($username, $body);

            return [
                'calendar'      => $cal,
                'holidayImport' => $cal['holidayImport'] ?? null,
            ];
        }

        // PATCH|PUT /calendars/{id} — update displayname / color / description
        if (preg_match('#^/calendars/(\d+)$#', $path, $m) && ($method === 'PATCH' || $method === 'PUT')) {
            $instanceId = (int) $m[1];
            $body = $this->jsonBody();
            $cal = $this->shares->updateCalendar($username, $instanceId, $body);

            return ['calendar' => $cal];
        }

        // DELETE /calendars/{id} — permanently remove owned calendar
        if (preg_match('#^/calendars/(\d+)$#', $path, $m) && $method === 'DELETE') {
            $instanceId = (int) $m[1];
            $this->shares->deleteCalendar($username, $instanceId);

            return ['ok' => true];
        }

        // GET /calendars/{id}/events?from=YYYY-MM-DD&to=YYYY-MM-DD — month view
        // POST /calendars/{id}/events — create VEVENT
        if (preg_match('#^/calendars/(\d+)/events$#', $path, $m)) {
            $instanceId = (int) $m[1];
            if ($method === 'GET') {
                $from = isset($_GET['from']) ? (string) $_GET['from'] : '';
                $to = isset($_GET['to']) ? (string) $_GET['to'] : '';

                return [
                    'events' => $this->shares->listEvents($username, $instanceId, $from, $to),
                ];
            }
            if ($method === 'POST') {
                $body = $this->jsonBody();
                $event = $this->shares->createEvent($username, $instanceId, $body);

                return ['event' => $event];
            }
        }

        // GET|PATCH|DELETE /calendars/{id}/events/{uri} — single VEVENT
        if (preg_match('#^/calendars/(\d+)/events/([^/]+)$#', $path, $m)) {
            $instanceId = (int) $m[1];
            $uri = rawurldecode($m[2]);
            if ($method === 'GET') {
                return ['event' => $this->shares->getEvent($username, $instanceId, $uri)];
            }
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->jsonBody();
                $event = $this->shares->updateEvent($username, $instanceId, $uri, $body);

                return ['event' => $event];
            }
            if ($method === 'DELETE') {
                $this->shares->deleteEvent($username, $instanceId, $uri);

                return ['ok' => true];
            }
        }

        // POST /calendars/{id}/import — ICS body (JSON {ics} or raw text/calendar)
        // Accept: application/x-ndjson → stream progress lines for the portal modal
        if ($method === 'POST' && preg_match('#^/calendars/(\d+)/import$#', $path, $m)) {
            $instanceId = (int) $m[1];
            $ics = $this->readIcsPayload();
            if ($this->wantsImportProgressStream()) {
                $this->streamImportProgress(function (?callable $onProgress) use ($username, $instanceId, $ics) {
                    return $this->shares->importCalendar($username, $instanceId, $ics, false, $onProgress);
                });

                return null;
            }

            return $this->shares->importCalendar($username, $instanceId, $ics);
        }

        if (preg_match('#^/calendars/(\d+)/shares$#', $path, $m)) {
            $instanceId = (int) $m[1];
            if ($method === 'GET') {
                return ['shares' => $this->shares->listShares($username, $instanceId)];
            }
            if ($method === 'POST') {
                $body = $this->jsonBody();
                $share = $this->shares->addOrUpdateShare(
                    $username,
                    $instanceId,
                    (string) ($body['username'] ?? ''),
                    (string) ($body['access'] ?? 'read')
                );

                return ['share' => $share];
            }
            if ($method === 'DELETE') {
                $body = $this->jsonBody();
                $href = (string) ($body['href'] ?? ($_GET['href'] ?? ''));
                $this->shares->revokeShare($username, $instanceId, $href);

                return ['ok' => true];
            }
        }

        // --- Address books / contacts ---
        if ($method === 'GET' && $path === '/addressbooks') {
            return ['addressbooks' => $this->contacts->listAddressBooks($username)];
        }

        if ($method === 'POST' && $path === '/addressbooks') {
            $body = $this->jsonBody();
            $ab = $this->contacts->createAddressBook($username, $body);

            return ['addressbook' => $ab];
        }

        if (preg_match('#^/addressbooks/(\d+)$#', $path, $m)) {
            $id = (int) $m[1];
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->jsonBody();
                $ab = $this->contacts->updateAddressBook($username, $id, $body);

                return ['addressbook' => $ab];
            }
            if ($method === 'DELETE') {
                $body = $this->jsonBody();
                $force = !empty($body['force']) || (isset($_GET['force']) && $_GET['force'] !== '0' && $_GET['force'] !== '');
                $this->contacts->deleteAddressBook($username, $id, $force);

                return ['ok' => true];
            }
        }

        if ($method === 'POST' && preg_match('#^/addressbooks/(\d+)/import$#', $path, $m)) {
            $id = (int) $m[1];
            $vcf = $this->readPayloadField('vcf', ['text/vcard', 'text/x-vcard', 'text/directory']);
            if ($this->wantsImportProgressStream()) {
                $this->streamImportProgress(function (?callable $onProgress) use ($username, $id, $vcf) {
                    return $this->contacts->importAddressBook($username, $id, $vcf, $onProgress);
                });

                return null;
            }

            return $this->contacts->importAddressBook($username, $id, $vcf);
        }

        // GET list / POST create contacts
        if (preg_match('#^/addressbooks/(\d+)/contacts$#', $path, $m)) {
            $id = (int) $m[1];
            if ($method === 'GET') {
                $q = isset($_GET['q']) ? (string) $_GET['q'] : '';

                return ['contacts' => $this->contacts->listContacts($username, $id, $q)];
            }
            if ($method === 'POST') {
                $body = $this->jsonBody();
                $contact = $this->contacts->createContact($username, $id, $body);

                return ['contact' => $contact];
            }
        }

        // GET / PATCH / DELETE one contact
        if (preg_match('#^/addressbooks/(\d+)/contacts/([^/]+)$#', $path, $m)) {
            $id = (int) $m[1];
            $uri = rawurldecode($m[2]);
            if ($method === 'GET') {
                return ['contact' => $this->contacts->getContact($username, $id, $uri)];
            }
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->jsonBody();
                $contact = $this->contacts->updateContact($username, $id, $uri, $body);

                return ['contact' => $contact];
            }
            if ($method === 'DELETE') {
                $this->contacts->deleteContact($username, $id, $uri);

                return ['ok' => true];
            }
        }

        // --- Tasks (VTODO) / Notes (VJOURNAL) ---
        $itemRoutes = $this->dispatchItemRoutes($method, $path, $username);
        if ($itemRoutes !== null) {
            return $itemRoutes;
        }

        throw new ApiException('Not found', 404);
    }

    /**
     * @return array<string, mixed>|list<mixed>|null
     */
    private function dispatchItemRoutes(string $method, string $path, string $username) {
        foreach (['tasks' => CalendarItemService::KIND_TASK, 'notes' => CalendarItemService::KIND_NOTE] as $seg => $kind) {
            if ($method === 'GET' && $path === '/' . $seg) {
                $q = isset($_GET['q']) ? (string) $_GET['q'] : '';
                $sort = isset($_GET['sort']) ? (string) $_GET['sort'] : '';
                $order = isset($_GET['order']) ? (string) $_GET['order'] : 'asc';

                return [
                    $seg        => $this->items->listItems($username, $kind, $q, $sort, $order),
                    'calendars' => $this->items->writableCalendars($username, $kind),
                ];
            }
            if ($method === 'POST' && $path === '/' . $seg) {
                $body = $this->jsonBody();
                $item = $this->items->createItem($username, $kind, $body);

                return [rtrim($seg, 's') => $item]; // task / note
            }
            // POST /tasks/bulk — multi select update/delete
            if ($method === 'POST' && $path === '/' . $seg . '/bulk') {
                $body = $this->jsonBody();
                $op = (string) ($body['op'] ?? '');
                $items = $body['items'] ?? [];
                if (!is_array($items)) {
                    throw new ApiException('items must be an array', 400);
                }
                $fields = $body['fields'] ?? [];
                if (!is_array($fields)) {
                    $fields = [];
                }

                return $this->items->bulkItems($username, $kind, $op, $items, $fields);
            }
            // /tasks/{instanceId}/{uri}
            if (preg_match('#^/' . $seg . '/(\d+)/([^/]+)$#', $path, $m)) {
                $instanceId = (int) $m[1];
                $uri = rawurldecode($m[2]);
                $key = rtrim($seg, 's');
                if ($method === 'GET') {
                    return [$key => $this->items->getItem($username, $kind, $instanceId, $uri)];
                }
                if ($method === 'PATCH' || $method === 'PUT') {
                    $body = $this->jsonBody();
                    $item = $this->items->updateItem($username, $kind, $instanceId, $uri, $body);

                    return [$key => $item];
                }
                if ($method === 'DELETE') {
                    $this->items->deleteItem($username, $kind, $instanceId, $uri);

                    return ['ok' => true];
                }
            }
        }

        return null;
    }

    private function readIcsPayload(): string {
        return $this->readPayloadField('ics', ['text/calendar']);
    }

    private function csrfFromRequest(): string {
        $h = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_SERVER['HTTP_X_BAIKAL_CSRF'] ?? '';
        if (is_string($h) && $h !== '') {
            return $h;
        }

        return '';
    }

    /**
     * Reject cross-site browser requests (defense in depth with SameSite=Lax).
     */
    private function assertSameOrigin(): void {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        if ($host === '') {
            return;
        }
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if (is_string($origin) && $origin !== '') {
            $parts = parse_url($origin);
            $oh = $parts['host'] ?? '';
            if (isset($parts['port'])) {
                $oh .= ':' . $parts['port'];
            }
            if ($oh === '' || strcasecmp($oh, $host) !== 0) {
                throw new ApiException('Cross-origin request blocked', 403);
            }

            return;
        }
        $referer = $_SERVER['HTTP_REFERER'] ?? '';
        if (is_string($referer) && $referer !== '') {
            $parts = parse_url($referer);
            $rh = $parts['host'] ?? '';
            if (isset($parts['port'])) {
                $rh .= ':' . $parts['port'];
            }
            if ($rh !== '' && strcasecmp($rh, $host) !== 0) {
                throw new ApiException('Cross-origin request blocked', 403);
            }
        }
    }

    /**
     * @param list<string> $rawContentTypes
     */
    private function readPayloadField(string $jsonField, array $rawContentTypes): string {
        $ct = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? ''));
        $raw = file_get_contents('php://input');
        if ($raw === false) {
            $raw = '';
        }

        $isJson = str_contains($ct, 'application/json')
            || (isset($raw[0]) && ($raw[0] === '{' || $raw[0] === '['));
        if ($isJson) {
            $data = json_decode($raw, true);
            if (!is_array($data)) {
                throw new ApiException('Invalid JSON body', 400);
            }
            if (!empty($data[$jsonField]) && is_string($data[$jsonField])) {
                return $data[$jsonField];
            }
            throw new ApiException('JSON body must include string field "' . $jsonField . '"', 400);
        }

        foreach ($rawContentTypes as $t) {
            if (str_contains($ct, $t)) {
                return $raw;
            }
        }

        // Allow plain text uploads
        return $raw;
    }

    /**
     * @return array<string, mixed>
     */
    private function jsonBody(): array {
        if ($this->jsonBodyCache !== null) {
            return $this->jsonBodyCache;
        }
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            $this->jsonBodyCache = [];

            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new ApiException('Invalid JSON body', 400);
        }
        $this->jsonBodyCache = $data;

        return $data;
    }

    /**
     * @param array<string, mixed>|list<mixed> $payload
     */
    private function json(int $status, $payload): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        // JSON_INVALID_UTF8_SUBSTITUTE: never fail the whole API if one field has bad bytes
        $flags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
        if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
            $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
        }
        $json = json_encode($payload, $flags);
        if ($json === false) {
            error_log('Baikal portal JSON encode failed: ' . json_last_error_msg());
            $json = json_encode(['error' => 'Response encoding failed'], JSON_UNESCAPED_SLASHES) ?: '{"error":"Response encoding failed"}';
            http_response_code(500);
        }
        echo $json . "\n";
    }

    private function fileDownload(string $body, string $filename, string $contentType): void {
        $filename = preg_replace('/[^a-zA-Z0-9._-]+/', '-', $filename) ?: 'download';
        http_response_code(200);
        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('Content-Length: ' . (string) strlen($body));
        echo $body;
    }

    /** Portal import UI requests Accept: application/x-ndjson for live %. */
    private function wantsImportProgressStream(): bool {
        $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));

        return str_contains($accept, 'application/x-ndjson')
            || (isset($_GET['progress']) && (string) $_GET['progress'] === '1');
    }

    /**
     * Stream NDJSON progress for long imports (each line is one JSON object).
     * progress → {type,current,total,percent,imported,updated,skipped}
     * done     → {type,result:{imported,updated,skipped}}
     * error    → {type,error,status}.
     *
     * @param callable(?callable): array{imported: int, updated: int, skipped: int} $importFn
     */
    private function streamImportProgress(callable $importFn): void {
        $this->responseSent = true;

        // Disable output buffers so the browser sees progress lines early
        while (ob_get_level() > 0) {
            @ob_end_flush();
        }
        @ini_set('output_buffering', 'off');
        @ini_set('zlib.output_compression', '0');
        if (function_exists('apache_setenv')) {
            @apache_setenv('no-gzip', '1');
        }

        http_response_code(200);
        header('Content-Type: application/x-ndjson; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('X-Accel-Buffering: no'); // nginx: disable proxy buffering

        $emit = static function (array $payload): void {
            $flags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
            if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
                $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
            }
            echo json_encode($payload, $flags) . "\n";
            if (function_exists('ob_flush')) {
                @ob_flush();
            }
            flush();
        };

        // Immediate first line so nginx/browser leave "waiting for headers" state
        $emit([
            'type'     => 'progress',
            'current'  => 0,
            'total'    => 0,
            'percent'  => 0,
            'imported' => 0,
            'updated'  => 0,
            'skipped'  => 0,
            'phase'    => 'starting',
        ]);

        try {
            $result = $importFn(static function (
                int $current,
                int $total,
                int $imported,
                int $updated,
                int $skipped
            ) use ($emit): void {
                $percent = $total > 0 ? (int) min(100, max(0, (int) round(100 * $current / $total))) : 0;
                $emit([
                    'type'     => 'progress',
                    'current'  => $current,
                    'total'    => $total,
                    'percent'  => $percent,
                    'imported' => $imported,
                    'updated'  => $updated,
                    'skipped'  => $skipped,
                ]);
            });
            $emit([
                'type'   => 'done',
                'result' => [
                    'imported' => (int) ($result['imported'] ?? 0),
                    'updated'  => (int) ($result['updated'] ?? 0),
                    'skipped'  => (int) ($result['skipped'] ?? 0),
                ],
            ]);
        } catch (ApiException $e) {
            $emit([
                'type'   => 'error',
                'error'  => $e->getMessage(),
                'status' => $e->getStatus(),
            ]);
        } catch (\Throwable $e) {
            error_log('Baikal portal import stream: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
            $msg = 'Internal server error';
            if (stripos($e->getMessage(), 'Maximum execution time') !== false) {
                $msg = 'Import timed out. Try a smaller export, or import again (already-imported items update faster).';
            }
            $emit([
                'type'   => 'error',
                'error'  => $msg,
                'status' => 500,
            ]);
        }
    }
}
