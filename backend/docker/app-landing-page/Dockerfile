FROM node:10.15-alpine

WORKDIR /usr/src/app

# Install packages
COPY package*.json ./
COPY yarn.lock ./
RUN npm install

# Copy app
COPY ./next.config.js ./
COPY ./pages ./pages
COPY ./public ./public

# Expose port
EXPOSE 3000

RUN yarn prod:build

# Run main script!
CMD [ "yarn", "prod:serve" ]
