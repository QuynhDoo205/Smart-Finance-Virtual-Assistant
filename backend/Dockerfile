# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm config set ignore-scripts true && pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Copy only production dependencies using pnpm
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm config set ignore-scripts true && pnpm install --prod

# Copy built files from previous stage
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
