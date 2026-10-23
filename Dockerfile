# outils-geo: a static site served by nginx.
# Listens on $PORT (default 8080), as most hosts expect.
FROM nginx:1.27-alpine
ENV PORT=8080
# The official image runs envsubst on /etc/nginx/templates/*.template at start.
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY site/ /usr/share/nginx/html/
EXPOSE 8080
