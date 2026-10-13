# Backend API — php-fpm only (no bundled nginx).
# TLS + routing + static SPA are handled by the ecommerce-nginx-1 container
# (see nginx/project.otokse.com.conf), which fastcgi_passes to project_backend:9000.
# Matches the ecommerce pattern: app container exposes 9000/tcp internally, no host ports.
FROM php:8.2-fpm

# Install system dependencies (curl kept for container health/debugging)
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (pdo_mysql, mbstring, exif, pcntl, bcmath, gd + zip)
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory (matches SCRIPT_FILENAME /var/www/html/public/index.php
# used by the nginx server block)
WORKDIR /var/www/html

# Copy application (exclusions in backend/.dockerignore)
COPY . /var/www/html

# Install PHP dependencies (production only)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Persist writable dirs for www-data
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 9000

# Entrypoint: wait for MySQL, migrate --force, cache, then exec php-fpm (foreground)
COPY docker/entrypoint.sh /usr/local/bin/project-entrypoint.sh
RUN chmod +x /usr/local/bin/project-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/project-entrypoint.sh"]
CMD ["php-fpm", "-F"]
