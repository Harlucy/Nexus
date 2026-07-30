FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制服务器代码
COPY server.js ./

# 创建数据目录
RUN mkdir -p /app/data

# 设置环境变量
ENV CONFIG_FILE=/app/data/config.json

EXPOSE 25503

CMD ["node", "server.js"]
