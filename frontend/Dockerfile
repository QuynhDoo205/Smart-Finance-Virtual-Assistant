# Stage 1: Build resources
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install

# Copy source maps and resources
COPY . .

# Build Vite process
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine

# Copy built app to nginx docroot
COPY --from=build /app/dist /usr/share/nginx/html

# Build default Nginx custom config to support React routing (History push state / SPAs)
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
