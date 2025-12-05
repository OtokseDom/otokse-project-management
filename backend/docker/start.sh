#!/bin/bash

# Start PHP-FPM
php-fpm -D

# Clear all caches first
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# DON'T cache config in production if there are issues
# Only cache routes and views
php artisan route:cache
php artisan view:cache

# Start Nginx
nginx -g "daemon off;"