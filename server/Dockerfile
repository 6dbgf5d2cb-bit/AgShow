FROM node:18-alpine

# 根证书 + bash（云托管「开放接口服务」依赖 shell）
RUN apk add --no-cache ca-certificates bash \
  && update-ca-certificates

ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
ENV NODE_OPTIONS=--use-openssl-ca

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
