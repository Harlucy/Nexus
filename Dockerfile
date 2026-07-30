# 阶段1：构建前端
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 阶段2：运行时
FROM nginx:alpine

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制启动脚本
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# 从构建阶段复制产物
COPY --from=builder /app/dist /usr/share/nginx/html/

# 复制配置文件模板
COPY public/conf/config.example.js /usr/share/nginx/html/conf/config.js

EXPOSE 80

CMD ["/app/start.sh"]
