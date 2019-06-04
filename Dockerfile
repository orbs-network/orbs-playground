FROM golang:1.11.4-alpine

RUN apk add --no-cache nodejs npm git

RUN npm install -g typescript cross-env rimraf

WORKDIR /opt/orbs-playground

ADD package*.json /opt/orbs-playground/

RUN npm install

ADD . /opt/orbs-playground

RUN npm run build-server

CMD npm run start:prod
