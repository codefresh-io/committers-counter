FROM node:16.15-alpine

WORKDIR /committers-counter

RUN apk --no-cache update

COPY package.json ./

COPY yarn.lock ./

# install required binaries
RUN yarn install --forzen-lockfile --production && \
    yarn cache clean

# copy app files
COPY . ./

#add codefresh user and change work directories permissions
RUN adduser -D -h /home/cfu -s /bin/bash cfu \
    && chgrp -R $(id -g cfu) /committers-counter /root \
    && chmod -R g+rwX /committers-counter /root
USER cfu

# run application
CMD ["node", "index.js"]
