<?php

#################################################################
#  Copyright notice
#
#  (c) 2013 Jérôme Schneider <mail@jeromeschneider.fr>
#  All rights reserved
#
#  http://sabre.io/baikal
#
#  This script is part of the Baïkal Server project. The Baïkal
#  Server project is free software; you can redistribute it
#  and/or modify it under the terms of the GNU General Public
#  License as published by the Free Software Foundation; either
#  version 2 of the License, or (at your option) any later version.
#
#  The GNU General Public License can be found at
#  http://www.gnu.org/copyleft/gpl.html.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  This copyright notice MUST APPEAR in all copies of the script!
#################################################################

namespace BaikalAdmin\Core;

use Symfony\Component\Yaml\Yaml;

class Auth {
    /** @var int Default admin session idle lifetime (seconds) */
    const DEFAULT_SESSION_MAX_AGE = 900;

    /** @var int Max failed admin logins per IP per window */
    const RATE_LIMIT_MAX = 10;

    /** @var int Rate-limit window (seconds) */
    const RATE_LIMIT_WINDOW = 900;

    static function isAuthenticated() {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return false;
        }

        if (empty($_SESSION["baikaladminauth"]) || empty($_SESSION["baikaladmin_hash_fp"])) {
            return false;
        }

        try {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . "baikal.yaml");
        } catch (\Exception $e) {
            return false;
        }

        if (!isset($config['system']['admin_passwordhash']) || $config['system']['admin_passwordhash'] === "") {
            return false;
        }

        // Password change invalidates existing sessions
        $fp = self::passwordFingerprint($config['system']['admin_passwordhash']);
        if (!hash_equals($_SESSION["baikaladmin_hash_fp"], $fp)) {
            self::unAuthenticate();

            return false;
        }

        $maxAge = self::sessionMaxAgeSeconds($config);
        $loginAt = isset($_SESSION["baikaladmin_login_at"]) ? (int) $_SESSION["baikaladmin_login_at"] : 0;
        if ($loginAt <= 0 || (time() - $loginAt) > $maxAge) {
            self::unAuthenticate();

            return false;
        }

        // Rolling session: refresh activity timestamp while authenticated
        $_SESSION["baikaladmin_login_at"] = time();

        return true;
    }

    static function authenticate() {
        if (intval(\Flake\Util\Tools::POST("auth")) !== 1) {
            return false;
        }

        if (self::isRateLimited()) {
            error_log("Baikal admin login rate limit exceeded for " . self::clientIp(), 4);

            return false;
        }

        $sUser = \Flake\Util\Tools::POST("login");
        $sPass = \Flake\Util\Tools::POST("password");

        try {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . "baikal.yaml");
        } catch (\Exception $e) {
            error_log('Error reading baikal.yaml file : ' . $e->getMessage());

            return false;
        }

        if ($sUser !== "admin" || !isset($config['system']['admin_passwordhash'])) {
            self::registerFailedAttempt();

            return false;
        }

        $stored = $config['system']['admin_passwordhash'];
        $realm = $config['system']['auth_realm'] ?? "BaikalDAV";

        if (!self::verifyAdminPassword($sPass, $stored, $realm)) {
            self::registerFailedAttempt();

            return false;
        }

        self::clearFailedAttempts();

        // Upgrade legacy SHA-256 hashes to password_hash() on successful login
        if (!self::isModernPasswordHash($stored)) {
            $config['system']['admin_passwordhash'] = self::hashAdminPassword($sPass, $realm);
            file_put_contents(PROJECT_PATH_CONFIG . "baikal.yaml", Yaml::dump($config));
            $stored = $config['system']['admin_passwordhash'];
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }

        $_SESSION["baikaladminauth"] = true;
        $_SESSION["baikaladmin_login_at"] = time();
        $_SESSION["baikaladmin_hash_fp"] = self::passwordFingerprint($stored);

        return true;
    }

    static function unAuthenticate() {
        unset($_SESSION["baikaladminauth"], $_SESSION["baikaladmin_login_at"], $_SESSION["baikaladmin_hash_fp"]);
    }

    /**
     * Hash an admin password for storage.
     * Uses password_hash(); $sAuthRealm is kept for call-site compatibility and ignored.
     *
     * @param string $sPassword
     * @param string $sAuthRealm unused (legacy Digest-era parameter)
     *
     * @return string
     */
    static function hashAdminPassword($sPassword, $sAuthRealm = "") {
        return password_hash($sPassword, PASSWORD_DEFAULT);
    }

    /**
     * Verify admin password against stored hash (modern password_hash or legacy SHA-256).
     *
     * @param string $sPassword
     * @param string $sStoredHash
     * @param string $sAuthRealm
     *
     * @return bool
     */
    static function verifyAdminPassword($sPassword, $sStoredHash, $sAuthRealm) {
        if (self::isModernPasswordHash($sStoredHash)) {
            return password_verify($sPassword, $sStoredHash);
        }

        // Legacy (pre-fork hardening): sha256("admin:realm:password")
        $legacySha256 = hash('sha256', 'admin:' . $sAuthRealm . ':' . $sPassword);
        if (hash_equals($legacySha256, $sStoredHash)) {
            return true;
        }

        // Very old samples sometimes used raw md5; accept only for migration
        $legacyMd5 = md5('admin:' . $sAuthRealm . ':' . $sPassword);
        if (hash_equals($legacyMd5, $sStoredHash)) {
            return true;
        }

        return false;
    }

    /**
     * @param string $sStoredHash
     *
     * @return bool
     */
    static function isModernPasswordHash($sStoredHash) {
        return is_string($sStoredHash)
            && $sStoredHash !== ""
            && (str_starts_with($sStoredHash, '$2y$')
                || str_starts_with($sStoredHash, '$2a$')
                || str_starts_with($sStoredHash, '$2b$')
                || str_starts_with($sStoredHash, '$argon2'));
    }

    /**
     * @param string $sStoredHash
     *
     * @return string
     */
    static function passwordFingerprint($sStoredHash) {
        return hash('sha256', $sStoredHash);
    }

    /**
     * @param array $config
     *
     * @return int
     */
    static function sessionMaxAgeSeconds(array $config) {
        if (isset($config['system']['session_max_age_minutes'])
            && is_numeric($config['system']['session_max_age_minutes'])
            && (int) $config['system']['session_max_age_minutes'] > 0
        ) {
            return (int) $config['system']['session_max_age_minutes'] * 60;
        }

        return self::DEFAULT_SESSION_MAX_AGE;
    }

    /**
     * Apply session cookie / GC settings before session_start().
     *
     * @return void
     */
    static function configureSession() {
        $maxAge = self::DEFAULT_SESSION_MAX_AGE;
        try {
            if (defined('PROJECT_PATH_CONFIG') && file_exists(PROJECT_PATH_CONFIG . "baikal.yaml")) {
                $config = Yaml::parseFile(PROJECT_PATH_CONFIG . "baikal.yaml");
                $maxAge = self::sessionMaxAgeSeconds($config);
            }
        } catch (\Exception $e) {
            // keep default
        }

        ini_set('session.gc_maxlifetime', (string) $maxAge);
        ini_set('session.cookie_httponly', '1');
        ini_set('session.use_strict_mode', '1');
        if (\Flake\Util\Tools::getCurrentProtocol() === 'https') {
            ini_set('session.cookie_secure', '1');
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_set_cookie_params([
                'lifetime' => 0,
                'path'     => '/',
                'secure'   => \Flake\Util\Tools::getCurrentProtocol() === 'https',
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        }
    }

    protected static function clientIp() {
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    protected static function rateLimitFile() {
        $dir = defined('PROJECT_PATH_SPECIFIC') ? PROJECT_PATH_SPECIFIC : sys_get_temp_dir() . '/';

        return rtrim($dir, '/') . '/admin_login_rate.json';
    }

    protected static function loadRateLimitState() {
        $file = self::rateLimitFile();
        if (!is_readable($file)) {
            return [];
        }
        $data = json_decode((string) file_get_contents($file), true);

        return is_array($data) ? $data : [];
    }

    protected static function saveRateLimitState(array $state) {
        $file = self::rateLimitFile();
        $dir = dirname($file);
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        @file_put_contents($file, json_encode($state), LOCK_EX);
    }

    protected static function isRateLimited() {
        $ip = self::clientIp();
        $state = self::loadRateLimitState();
        $now = time();
        if (!isset($state[$ip]) || !is_array($state[$ip])) {
            return false;
        }
        // Drop attempts outside window
        $state[$ip] = array_values(array_filter(
            $state[$ip],
            function ($ts) use ($now) {
                return ($now - (int) $ts) < self::RATE_LIMIT_WINDOW;
            }
        ));
        self::saveRateLimitState($state);

        return count($state[$ip]) >= self::RATE_LIMIT_MAX;
    }

    protected static function registerFailedAttempt() {
        $ip = self::clientIp();
        $state = self::loadRateLimitState();
        $now = time();
        if (!isset($state[$ip]) || !is_array($state[$ip])) {
            $state[$ip] = [];
        }
        $state[$ip] = array_values(array_filter(
            $state[$ip],
            function ($ts) use ($now) {
                return ($now - (int) $ts) < self::RATE_LIMIT_WINDOW;
            }
        ));
        $state[$ip][] = $now;
        // Prune other IPs with empty windows
        foreach ($state as $k => $attempts) {
            if (!is_array($attempts) || count($attempts) === 0) {
                unset($state[$k]);
            }
        }
        self::saveRateLimitState($state);
    }

    protected static function clearFailedAttempts() {
        $ip = self::clientIp();
        $state = self::loadRateLimitState();
        unset($state[$ip]);
        self::saveRateLimitState($state);
    }
}
