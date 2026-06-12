# ===== Stage 1: Build =====
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm install --silent
COPY . .
RUN npm run build

# ===== Stage 2: Production (Nginx) =====
FROM nginx:alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:80 || exit 1
CMD ["nginx", "-g", "daemon off;"]
