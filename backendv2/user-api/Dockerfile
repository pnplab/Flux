FROM node:13.7.0-alpine

WORKDIR /usr/src/app

# Install packages.
COPY package*.json ./
RUN yarn

# Copy app.
COPY ./index.js ./

# Expose port.
EXPOSE 3001

# Run main script!
CMD [ "yarn", "prod:serve" ]
