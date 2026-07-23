# Baïkal — multi-stage image built from this repository.
# Local:  docker build -t baikal:local .
# GHCR:   ghcr.io/offsyanka99/baikal:<tag>

# ---------------------------------------------------------------------------
# Stage 1: install PHP dependencies from composer.lock (reproducible)
# ---------------------------------------------------------------------------
FROM composer:2 AS builder

# `patch` is required by scripts/apply-vendor-patches.sh (post-install + explicit run)
RUN apk add --no-cache patch

WORKDIR /src

COPY composer.json composer.lock ./
COPY Core ./Core
COPY html ./html
COPY LICENSE SECURITY.md ./
# Vendor patches (e.g. dual-format calendar-timezone for Home Assistant)
COPY patches ./patches
COPY scripts/apply-vendor-patches.sh ./scripts/apply-vendor-patches.sh

RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader \
    && sh scripts/apply-vendor-patches.sh \
    && rm -f composer.json composer.lock

# ---------------------------------------------------------------------------
# Stage 2: nginx + PHP-FPM runtime
# ---------------------------------------------------------------------------
FROM nginx:1

RUN curl -fsSL -o /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg \
    && apt-get update \
    && apt-get install -y --no-install-recommends lsb-release ca-certificates \
    && echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" \
         > /etc/apt/sources.list.d/php.list \
    && apt-get remove -y lsb-release \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
         php8.2-cli \
         php8.2-curl \
         php8.2-fpm \
         php8.2-mbstring \
         php8.2-mysql \
         php8.2-pgsql \
         php8.2-sqlite3 \
         php8.2-xml \
         sqlite3 \
         msmtp \
         msmtp-mta \
         curl \
    && rm -rf /var/lib/apt/lists/* \
    && sed -i 's/www-data/nginx/g' /etc/php/8.2/fpm/pool.d/www.conf \
    && sed -i 's|^listen = .*|listen = /var/run/php-fpm.sock|' /etc/php/8.2/fpm/pool.d/www.conf \
    && sed -i 's/^;listen.owner = .*/listen.owner = nginx/' /etc/php/8.2/fpm/pool.d/www.conf \
    && sed -i 's/^;listen.group = .*/listen.group = nginx/' /etc/php/8.2/fpm/pool.d/www.conf \
    && sed -i 's/;clear_env = no/clear_env = no/' /etc/php/8.2/fpm/pool.d/www.conf

COPY --from=builder --chown=nginx:nginx /src /var/www/baikal
RUN mkdir -p /var/www/baikal/config /var/www/baikal/Specific/db \
    && chown -R nginx:nginx /var/www/baikal

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.d/ /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/*.sh

VOLUME ["/var/www/baikal/config", "/var/www/baikal/Specific"]

EXPOSE 80
# nginx image entrypoint runs /docker-entrypoint.d then nginx
