FROM node:10-alpine

ENV NODE_WORKDIR /home/node/app

WORKDIR $NODE_WORKDIR

RUN npm install -g typescript
RUN npm install -g ts-node

ADD . $NODE_WORKDIR

RUN npm install

CMD ["ts-node", "./src/index.ts"]
