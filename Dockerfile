# Multi-stage Dockerfile for Makeupi Store
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner
WORKDIR /app

# Install build dependencies for better-sqlite3 & sharp
RUN apk add --no-cache python3 make g++ sqlite-dev

# Copy backend package files
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

# Copy server code
COPY server/ ./

# Copy built frontend from Stage 1 into client/dist
COPY --from=frontend-builder /app/client/dist /app/client/dist

# Create persistent storage directories
RUN mkdir -p /app/server/data /app/server/uploads/products /app/server/uploads/banners /app/server/uploads/brands /app/server/uploads/categories

# Set environment
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/server/data/makeupi.db
ENV UPLOAD_DIR=/app/server/uploads

EXPOSE 5000

VOLUME ["/app/server/data", "/app/server/uploads"]

CMD ["node", "src/index.js"]
