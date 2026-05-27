FROM node:18-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY auth-phone.js ./
COPY container.config.json ./

RUN mkdir -p /app/data

ENV PORT=80
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data

EXPOSE 80

CMD ["npm", "start"]
