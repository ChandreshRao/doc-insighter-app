# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install

# Copy source code
COPY src/ ./src/

# Copy startup scripts and SQL files for builder stage
COPY scripts/ ./scripts/
COPY bin/ ./bin/
COPY sql/ ./sql/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies and postgresql client
RUN npm install --only=production && \
    apk add --no-cache postgresql-client

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy configuration files
COPY --chown=nodejs:nodejs env.example ./

# Copy startup scripts and SQL files
COPY --chown=nodejs:nodejs scripts/ ./scripts/
COPY --chown=nodejs:nodejs bin/ ./bin/
COPY --chown=nodejs:nodejs sql/ ./sql/

# Create necessary directories
RUN mkdir -p logs uploads && chown -R nodejs:nodejs logs uploads

# Make scripts executable
RUN chmod +x ./scripts/startup.sh ./bin/migrate.sh ./bin/setup-env.sh ./bin/copy-db-files.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with migrations
CMD ["sh", "./scripts/startup.sh"]
