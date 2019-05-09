FROM nginx:1.15-alpine

RUN ln -sf /dev/stdout /var/log/nginx/access.log && ln -sf /dev/stderr /var/log/nginx/error.log

CMD ["nginx-debug", "-g", "daemon off;"]
