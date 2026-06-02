FROM node:18-alpine

# Alpine 默认无根证书，访问 api.weixin.qq.com 会 fetch failed
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY *.js ./
COPY container.config.json ./

RUN mkdir -p /app/data

ENV PORT=80
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data

EXPOSE 80

CMD ["npm", "start"]
