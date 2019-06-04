FROM golang:1.11-alpine

RUN apk add --no-cache nodejs npm git

WORKDIR /opt/orbs-playground

ADD package*.json /opt/orbs-playground/

RUN npm install

ADD . /opt/orbs-playground

RUN npm run build

CMD npm run start
