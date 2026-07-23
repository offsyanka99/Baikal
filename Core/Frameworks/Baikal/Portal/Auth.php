<?php

namespace Baikal\Portal;

/**
 * Session auth for DAV users (same digesta1 scheme as Basic auth).
 *
 * Includes idle timeout, login rate limiting, CSRF token, and full logout.
 */
class Auth {
    public const SESSION_KEY = 'baikal_portal_user';
    public const SESSION_NAME = 'BAIKALPORTAL';
    public const CSRF_KEY = 'baikal_portal_csrf';
    public const LAST_SEEN_KEY = 'baikal_portal_last';
    public const LOGIN_AT_KEY = 'baikal_portal_login_at';

    /** @var int Default idle timeout (seconds) — matches admin default (15 min) */
    public const DEFAULT_SESSION_MAX_AGE = 900;

    /** @var int Max failed portal logins per IP per window */
    public const RATE_LIMIT_MAX = 20;

    /** @var int Rate-limit window (seconds) */
    public const RATE_LIMIT_WINDOW = 900;

    /** @var \PDO */
    private $pdo;

    /** @var string */
    private $authRealm;

    /** @var int */
    private $sessionMaxAge;

    public function __construct(\PDO $pdo, string $authRealm, int $sessionMaxAge = self::DEFAULT_SESSION_MAX_AGE) {
        $this->pdo = $pdo;
        $this->authRealm = $authRealm;
        $this->sessionMaxAge = $sessionMaxAge > 0 ? $sessionMaxAge : self::DEFAULT_SESSION_MAX_AGE;
    }

    public static function startSession(): void {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        // Harden session handling (admin already does this in Flake; portal may run first)
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');

        session_name(self::SESSION_NAME);
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => $secure,
            'httponly'  => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    public function username(): ?string {
        $u = $_SESSION[self::SESSION_KEY] ?? null;
        if (!is_string($u) || $u === '') {
            return null;
        }
        if (!$this->touchSession()) {
            return null;
        }

        return $u;
    }

    public function requireUser(): string {
        $u = $this->username();
        if ($u === null) {
            throw new ApiException('Not authenticated', 401);
        }

        return $u;
    }

    /**
     * @return array{username: string, displayname: string, email: string, principal: string, csrfToken: string}
     */
    public function login(string $username, string $password): array {
        $username = trim($username);
        if ($username === '' || $password === '') {
            throw new ApiException('Username and password are required', 400);
        }

        if ($this->isRateLimited()) {
            error_log('Baikal portal login rate limit exceeded for ' . $this->clientIp());
            throw new ApiException('Too many login attempts. Please try again later.', 429);
        }

        $stmt = $this->pdo->prepare('SELECT username, digesta1 FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            $this->registerFailedAttempt();
            $this->logFailedLogin($username);
            throw new ApiException('Invalid username or password', 401);
        }

        $hash = md5($username . ':' . $this->authRealm . ':' . $password);
        if (!hash_equals((string) $row['digesta1'], $hash)) {
            $this->registerFailedAttempt();
            $this->logFailedLogin($username);
            throw new ApiException('Invalid username or password', 401);
        }

        $this->clearFailedAttempts();
        session_regenerate_id(true);
        $_SESSION[self::SESSION_KEY] = $row['username'];
        $_SESSION[self::LOGIN_AT_KEY] = time();
        $_SESSION[self::LAST_SEEN_KEY] = time();
        $_SESSION[self::CSRF_KEY] = bin2hex(random_bytes(32));

        $profile = $this->profile($row['username']);
        $profile['csrfToken'] = $this->csrfToken();

        return $profile;
    }

    public function logout(): void {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $params['path'] ?? '/',
                'domain'   => $params['domain'] ?? '',
                'secure'   => (bool) ($params['secure'] ?? false),
                'httponly'  => (bool) ($params['httponly'] ?? true),
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
            session_destroy();
        }
        // Start a fresh empty session so subsequent API calls are clean
        if (session_status() !== PHP_SESSION_ACTIVE) {
            self::startSession();
        }
    }

    public function csrfToken(): string {
        if (empty($_SESSION[self::CSRF_KEY]) || !is_string($_SESSION[self::CSRF_KEY])) {
            $_SESSION[self::CSRF_KEY] = bin2hex(random_bytes(32));
        }

        return (string) $_SESSION[self::CSRF_KEY];
    }

