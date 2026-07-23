<?php

namespace Baikal\Portal;

/**
 * Lightweight per-calendar flags for the user portal (read-only, holidays country).
 * Stored under Specific/portal_meta.json.
 *
 * The read-only flag is also enforced for CalDAV clients by
 * {@see \Baikal\Core\Plugins\ReadOnlyPlugin} (registered on the DAV server).
 */
class PortalMeta {
    /** @var string */
    private $path;

    /** @var array<string, array<string, mixed>> */
    private $data = [];

    public function __construct(?string $path = null) {
        if ($path === null) {
            $path = (defined('PROJECT_PATH_SPECIFIC') ? PROJECT_PATH_SPECIFIC : '') . 'portal_meta.json';
        }
        $this->path = $path;
        $this->load();
    }

    /**
     * @return array{readOnly: bool, holidaysCountry: string|null}
     */
    public function get(int $instanceId): array {
        $key = (string) $instanceId;
        $row = $this->data[$key] ?? [];

        return [
            'readOnly'         => !empty($row['readOnly']),
            'holidaysCountry'  => isset($row['holidaysCountry']) && is_string($row['holidaysCountry'])
                ? $row['holidaysCountry']
                : null,
        ];
    }

    public function set(int $instanceId, array $flags): void {
        $key = (string) $instanceId;
        $cur = $this->get($instanceId);
        if (array_key_exists('readOnly', $flags)) {
            $cur['readOnly'] = (bool) $flags['readOnly'];
        }
        if (array_key_exists('holidaysCountry', $flags)) {
            $c = $flags['holidaysCountry'];
            $cur['holidaysCountry'] = is_string($c) && $c !== '' ? strtoupper($c) : null;
        }
        $this->data[$key] = $cur;
        $this->save();
    }

    public function isReadOnly(int $instanceId): bool {
        return $this->get($instanceId)['readOnly'];
    }

    private function load(): void {
        if (!is_readable($this->path)) {
            $this->data = [];

            return;
        }
        $raw = file_get_contents($this->path);
        if ($raw === false || trim($raw) === '') {
            $this->data = [];

            return;
        }
        $decoded = json_decode($raw, true);
        $this->data = is_array($decoded) ? $decoded : [];
    }

    private function save(): void {
        $dir = dirname($this->path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $json = json_encode($this->data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return;
        }
        file_put_contents($this->path, $json . "\n", LOCK_EX);
    }
}
