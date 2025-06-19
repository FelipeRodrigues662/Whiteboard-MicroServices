# Etapa 1: Build do frontend
FROM node:20 AS build
WORKDIR /app
COPY . .
ARG VITE_URL_AUTH
ARG VITE_URL_ENDPOINTS
ARG VITE_URL_SESSION
ENV VITE_URL_AUTH=$VITE_URL_AUTH
ENV VITE_URL_ENDPOINTS=$VITE_URL_ENDPOINTS
ENV VITE_URL_SESSION=$VITE_URL_SESSION
RUN yarn install && yarn build

# Etapa 2: Servir com NGINX
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]