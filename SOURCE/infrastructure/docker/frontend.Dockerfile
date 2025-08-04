# =================================
# FRONTEND DOCKERFILE - PRODUCTION
# =================================
# Multi-stage build for Flutter Web application

# Build stage
FROM cirrusci/flutter:stable AS builder

# Set working directory
WORKDIR /app

# Enable Flutter web
RUN flutter config --enable-web

# Copy pubspec files
COPY frontend/pubspec.yaml frontend/pubspec.lock ./

# Get Flutter dependencies
RUN flutter pub get

# Copy source code
COPY frontend/ ./

# Build Flutter web application
RUN flutter build web --release \
    --web-renderer=canvaskit \
    --source-maps \
    --dart-define=ENVIRONMENT=production

# Production stage with Nginx
FROM nginx:alpine AS production

# Install additional tools
RUN apk add --no-cache curl

# Copy custom Nginx configuration
COPY infrastructure/configs/nginx.conf /etc/nginx/nginx.conf

# Copy built Flutter web app
COPY --from=builder /app/build/web /usr/share/nginx/html

# Copy additional static assets (if any)
COPY infrastructure/configs/nginx/ /etc/nginx/conf.d/

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Switch to non-root user
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]