<?php

namespace Baikal\Portal;

class ApiException extends \RuntimeException {
    /** @var int */
    private $status;

    public function __construct(string $message, int $status = 400) {
        parent::__construct($message);
        $this->status = $status;
    }

    public function getStatus(): int {
        return $this->status;
    }
}
