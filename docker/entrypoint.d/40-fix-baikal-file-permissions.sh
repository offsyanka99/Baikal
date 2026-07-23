#!/bin/sh
# Ensure writable mounts are owned by nginx (uid 101).
#
# Full-tree chown of /var/www/baikal is slow on TrueNAS/bind mounts and can
# look "stuck". Only fix the volume mount points unless BAIKAL_SKIP_CHOWN is set.
#
# Prefer host-side ownership once:
#   chown -R 101:101 /mnt/tank/apps/baikal
# then set BAIKAL_SKIP_CHOWN=1 in compose for faster starts.

ME=$(basename "$0")

if [ -n "${BAIKAL_SKIP_CHOWN+x}" ]; then
  echo "$ME: info: BAIKAL_SKIP_CHOWN is set — skipping chown"
  exit 0
fi

# App files from the image are already owned by nginx. Only touch data mounts.
echo "$ME: info: fixing ownership on config/ and Specific/ (nginx:nginx)…"
chown -R nginx:nginx /var/www/baikal/config /var/www/baikal/Specific
echo "$ME: info: ownership fix done"
