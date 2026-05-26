FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 暴露端口（云托管默认 80）
EXPOSE 80

# 启动服务
CMD ["npm", "start"]