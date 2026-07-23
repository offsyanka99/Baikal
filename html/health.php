<?php

/**
 * Lightweight liveness endpoint for reverse proxies / TrueNAS / orchestrators.
 * Does not require a completed install or database connection.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$root = is_dir(getcwd() . '/Core') ? getcwd() . '/' : dirname(getcwd()) . '/';

$version = 'unknown';
if (is_readable($root . 'Core/Distrib.php')) {
    require $root . 'Core/Distrib.php';
    if (defined('BAIKAL_VERSION')) {
        $version = BAIKAL_VERSION;
    }
}

$vendorOk = is_dir($root . 'vendor/sabre');
$configPath = $root . 'config/baikal.yaml';
$configured = is_readable($configPath);
$installLocked = is_file($root . 'Specific/INSTALL_DISABLED');

$status = 'ok';
$code = 200;
if (!$vendorOk) {
    $status = 'incomplete';
    $code = 503;
}

http_response_code($code);
echo json_encode([
    'status'        => $status,
    'name'          => 'Baikal',
    'version'       => $version,
    'configured'    => $configured,
    'installLocked' => $installLocked,
], JSON_UNESCAPED_SLASHES) . "\n";
