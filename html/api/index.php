<?php

/**
 * User portal JSON API front controller.
 * Mounted at /api/* — used by the TypeScript SPA under /portal/.
 */

declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('session.cookie_httponly', '1');

header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    header('Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    http_response_code(204);
    exit;
}

// Project root: .../Baikal (html/api → two levels up)
$root = dirname(__DIR__, 2) . '/';
if (!is_dir($root . 'vendor')) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Incomplete installation (vendor missing)']);
    exit;
}

define('PROJECT_PATH_ROOT', $root);
define('BAIKAL_CONTEXT', true);
define('PROJECT_CONTEXT_BASEURI', '/');

require PROJECT_PATH_ROOT . 'vendor/autoload.php';
require PROJECT_PATH_ROOT . 'Core/Distrib.php';

// Path after /api : /api/login → /login ; /api/index.php/login → /login
$path = '';
if (!empty($_SERVER['PATH_INFO'])) {
    $path = (string) $_SERVER['PATH_INFO'];
} elseif (isset($_GET['path'])) {
    $path = '/' . ltrim((string) $_GET['path'], '/');
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if (preg_match('#/api(?:/index\.php)?(/.*)?$#', $uri, $m)) {
        $path = $m[1] ?? '';
    }
}

try {
    $app = \Baikal\Portal\App::bootstrap();
    $app->handle($_SERVER['REQUEST_METHOD'] ?? 'GET', $path);
} catch (\Baikal\Portal\ApiException $e) {
    http_response_code($e->getStatus());
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_SLASHES) . "\n";
} catch (\Throwable $e) {
    error_log('portal api bootstrap: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    // Avoid leaking install redirect as HTML; surface generic error
    echo json_encode(['error' => 'Internal server error']) . "\n";
}
