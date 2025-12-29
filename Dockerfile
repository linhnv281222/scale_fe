FROM node:18 AS build
WORKDIR /app
ENV NODE_OPTIONS=--max_old_space_size=4096
COPY package*.json ./
RUN npm install --legacy-peer-deps --verbose
COPY . .
RUN npm run build

FROM nginx:1.25.1-alpine-slim
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/scale /usr/share/nginx/html
COPY --from=build /app/scale.conf  /etc/nginx/conf.d/scale.conf
CMD ["nginx", "-g", "daemon off;"]
