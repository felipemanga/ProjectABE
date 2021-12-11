FROM node:dubnium
ARG ENV

WORKDIR /app
COPY . /app
RUN npm install -g gulp-cli
RUN npm install -g serve
RUN npm ci
RUN mkdir -p build
RUN gulp copy
RUN gulp web-build
EXPOSE 3000
CMD ["serve", "build"]
