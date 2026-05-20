# First build the base dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency info first
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY . .

# Production deployment pipeline
FROM node:20-alpine AS production

# Prevent app from running on the container root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Only copy what we need
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy app source from the builder
COPY --from=builder /app/server ./server
COPY --from=builder /app/rag ./rag
COPY --from=builder /app/public ./public  

# Make sure runtime files are owned by non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose the port your Express app uses
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 -O /dev/null http://localhost:3000/api/health || exit 1

# Use node directly to start up the sever
CMD ["node", "server/server.js"]