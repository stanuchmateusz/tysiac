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
RUN sed -i 's/\r$//' ./generate_skins_json.sh && chmod +x ./generate_skins_json.sh
COPY customs /customs
RUN sh ./generate_skins_json.sh /customs
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
# nginx docker image automatically processes /etc/nginx/templates/*.template
# using envsubst and writes results to /etc/nginx/conf.d/
CMD ["nginx", "-g", "daemon off;"]
