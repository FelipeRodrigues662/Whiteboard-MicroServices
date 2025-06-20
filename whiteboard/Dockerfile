# Etapa 1: Build do frontend
FROM node:20 AS build
WORKDIR /app
COPY . .

# Criar arquivo .env com as URLs corretas para Minikube Tunnel
RUN echo "VITE_URL_AUTH=http://127.0.0.1:4020" > .env && \
    echo "VITE_URL_ENDPOINTS=http://127.0.0.1:4010" >> .env && \
    echo "VITE_URL_SESSION=ws://127.0.0.1:4000" >> .env

RUN yarn install && yarn build

# Etapa 2: Servir com NGINX
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]