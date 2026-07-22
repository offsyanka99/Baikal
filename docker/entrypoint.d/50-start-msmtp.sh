#!/bin/sh
# Optional SMTP relay for calendar invite emails (MSMTPRC env = full msmtprc body)
if [ -n "${MSMTPRC+x}" ] && [ -n "$MSMTPRC" ]; then
  echo "$MSMTPRC" > /etc/msmtprc
  chown root:msmtp /etc/msmtprc 2>/dev/null || chown root:root /etc/msmtprc
  chmod 644 /etc/msmtprc
fi
