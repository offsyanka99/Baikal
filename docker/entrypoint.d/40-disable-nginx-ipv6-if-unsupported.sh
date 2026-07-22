#!/bin/sh
set -e
ME=$(basename "$0")

# Disable IPv6 listen if the kernel has no IPv6 (common in some containers)
if nginx -t 2>&1 | grep -q '\[emerg\] socket() \[::\]:80 failed'; then
  echo "$ME: info: Disable IPv6 in nginx configuration"
  sed -i 's/listen \[::\]:80;/# listen [::]:80;/' /etc/nginx/conf.d/default.conf
fi
