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

    /** @var array<string, mixed>|null Cached JSON body (php://input is one-shot) */
    private $jsonBodyCache = null;

    public function __construct(\PDO $pdo, array $config) {
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

        try {
            // Binary/download responses (ICS / VCF export)
            if ($method === 'GET' && preg_match('#^/calendars/(\d+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->shares->exportCalendar($username, (int) $m[1]);
                $this->fileDownload($export['ics'], $export['filename'], 'text/calendar; charset=utf-8');

                return;
            }
            if ($method === 'GET' && preg_match('#^/addressbooks/(\d+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->contacts->exportAddressBook($username, (int) $m[1]);
                $this->fileDownload($export['vcf'], $export['filename'], 'text/vcard; charset=utf-8');

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

                return;
            }

            $result = $this->dispatch($method, $path);
            $this->json(200, $result);
        } catch (ApiException $e) {
            $this->json($e->getStatus(), ['error' => $e->getMessage()]);
        } catch (\Throwable $e) {
            error_log('Baikal portal API: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
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
        if ($method === 'POST' && $path === '/login') {
            $this->assertSameOrigin();
            $body = $this->jsonBody();
            $user = $this->auth->login(
                (string) ($body['username'] ?? ''),
                (string) ($body['password'] ?? '')
            );

            return ['user' => $user];
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
        if ($method === 'GET' && preg_match('#^/calendars/(\d+)/events$#', $path, $m)) {
            $instanceId = (int) $m[1];
            $from = isset($_GET['from']) ? (string) $_GET['from'] : '';
            $to = isset($_GET['to']) ? (string) $_GET['to'] : '';

            return [
                'events' => $this->shares->listEvents($username, $instanceId, $from, $to),
            ];
        }

        // POST /calendars/{id}/import — ICS body (JSON {ics} or raw text/calendar)
        if ($method === 'POST' && preg_match('#^/calendars/(\d+)/import$#', $path, $m)) {
            $instanceId = (int) $m[1];
            $ics = $this->readIcsPayload();
            $result = $this->shares->importCalendar($username, $instanceId, $ics);

            return $result;
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
            $result = $this->contacts->importAddressBook($username, $id, $vcf);

            return $result;
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
}
