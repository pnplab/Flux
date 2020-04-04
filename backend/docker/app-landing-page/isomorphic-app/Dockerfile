FROM node:10.15-alpine

WORKDIR /usr/src/app

# Install packages
COPY package*.json ./
COPY yarn.lock ./
RUN yarn

# Copy app
COPY ./.babelrc ./
COPY ./next.config.js ./
COPY ./pages ./pages
COPY ./public ./public
COPY ./components ./components

# Expose port
EXPOSE 3000

# Setup app env at build-time.
# @note ARG == build-time ENV. These can be overriden.
ARG USE_REVERSE_PROXIED_LINKS=false

# Build app.
RUN yarn prod:build

# Run main script!
CMD [ "yarn", "prod:serve" ]