    public function assertCsrf(?string $token): void {
        $expected = $_SESSION[self::CSRF_KEY] ?? '';
        if (!is_string($expected) || $expected === '' || $token === null || $token === '') {
            throw new ApiException('CSRF token missing', 403);
        }
        if (!hash_equals($expected, $token)) {
            throw new ApiException('CSRF token invalid', 403);
        }
    }

    /**
     * @return array{username: string, displayname: string, email: string, principal: string}
     */
    public function profile(string $username): array {
        $stmt = $this->pdo->prepare(
            'SELECT p.uri, p.displayname, p.email
             FROM principals p
             WHERE p.uri = ?'
        );
        $stmt->execute(['principals/' . $username]);
        $p = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];

        return [
            'username'    => $username,
            'displayname' => $p['displayname'] ?? $username,
            'email'       => $p['email'] ?? '',
            'principal'   => 'principals/' . $username,
        ];
    }

    /**
     * Refresh last-seen; return false if session expired.
     */
    private function touchSession(): bool {
        $last = isset($_SESSION[self::LAST_SEEN_KEY]) ? (int) $_SESSION[self::LAST_SEEN_KEY] : 0;
        $loginAt = isset($_SESSION[self::LOGIN_AT_KEY]) ? (int) $_SESSION[self::LOGIN_AT_KEY] : 0;
        if ($loginAt <= 0) {
            // Legacy sessions without timestamps — migrate once
            $_SESSION[self::LOGIN_AT_KEY] = time();
            $_SESSION[self::LAST_SEEN_KEY] = time();

            return true;
        }
        if ($last > 0 && (time() - $last) > $this->sessionMaxAge) {
            $this->logout();

            return false;
        }
        $_SESSION[self::LAST_SEEN_KEY] = time();

        return true;
    }

    private function logFailedLogin(string $username): void {
        // Same pattern as admin for Fail2Ban hooks
        error_log('Baikal portal authentication failure for user ' . preg_replace('/[^\w.@+-]/', '?', $username));
    }

    private function clientIp(): string {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        return is_string($ip) && $ip !== '' ? $ip : '0.0.0.0';
    }

    private function rateLimitPath(): string {
        $dir = defined('PROJECT_PATH_SPECIFIC') ? PROJECT_PATH_SPECIFIC : (defined('PROJECT_PATH_ROOT') ? PROJECT_PATH_ROOT . 'Specific/' : sys_get_temp_dir() . '/');

        return rtrim($dir, '/') . '/portal_login_rate.json';
    }

    private function loadRateData(): array {
        $path = $this->rateLimitPath();
        if (!is_readable($path)) {
            return [];
        }
        $raw = file_get_contents($path);
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);

        return is_array($data) ? $data : [];
    }

    private function saveRateData(array $data): void {
        $path = $this->rateLimitPath();
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $json = json_encode($data, JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return;
        }
        @file_put_contents($path, $json . "\n", LOCK_EX);
    }

    private function isRateLimited(): bool {
        $ip = $this->clientIp();
        $data = $this->loadRateData();
        $now = time();
        $row = $data[$ip] ?? null;
        if (!is_array($row)) {
            return false;
        }
        $start = (int) ($row['start'] ?? 0);
        $count = (int) ($row['count'] ?? 0);
        if ($start <= 0 || ($now - $start) > self::RATE_LIMIT_WINDOW) {
            return false;
        }

        return $count >= self::RATE_LIMIT_MAX;
    }

    private function registerFailedAttempt(): void {
        $ip = $this->clientIp();
        $data = $this->loadRateData();
        $now = time();
        $row = $data[$ip] ?? null;
        if (!is_array($row) || (int) ($row['start'] ?? 0) <= 0 || ($now - (int) $row['start']) > self::RATE_LIMIT_WINDOW) {
            $data[$ip] = ['start' => $now, 'count' => 1];
        } else {
            $data[$ip]['count'] = (int) ($row['count'] ?? 0) + 1;
        }
        // Prune stale IPs
        foreach ($data as $k => $v) {
            if (!is_array($v) || ($now - (int) ($v['start'] ?? 0)) > self::RATE_LIMIT_WINDOW * 2) {
                unset($data[$k]);
            }
        }
        $this->saveRateData($data);
    }

    private function clearFailedAttempts(): void {
        $ip = $this->clientIp();
        $data = $this->loadRateData();
        if (isset($data[$ip])) {
            unset($data[$ip]);
            $this->saveRateData($data);
        }
    }
}
