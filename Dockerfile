# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build the web application
WORKDIR /app/apps/web
RUN npm run build

# Build the API application
WORKDIR /app/apps/api
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets and necessary files
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/apps/api/package.json /app/apps/api/
COPY --from=builder /app/apps/api/dist /app/apps/api/dist
COPY --from=builder /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=builder /app/apps/web/dist /app/apps/web/dist

# We already copied node_modules from the builder.
# No need to run npm install again.
# Set production environment
ENV NODE_ENV=production
ENV PORT=3021

EXPOSE 3021

WORKDIR /app/apps/api
CMD ["npm", "run", "start"]
