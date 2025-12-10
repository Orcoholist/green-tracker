# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist/green-tracker /usr/share/nginx/html

# Копируем шаблон конфига
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Установим bash и утилиту для замены переменных
RUN apk add --no-cache bash

# Копируем скрипт старта
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

# Запускаем скрипт
ENTRYPOINT ["/entrypoint.sh"]