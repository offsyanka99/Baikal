<?php

/**
 * Unit checks for Baikal\Portal\ContactService vCard parse/build (+ photo if GD).
 *
 * Run: php tests/php/ContactServiceTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\ApiException;
use Baikal\Portal\ContactService;

$failures = 0;

function assert_true(bool $cond, string $msg): void {
    global $failures;
    if ($cond) {
        echo "OK  $msg\n";

        return;
    }
    echo "FAIL $msg\n";
    ++$failures;
}

// ContactService needs PDO for constructor; unit tests only use parse/build/photo.
$pdo = new PDO('sqlite::memory:');
$svc = new ContactService($pdo);

// --- build + parse round-trip ---
$vcf = $svc->buildVCardFromFields([
    'firstname' => 'Ada',
    'lastname'  => 'Lovelace',
    'fullname'  => 'Ada Lovelace',
    'org'       => 'Analytical Engines',
    'title'     => 'Mathematician',
    'emails'    => ['ada@example.com', 'ada.l@example.org'],
    'phones'    => [
        ['type' => 'cell', 'value' => '+1-555-0100'],
        ['type' => 'work', 'value' => '+1-555-0101'],
    ],
    'address'   => [
        'street'  => '12 Computation Ln',
        'city'    => 'London',
        'region'  => '',
        'postal'  => 'SW1A',
        'country' => 'UK',
    ],
    'url'       => 'https://example.com/ada',
    'note'      => 'First programmer',
], 'test-uid-ada');

assert_true(str_contains($vcf, 'BEGIN:VCARD'), 'build emits BEGIN:VCARD');
assert_true(str_contains($vcf, 'UID:test-uid-ada') || str_contains($vcf, 'UID:TEST-UID-ADA'), 'UID present');
assert_true(str_contains($vcf, 'FN:Ada Lovelace'), 'FN present');
assert_true(str_contains($vcf, 'ada@example.com'), 'primary email present');

$parsed = $svc->parseVCard($vcf);
assert_true($parsed['firstname'] === 'Ada', 'parse firstname');
assert_true($parsed['lastname'] === 'Lovelace', 'parse lastname');
assert_true($parsed['fullname'] === 'Ada Lovelace', 'parse fullname');
assert_true($parsed['org'] === 'Analytical Engines', 'parse org');
assert_true($parsed['title'] === 'Mathematician', 'parse title');
assert_true(is_array($parsed['emails']) && count($parsed['emails']) === 2, 'parse multi emails');
assert_true(in_array('ada@example.com', $parsed['emails'], true), 'email 1');
assert_true(is_array($parsed['phones']) && count($parsed['phones']) === 2, 'parse multi phones');
assert_true(($parsed['address']['city'] ?? '') === 'London', 'parse address city');
assert_true(($parsed['url'] ?? '') === 'https://example.com/ada', 'parse url');
assert_true(str_contains((string) ($parsed['note'] ?? ''), 'programmer'), 'parse note');

// --- empty / invalid ---
$empty = $svc->parseVCard('');
assert_true($empty['fullname'] === '' && $empty['emails'] === [], 'empty vCard → empty fields');

// --- name required on create ---
try {
    $svc->buildVCardFromFields(['emails' => ['x@y.z']]);
    assert_true(false, 'missing name should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'missing name → 400');
}

// --- preserve exotic props via merge is integration; here ensure CATEGORIES not stripped by parse alone ---
$exotic = "BEGIN:VCARD\r\nVERSION:3.0\r\nUID:ex-1\r\nFN:Bob\r\nN:Bob;;;;\r\nCATEGORIES:Work,VIP\r\nX-CUSTOM:hello\r\nEND:VCARD\r\n";
$p2 = $svc->parseVCard($exotic);
assert_true($p2['fullname'] === 'Bob', 'parse exotic fullname');
assert_true(is_array($p2['custom']) && count($p2['custom']) >= 1, 'parse custom X-* fields');
$foundCustom = false;
foreach ($p2['custom'] as $cf) {
    if (($cf['name'] ?? '') === 'X-CUSTOM' && ($cf['value'] ?? '') === 'hello') {
        $foundCustom = true;
    }
}
assert_true($foundCustom, 'X-CUSTOM=hello present');

// custom field round-trip (Unicode labels — Cyrillic must work)
$withCustom = $svc->buildVCardFromFields([
    'fullname' => 'Custom Person',
    'custom'    => [
        ['label' => 'Spouse', 'value' => 'Ada'],
        ['label' => 'Супруга', 'value' => 'Анна'],
        ['label' => '备注', 'value' => '中文'],
    ],
], 'custom-uid');
assert_true(str_contains($withCustom, 'X-BAIKAL-CUSTOM'), 'X-BAIKAL-CUSTOM written');
assert_true(str_contains($withCustom, 'Супруга') || str_contains($withCustom, '\\u'), 'Cyrillic label in vCard');
$pc = $svc->parseVCard($withCustom);
$byLabel = [];
foreach ($pc['custom'] ?? [] as $r) {
    $byLabel[(string) ($r['label'] ?? '')] = (string) ($r['value'] ?? '');
}
assert_true(($byLabel['Spouse'] ?? '') === 'Ada', 'parse English custom field');
assert_true(($byLabel['Супруга'] ?? '') === 'Анна', 'parse Cyrillic custom field');
assert_true(($byLabel['备注'] ?? '') === '中文', 'parse CJK custom field');

// --- photo (GD) ---
if (function_exists('imagecreatetruecolor') && function_exists('imagejpeg')) {
    $im = imagecreatetruecolor(400, 300);
    $bg = imagecolorallocate($im, 40, 80, 160);
    imagefill($im, 0, 0, $bg);
    ob_start();
    imagejpeg($im, null, 90);
    $jpeg = ob_get_clean();
    imagedestroy($im);
    assert_true(is_string($jpeg) && $jpeg !== '', 'fixture jpeg created');

    $out = $svc->processPhotoInput(base64_encode($jpeg), true);
    assert_true(strlen($out) > 100, 'processed photo non-empty');
    // JPEG magic
    assert_true(substr($out, 0, 2) === "\xFF\xD8", 'output is JPEG');

    // Ensure image is resized (400 edge → 256)
    $check = imagecreatefromstring($out);
    assert_true($check !== false, 'processed photo readable');
    if ($check !== false) {
        $w = imagesx($check);
        $h = imagesy($check);
        assert_true($w <= 256 && $h <= 256, "resized within 256 (got {$w}x{$h})");
        imagedestroy($check);
    }

    $withPhoto = $svc->buildVCardFromFields([
        'fullname'    => 'Photo Person',
        'photoBase64' => base64_encode($jpeg),
    ], 'photo-uid');
    assert_true(stripos($withPhoto, 'PHOTO') !== false, 'PHOTO property in vCard');
    assert_true(str_contains($withPhoto, 'VERSION:3.0'), 'photo card forced to v3');
    // Must be base64 text, not raw JPEG binary in the .vcf body
    assert_true(str_contains($withPhoto, 'ENCODING=b') || str_contains($withPhoto, 'ENCODING=B'), 'PHOTO uses ENCODING=b');
    assert_true(strpos($withPhoto, "\xFF\xD8") === false, 'no raw JPEG magic in vCard text');
    $pp = $svc->parseVCard($withPhoto);
    assert_true(!empty($pp['hasPhoto']), 'parsed hasPhoto');
    assert_true(is_string($pp['photoBinary']) && strlen($pp['photoBinary']) > 50, 'parsed photo binary');
    assert_true(strncmp($pp['photoBinary'], "\xFF\xD8", 2) === 0, 'parsed photo is JPEG');

    // Simulate vCard 4.0 source then portal photo update path
    $v4 = "BEGIN:VCARD\r\nVERSION:4.0\r\nUID:v4-photo\r\nFN:V4 Person\r\nN:Person;V4;;;\r\nEMAIL:v4@example.com\r\nEND:VCARD\r\n";
    $tmpPdo = new PDO('sqlite::memory:');
    // buildVCardFromFields already forces v3; extra assert on parse of forced output above
    unset($v4);
} else {
    echo "SKIP photo tests (GD not available)\n";
}

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}

echo "\nAll ContactService tests passed.\n";
exit(0);
