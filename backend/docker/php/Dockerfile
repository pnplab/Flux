FROM php:5.6-fpm-alpine

# Install mysqli extension
RUN docker-php-ext-install mysqli

# Install mcrypt extension
RUN apk update && apk add libmcrypt-dev \
    && docker-php-ext-install -j$(nproc) mcrypt

# Use the default production configuration - see https://github.com/php/php-src/blob/master/php.ini-production
RUN mv $PHP_INI_DIR/php.ini-production $PHP_INI_DIR/php.ini

# Enable 200M file upload for aware
RUN sed -r 's/;?[[:space:]]*upload_max_filesize[[:space:]]*=[[:space:]]*[0-9]+M/upload_max_filesize = 200M/g' <$PHP_INI_DIR/php.ini >$PHP_INI_DIR/php.ini

# Set timezone to fix breaking issue in aware dashboard as America/New_York (== Montréal)
RUN sed -r 's/;?[[:space:]]*date.timezone[[:space:]]*=[[:space:]]*[\w \/]*/date.timezone = America\/New_York/g' <$PHP_INI_DIR/php.ini >$PHP_INI_DIR/php.ini

# Expose docker env variables to php.
# @note www.conf didn't exist
RUN echo -e '[www]\nclear_env = no\n' >/usr/local/etc/php/conf.d/www.conf
