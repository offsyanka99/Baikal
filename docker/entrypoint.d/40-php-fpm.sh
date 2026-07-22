#!/bin/sh
set -e
# Start PHP-FPM (package provides /etc/init.d/php8.2-fpm)
if [ -x /etc/init.d/php8.2-fpm ]; then
  /etc/init.d/php8.2-fpm start
elif [ -x /usr/sbin/php-fpm8.2 ]; then
  /usr/sbin/php-fpm8.2 --nodaemonize &
else
  echo "ERROR: php-fpm not found" >&2
  exit 1
fi
