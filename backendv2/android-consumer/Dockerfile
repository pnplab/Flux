FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./
RUN yarn
COPY ./src/ src/

CMD [ "yarn", "start" ]
