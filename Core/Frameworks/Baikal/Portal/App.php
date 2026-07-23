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

    public function __construct(\PDO $pdo, array $config) {
        $realm = (string) ($config['system']['auth_realm'] ?? 'BaikalDAV');
        $this->auth = new Auth($pdo, $realm);
        $this->shares = new ShareService($pdo);
        $this->contacts = new ContactService($pdo);
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
            $body = $this->jsonBody();
            $user = $this->auth->login(
                (string) ($body['username'] ?? ''),
                (string) ($body['password'] ?? '')
            );

            return ['user' => $user];
        }

        if ($method === 'POST' && $path === '/logout') {
            $this->auth->logout();

            return ['ok' => true];
        }

        if ($method === 'GET' && ($path === '/me' || $path === '')) {
            $username = $this->auth->requireUser();

            return [
                'user'    => $this->auth->profile($username),
                'version' => defined('BAIKAL_VERSION') ? BAIKAL_VERSION : null,
                'davPath' => '/dav.php/',
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

        if ($method === 'POST' && preg_match('#^/addressbooks/(\d+)/import$#', $path, $m)) {
            $id = (int) $m[1];
            $vcf = $this->readPayloadField('vcf', ['text/vcard', 'text/x-vcard', 'text/directory']);
            $result = $this->contacts->importAddressBook($username, $id, $vcf);

            return $result;
        }

        throw new ApiException('Not found', 404);
    }

    private function readIcsPayload(): string {
        return $this->readPayloadField('ics', ['text/calendar']);
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
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new ApiException('Invalid JSON body', 400);
        }

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
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
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
