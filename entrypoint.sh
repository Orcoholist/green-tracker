# Подставляем значение переменной API_BASE_URL в nginx.conf
envsubst '$API_BASE_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Запускаем nginx
exec nginx -g 'daemon off;'