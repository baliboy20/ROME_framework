/**
 * /generate-nginx-config skill (Tier 1)
 * Generates Nginx reverse proxy configuration
 * Version: 1.0.0
 */

const fs = require('fs');

class GenerateNginxConfig {
  static async execute(params, executionId) {
    const { design_directory, output_file, port = 3000 } = params;

    try {
      const config = this.generateNginxConf(port);
      fs.writeFileSync(output_file, config);

      return { config_generated: true };

    } catch (error) {
      throw new Error(`Nginx configuration generation failed: ${error.message}`);
    }
  }

  static generateNginxConf(port) {
    return `# Nginx reverse proxy configuration
upstream backend {
    server localhost:${port};
    keepalive 64;
}

server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://backend/health;
    }

    # Static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`;
  }
}

module.exports = GenerateNginxConfig;
