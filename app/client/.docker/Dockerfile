FROM node:20-alpine AS builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ .
COPY shared/ /app/shared/
RUN npm run build

FROM nginx:1.27-alpine AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY client/.docker/nginx.conf /etc/nginx/conf.d/buster.conf
COPY --from=builder /app/client/dist/client/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
