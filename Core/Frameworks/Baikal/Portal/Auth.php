<?php

namespace Baikal\Portal;

/**
 * Session auth for DAV users (same digesta1 scheme as Basic auth).
 */
class Auth {
    public const SESSION_KEY = 'baikal_portal_user';
    public const SESSION_NAME = 'BAIKALPORTAL';

    /** @var \PDO */
    private $pdo;

    /** @var string */
    private $authRealm;

    public function __construct(\PDO $pdo, string $authRealm) {
        $this->pdo = $pdo;
        $this->authRealm = $authRealm;
    }

    public static function startSession(): void {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
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

        return is_string($u) && $u !== '' ? $u : null;
    }

    public function requireUser(): string {
        $u = $this->username();
        if ($u === null) {
            throw new ApiException('Not authenticated', 401);
        }

        return $u;
    }

    public function login(string $username, string $password): array {
        $username = trim($username);
        if ($username === '' || $password === '') {
            throw new ApiException('Username and password are required', 400);
        }

        $stmt = $this->pdo->prepare('SELECT username, digesta1 FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiException('Invalid username or password', 401);
        }

        $hash = md5($username . ':' . $this->authRealm . ':' . $password);
        if (!hash_equals((string) $row['digesta1'], $hash)) {
            throw new ApiException('Invalid username or password', 401);
        }

        session_regenerate_id(true);
        $_SESSION[self::SESSION_KEY] = $row['username'];

        return $this->profile($row['username']);
    }

    public function logout(): void {
        unset($_SESSION[self::SESSION_KEY]);
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
    }

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
}
