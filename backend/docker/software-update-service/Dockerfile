FROM node:10.15-alpine

WORKDIR /usr/src/app

# Install packages
COPY package*.json ./
RUN npm install

# Copy app
COPY ./src ./src
VOLUME ./src

# Expose port
EXPOSE 7983

# Run main script!
CMD [ "node", "src/software-update-service.js" ]
