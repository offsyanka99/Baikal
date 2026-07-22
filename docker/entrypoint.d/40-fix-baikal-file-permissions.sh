#!/bin/sh
# Ensure correct file permissions unless BAIKAL_SKIP_CHOWN is set
if [ -z "${BAIKAL_SKIP_CHOWN+x}" ]; then
  chown -R nginx:nginx /var/www/baikal
fi
