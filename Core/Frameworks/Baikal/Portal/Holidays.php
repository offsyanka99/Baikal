<?php

namespace Baikal\Portal;

/**
 * Public holidays via Nager.Date (https://date.nager.at/) — no API key.
 */
class Holidays {
    private const BASE = 'https://date.nager.at/api/v3';

    /**
     * @return list<array{code: string, name: string}>
     */
    public static function countries(): array {
        $raw = self::httpGet(self::BASE . '/AvailableCountries');
        if ($raw === null) {
            return self::fallbackCountries();
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return self::fallbackCountries();
        }
        $out = [];
        foreach ($data as $row) {
            if (!is_array($row)) {
                continue;
            }
            $code = strtoupper((string) ($row['countryCode'] ?? ''));
            $name = (string) ($row['name'] ?? $code);
            if ($code === '' || strlen($code) !== 2) {
                continue;
            }
            $out[] = ['code' => $code, 'name' => $name];
        }
        usort($out, static function ($a, $b) {
            return strcasecmp($a['name'], $b['name']);
        });

        return $out !== [] ? $out : self::fallbackCountries();
    }

    public static function isValidCountryCode(string $code): bool {
        return (bool) preg_match('/^[A-Z]{2}$/', strtoupper(trim($code)));
    }

    /**
     * Build a VCALENDAR string of public holidays for year..year+1.
     */
    public static function buildIcs(string $countryCode, ?string $calendarName = null): string {
        $countryCode = strtoupper(trim($countryCode));
        if (!preg_match('/^[A-Z]{2}$/', $countryCode)) {
            throw new ApiException('Invalid country code', 400);
        }

        $year = (int) date('Y');
        $events = [];
        foreach ([$year, $year + 1] as $y) {
            $raw = self::httpGet(self::BASE . '/PublicHolidays/' . $y . '/' . rawurlencode($countryCode));
            if ($raw === null) {
                throw new ApiException(
                    'Could not fetch holidays for ' . $countryCode . ' (network or API unavailable)',
                    502
                );
            }
            $data = json_decode($raw, true);
            if (!is_array($data)) {
                continue;
            }
            foreach ($data as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $date = (string) ($row['date'] ?? '');
                $localName = (string) ($row['localName'] ?? $row['name'] ?? 'Holiday');
                $name = (string) ($row['name'] ?? $localName);
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                    continue;
                }
                $events[] = [
                    'date' => $date,
                    'summary' => $localName !== '' ? $localName : $name,
                ];
            }
        }

        if ($events === []) {
            throw new ApiException('No holidays returned for country ' . $countryCode, 404);
        }

        $calName = $calendarName ?: ('Holidays ' . $countryCode);
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Baikal Portal//Holidays//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:' . self::foldIcsText($calName),
        ];

        foreach ($events as $ev) {
            $uid = 'holiday-' . $countryCode . '-' . $ev['date'] . '@baikal-portal';
            $dt = str_replace('-', '', $ev['date']);
            // All-day event: DTEND is next day (exclusive)
            $end = date('Ymd', strtotime($ev['date'] . ' +1 day'));
            $lines[] = 'BEGIN:VEVENT';
            $lines[] = 'UID:' . $uid;
            $lines[] = 'DTSTAMP:' . gmdate('Ymd\THis\Z');
            $lines[] = 'DTSTART;VALUE=DATE:' . $dt;
            $lines[] = 'DTEND;VALUE=DATE:' . $end;
            $lines[] = 'SUMMARY:' . self::foldIcsText($ev['summary']);
            $lines[] = 'TRANSP:TRANSPARENT';
            $lines[] = 'END:VEVENT';
        }

        $lines[] = 'END:VCALENDAR';

        return implode("\r\n", $lines) . "\r\n";
    }

    private static function foldIcsText(string $text): string {
        $text = str_replace(["\r", "\n", ',', ';', '\\'], ['', ' ', '\\,', '\\;', '\\\\'], $text);

        return $text;
    }

    private static function httpGet(string $url): ?string {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            if ($ch === false) {
                return null;
            }
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT        => 15,
                CURLOPT_CONNECTTIMEOUT => 8,
                CURLOPT_USERAGENT      => 'Baikal-Portal/0.11.1-fork.2',
                CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            ]);
            $body = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if (PHP_VERSION_ID < 80500) {
                // curl_close() is a no-op / deprecated on PHP 8.5+
                curl_close($ch);
            }
            if ($body === false || $code < 200 || $code >= 300) {
                return null;
            }

            return (string) $body;
        }

        $ctx = stream_context_create([
            'http' => [
                'timeout' => 15,
                'header'  => "Accept: application/json\r\nUser-Agent: Baikal-Portal\r\n",
            ],
        ]);
        $body = @file_get_contents($url, false, $ctx);
        if ($body === false) {
            return null;
        }

        return $body;
    }

    /**
     * @return list<array{code: string, name: string}>
     */
    private static function fallbackCountries(): array {
        return [
            ['code' => 'CA', 'name' => 'Canada'],
            ['code' => 'US', 'name' => 'United States'],
            ['code' => 'GB', 'name' => 'United Kingdom'],
            ['code' => 'DE', 'name' => 'Germany'],
            ['code' => 'FR', 'name' => 'France'],
            ['code' => 'UA', 'name' => 'Ukraine'],
            ['code' => 'PL', 'name' => 'Poland'],
            ['code' => 'AU', 'name' => 'Australia'],
            ['code' => 'NZ', 'name' => 'New Zealand'],
            ['code' => 'IE', 'name' => 'Ireland'],
            ['code' => 'NL', 'name' => 'Netherlands'],
            ['code' => 'BE', 'name' => 'Belgium'],
            ['code' => 'CH', 'name' => 'Switzerland'],
            ['code' => 'AT', 'name' => 'Austria'],
            ['code' => 'IT', 'name' => 'Italy'],
            ['code' => 'ES', 'name' => 'Spain'],
            ['code' => 'PT', 'name' => 'Portugal'],
            ['code' => 'SE', 'name' => 'Sweden'],
            ['code' => 'NO', 'name' => 'Norway'],
            ['code' => 'DK', 'name' => 'Denmark'],
            ['code' => 'FI', 'name' => 'Finland'],
            ['code' => 'JP', 'name' => 'Japan'],
            ['code' => 'IN', 'name' => 'India'],
            ['code' => 'BR', 'name' => 'Brazil'],
            ['code' => 'MX', 'name' => 'Mexico'],
        ];
    }
}
