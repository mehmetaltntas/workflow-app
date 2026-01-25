# Deployment Guide

This guide covers deploying the Workflow application to production.

## Prerequisites

- Docker & Docker Compose (recommended)
- Or: Java 17, Node.js 18, PostgreSQL 14
- Domain name with SSL certificate
- Server with at least 2GB RAM

## Option 1: Docker Deployment (Recommended)

### Docker Compose Setup

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: workflow-db
    environment:
      POSTGRES_DB: workflow
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - workflow-network
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: workflow-backend
    environment:
      DB_NAME: workflow
      DB_USERNAME: ${DB_USERNAME}
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGINS: ${CORS_ORIGINS}
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/workflow
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    networks:
      - workflow-network
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${API_URL}
    container_name: workflow-frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - workflow-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  workflow-network:
    driver: bridge
```

### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM eclipse-temurin:17-jdk-alpine as build

WORKDIR /app
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

RUN ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Deploy with Docker Compose

```bash
# Create .env file
cat > .env << EOF
DB_USERNAME=workflow
DB_PASSWORD=secure_password_here
JWT_SECRET=your_64_character_secret_key_here_make_it_very_long_and_random
CORS_ORIGINS=https://your-domain.com
API_URL=https://your-domain.com/api
EOF

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Option 2: Manual Deployment

### Backend Deployment

#### Build JAR

```bash
cd backend
./mvnw clean package -DskipTests
```

The JAR will be at `target/backend-0.0.1-SNAPSHOT.jar`.

#### Create systemd Service

Create `/etc/systemd/system/workflow-backend.service`:

```ini
[Unit]
Description=Workflow Backend
After=syslog.target network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/workflow/backend
ExecStart=/usr/bin/java -jar backend.jar
SuccessExitStatus=143
Restart=always
RestartSec=10
Environment="DB_NAME=workflow"
Environment="DB_USERNAME=workflow"
Environment="DB_PASSWORD=secure_password"
Environment="JWT_SECRET=your_64_char_secret"
Environment="CORS_ORIGINS=https://your-domain.com"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable workflow-backend
sudo systemctl start workflow-backend
```

### Frontend Deployment

#### Build Static Files

```bash
cd frontend
VITE_API_URL=https://your-domain.com/api npm run build
```

The build will be in the `dist/` directory.

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/workflow;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo cp -r dist/* /var/www/workflow/
sudo systemctl reload nginx
```

## SSL Certificates

### Using Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

## Database Backup

### Automated Backups

Create `/opt/workflow/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/workflow/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USERNAME workflow > $BACKUP_DIR/workflow_$DATE.sql
gzip $BACKUP_DIR/workflow_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

Add to crontab:

```bash
0 2 * * * /opt/workflow/backup.sh
```

## Monitoring

### Health Checks

Backend health endpoint:
```bash
curl http://localhost:8080/actuator/health
```

### Log Management

```bash
# View backend logs
journalctl -u workflow-backend -f

# Docker logs
docker-compose logs -f backend
```

### Recommended Tools

- **Prometheus + Grafana**: Metrics monitoring
- **ELK Stack**: Log aggregation
- **Uptime Kuma**: Uptime monitoring

## Environment Variables Reference

### Required for Production

| Variable | Description |
|----------|-------------|
| `DB_NAME` | PostgreSQL database name |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password (use strong password) |
| `JWT_SECRET` | JWT signing key (min 64 chars, random) |
| `CORS_ORIGINS` | Your production domain |

### Optional

| Variable | Description |
|----------|-------------|
| `MAIL_HOST` | SMTP host for password reset |
| `MAIL_PORT` | SMTP port |
| `MAIL_USERNAME` | SMTP username |
| `MAIL_PASSWORD` | SMTP password |
| `GOOGLE_CLIENT_ID` | For Google OAuth |

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Strong database password
- [ ] Random 64+ char JWT secret
- [ ] Restrict CORS to your domain only
- [ ] Configure firewall (allow 80, 443 only)
- [ ] Enable rate limiting
- [ ] Set up automated backups
- [ ] Monitor for security updates
- [ ] Use non-root users for services

## Performance Optimization

### Backend

```properties
# application-prod.properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
server.compression.enabled=true
```

### Frontend

- Enable gzip compression in nginx
- Set long cache headers for static assets
- Use CDN for static files (optional)

### Database

```sql
-- Add indexes for common queries
CREATE INDEX idx_board_user ON board(user_id);
CREATE INDEX idx_task_list ON task(task_list_id);
CREATE INDEX idx_board_slug ON board(slug);
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
journalctl -u workflow-backend -n 100

# Check port
netstat -tlnp | grep 8080

# Check database connection
psql -h localhost -U workflow -d workflow
```

### 502 Bad Gateway

- Backend not running
- Wrong proxy_pass URL
- Firewall blocking internal traffic

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Check certificate
sudo certbot certificates
```
