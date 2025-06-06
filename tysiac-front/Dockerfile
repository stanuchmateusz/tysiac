# Dockerfile for Vite/React Frontend
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY .env ./
COPY index.html ./
COPY public ./public
COPY src ./src
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
