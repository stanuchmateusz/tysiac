# Dockerfile for Vite/React Frontend
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
# Use .env.production for production builds
ARG ENV_FILE=.env
COPY ${ENV_FILE} .env
COPY index.html ./
COPY public ./public
COPY src ./src
COPY generate_skins_json.sh ./generate_skins_json.sh
RUN chmod +x ./generate_skins_json.sh
COPY customs /customs
RUN ./generate_skins_json.sh /customs
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
