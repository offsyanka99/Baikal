<?php

/**
 * Public service info (no secrets). Safe for status pages and companion apps.
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

$cal = $card = $tasks = $notes = null;
$authType = null;
$timezone = null;
$configured = false;

$configPath = $root . 'config/baikal.yaml';
if (is_readable($configPath) && is_readable($root . 'vendor/autoload.php')) {
    require_once $root . 'vendor/autoload.php';
    try {
        $config = \Symfony\Component\Yaml\Yaml::parseFile($configPath);
        $configured = true;
        $sys = $config['system'] ?? [];
        $cal = isset($sys['cal_enabled']) ? (bool) $sys['cal_enabled'] : null;
        $card = isset($sys['card_enabled']) ? (bool) $sys['card_enabled'] : null;
        $tasks = isset($sys['tasks_enabled']) ? (bool) $sys['tasks_enabled'] : true;
        $notes = isset($sys['notes_enabled']) ? (bool) $sys['notes_enabled'] : false;
        $authType = $sys['dav_auth_type'] ?? null;
        $timezone = $sys['timezone'] ?? null;
    } catch (\Throwable $e) {
        $configured = false;
    }
}

echo json_encode([
    'name'        => 'Baikal',
    'version'     => $version,
    'configured'  => $configured,
    'caldav'      => $cal,
    'carddav'     => $card,
    'tasks'       => $tasks,
    'notes'       => $notes,
    'davAuthType' => $authType,
    'timezone'    => $timezone,
    'endpoints'   => [
        'dav'    => '/dav.php/',
        'cal'    => '/cal.php/',
        'card'   => '/card.php/',
        'admin'  => '/admin/',
        'health' => '/health.php',
    ],
], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
