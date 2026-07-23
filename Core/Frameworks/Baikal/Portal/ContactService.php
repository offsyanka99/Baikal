<?php

namespace Baikal\Portal;

use Sabre\CardDAV\Backend\PDO as CarddavBackend;
use Sabre\DAV\UUIDUtil;
use Sabre\VObject\Reader;

/**
 * Address book listing and vCard import/export via sabre/dav CardDAV backend.
 */
class ContactService {
    /** @var \PDO */
    private $pdo;

    /** @var CarddavBackend */
    private $backend;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
        $this->backend = new CarddavBackend($pdo);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listAddressBooks(string $username): array {
        $principal = 'principals/' . $username;
        $raw = $this->backend->getAddressBooksForUser($principal);
        $out = [];

        foreach ($raw as $ab) {
            $id = (int) ($ab['id'] ?? 0);
            if ($id <= 0) {
                continue;
            }
            $cards = $this->backend->getCards($id);
            $out[] = [
                'id'          => $id,
                'uri'         => (string) ($ab['uri'] ?? ''),
                'displayname' => (string) ($ab['{DAV:}displayname'] ?? $ab['uri'] ?? 'Contacts'),
                'description' => (string) ($ab['{urn:ietf:params:xml:ns:carddav}addressbook-description'] ?? ''),
                'cardCount'   => count($cards),
            ];
        }

        usort($out, static function ($a, $b) {
            return strcasecmp($a['displayname'], $b['displayname']);
        });

        return $out;
    }

    /**
     * @return array{vcf: string, filename: string, count: int}
     */
    public function exportAddressBook(string $username, int $addressBookId): array {
        $meta = $this->requireOwnedAddressBook($username, $addressBookId);
        $cards = $this->backend->getCards($addressBookId);
        $uris = [];
        foreach ($cards as $c) {
            if (!empty($c['uri'])) {
                $uris[] = (string) $c['uri'];
            }
        }

        $parts = [];
        $count = 0;
        if ($uris !== []) {
            foreach ($this->backend->getMultipleCards($addressBookId, $uris) as $row) {
                if (empty($row['carddata'])) {
                    continue;
                }
                $data = trim((string) $row['carddata']);
                if ($data === '') {
                    continue;
                }
                // Ensure each card ends with a newline for concatenation
                $parts[] = rtrim($data, "\r\n") . "\r\n";
                ++$count;
            }
        }

        $safeName = preg_replace('/[^a-zA-Z0-9-_ ]/u', '', $meta['displayname']) ?: 'contacts';
        $safeName = trim(preg_replace('/\s+/', '-', $safeName) ?? 'contacts', '-');
        $filename = $safeName . '-' . date('Y-m-d') . '.vcf';

        return [
            'vcf'      => implode("\r\n", $parts),
            'filename' => $filename,
            'count'    => $count,
        ];
    }

    /**
     * Import one or more vCards (Thunderbird/Apple multi-vcard .vcf).
     *
     * @return array{imported: int, updated: int, skipped: int}
     */
    public function importAddressBook(string $username, int $addressBookId, string $vcfData): array {
        if (function_exists('set_time_limit')) {
            @set_time_limit(300);
        }
        @ini_set('max_execution_time', '300');
        @ini_set('memory_limit', '256M');

        $this->requireOwnedAddressBook($username, $addressBookId);

        if (strncmp($vcfData, "\xEF\xBB\xBF", 3) === 0) {
            $vcfData = substr($vcfData, 3);
        }
        $vcfData = trim($vcfData);
        if ($vcfData === '') {
            throw new ApiException('vCard data is empty', 400);
        }
        if (strlen($vcfData) > 20 * 1024 * 1024) {
            throw new ApiException('vCard file is too large (max 20 MB)', 400);
        }

        $chunks = preg_split('/(?=BEGIN:VCARD)/i', $vcfData) ?: [];
        $cards = [];
        foreach ($chunks as $chunk) {
            $chunk = trim($chunk);
            if ($chunk === '' || stripos($chunk, 'BEGIN:VCARD') === false) {
                continue;
            }
            $cards[] = $chunk;
        }

        if ($cards === []) {
            throw new ApiException('No vCard entries found (expected BEGIN:VCARD … END:VCARD)', 400);
        }

        $existing = $this->listExistingCardUris($addressBookId);
        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $n = 0;

        foreach ($cards as $cardRaw) {
            ++$n;
            if (($n % 50) === 0 && function_exists('set_time_limit')) {
                @set_time_limit(300);
            }

            try {
                $parsed = Reader::read($cardRaw, Reader::OPTION_FORGIVING);
            } catch (\Throwable $e) {
                error_log('portal contact parse: ' . $e->getMessage());
                ++$skipped;
                continue;
            }

            if ($parsed->name !== 'VCARD') {
                $parsed->destroy();
                ++$skipped;
                continue;
            }

            $uid = isset($parsed->UID) ? (string) $parsed->UID : '';
            if ($uid === '') {
                $uid = UUIDUtil::getUUID();
                $parsed->UID = $uid;
            }

            // Prefer vCard 3.0 for widest client compatibility
            if (!isset($parsed->VERSION)) {
                $parsed->VERSION = '3.0';
            }

            $uri = $this->cardUriFromUid($uid);
            $serialized = $parsed->serialize();
            $parsed->destroy();

            try {
                if (isset($existing[$uri])) {
                    $this->backend->updateCard($addressBookId, $uri, $serialized);
                    ++$updated;
                } else {
                    $this->backend->createCard($addressBookId, $uri, $serialized);
                    $existing[$uri] = true;
                    ++$imported;
                }
            } catch (\Throwable $e) {
                error_log('portal contact import ' . $uri . ': ' . $e->getMessage());
                ++$skipped;
            }
        }

        return [
            'imported' => $imported,
            'updated'  => $updated,
            'skipped'  => $skipped,
        ];
    }

    /**
     * @return array{id: int, displayname: string, uri: string}
     */
    private function requireOwnedAddressBook(string $username, int $addressBookId): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT id, uri, displayname, principaluri FROM addressbooks WHERE id = ? AND principaluri = ?'
        );
        $stmt->execute([$addressBookId, $principal]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiException('Address book not found', 404);
        }

        return [
            'id'          => (int) $row['id'],
            'displayname' => (string) ($row['displayname'] ?: $row['uri'] ?: 'Contacts'),
            'uri'         => (string) $row['uri'],
        ];
    }

    /**
     * @return array<string, true>
     */
    private function listExistingCardUris(int $addressBookId): array {
        $stmt = $this->pdo->prepare('SELECT uri FROM cards WHERE addressbookid = ?');
        $stmt->execute([$addressBookId]);
        $map = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if (!empty($row['uri'])) {
                $map[(string) $row['uri']] = true;
            }
        }

        return $map;
    }

    private function cardUriFromUid(string $uid): string {
        $safe = preg_replace('/[^A-Za-z0-9_.@-]+/', '-', $uid) ?? '';
        $safe = trim($safe, '-.');
        if ($safe === '') {
            $safe = UUIDUtil::getUUID();
        }
        if (strlen($safe) > 180) {
            $safe = substr($safe, 0, 180);
        }

        return $safe . '.vcf';
    }
}
