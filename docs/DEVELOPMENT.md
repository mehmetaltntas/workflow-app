# Development Guide

This guide will help you set up the development environment for the Workflow application.

## Prerequisites

- **Node.js** 18.x or higher
- **Java** 17 (JDK)
- **PostgreSQL** 14 or higher
- **Maven** 3.9+ (or use included wrapper)
- **Git**

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/workflow.git
cd workflow
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE workflow;

# Create user (optional)
CREATE USER workflow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE workflow TO workflow_user;
```

### 3. Backend Setup

```bash
cd backend
```

#### Configure Environment Variables

Create a `.env` file or set environment variables:

```bash
# Required
export DB_NAME=workflow
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your_super_secret_key_that_is_at_least_64_characters_long_for_security

# Optional
export CORS_ORIGINS=http://localhost:5173,http://localhost:3000
export MAIL_HOST=smtp.gmail.com
export MAIL_PORT=587
export MAIL_USERNAME=your_email@gmail.com
export MAIL_PASSWORD=your_app_password
export GOOGLE_CLIENT_ID=your_google_client_id
```

#### Run the Backend

```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or with Maven installed
mvn spring-boot:run
```

The backend will start at `http://localhost:8080`.

#### Verify Backend

- Health check: `http://localhost:8080/actuator/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

### 4. Frontend Setup

```bash
cd frontend
```

#### Install Dependencies

```bash
npm install
```

#### Configure Environment (Optional)

Create `.env.local` for custom settings:

```bash
VITE_API_URL=http://localhost:8080
```

#### Run the Frontend

```bash
npm run dev
```

The frontend will start at `http://localhost:5173`.

## Development Workflow

### Running Both Services

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### VS Code Setup

For VS Code users, create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Backend",
      "request": "launch",
      "mainClass": "com.workflow.backend.BackendApplication",
      "projectName": "backend",
      "env": {
        "DB_NAME": "workflow",
        "DB_USERNAME": "postgres",
        "DB_PASSWORD": "your_password",
        "JWT_SECRET": "your_64_char_secret_key"
      }
    }
  ]
}
```

### Hot Reload

- **Frontend**: Vite provides instant HMR (Hot Module Replacement)
- **Backend**: Spring Boot DevTools auto-restarts on file changes

## Code Style

### Frontend

- TypeScript strict mode enabled
- ESLint for linting
- Prettier for formatting (recommended)

```bash
# Run linter
npm run lint

# Fix lint issues
npm run lint -- --fix
```

### Backend

- Follow Java conventions
- Use Lombok for boilerplate reduction
- Spring Boot best practices

## Testing

### Frontend Tests

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests (Cypress)
npm run cypress:open    # Interactive mode
npm run cypress:run     # Headless mode
```

### Backend Tests

```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=BoardServiceTest

# Run with coverage
./mvnw test jacoco:report
```

## Project Structure

### Frontend Key Files

| File/Directory | Purpose |
|----------------|---------|
| `src/App.tsx` | Root component, routing setup |
| `src/services/api.ts` | Axios client, API services |
| `src/stores/` | Zustand state stores |
| `src/hooks/queries/` | React Query hooks |
| `src/styles/tokens.ts` | Design tokens |

### Backend Key Files

| File/Directory | Purpose |
|----------------|---------|
| `BackendApplication.java` | Entry point |
| `SecurityConfig.java` | Security configuration |
| `JwtService.java` | JWT token handling |
| `application.properties` | App configuration |

## Common Tasks

### Add a New API Endpoint

1. Create/update DTO in `dto/`
2. Add repository method if needed
3. Implement service method
4. Create controller endpoint
5. Add Swagger annotations
6. Write tests

### Add a New React Component

1. Create component in `components/`
2. Add types if needed in `types/`
3. Create query hook if fetching data
4. Import and use in pages
5. Write tests

### Add a New Page

1. Create page component in `pages/`
2. Add route in `App.tsx`
3. Add to navigation if needed
4. Protect with `PrivateRoute` if authenticated

## Troubleshooting

### Backend Won't Start

1. Check PostgreSQL is running
2. Verify database exists
3. Check environment variables
4. Look for port conflicts (8080)

```bash
# Check if port is in use
lsof -i :8080
```

### Frontend Won't Start

1. Delete `node_modules` and reinstall
2. Check Node version
3. Clear Vite cache

```bash
rm -rf node_modules
rm -rf .vite
npm install
npm run dev
```

### CORS Errors

1. Verify `CORS_ORIGINS` includes frontend URL
2. Check browser console for specific error
3. Restart backend after changing CORS config

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d workflow

# Check if PostgreSQL is running
pg_isready -h localhost -p 5432
```

### JWT Token Issues

1. Verify `JWT_SECRET` is at least 64 characters
2. Check token expiration times
3. Clear browser storage and re-login

## IDE Recommendations

### VS Code Extensions

- ESLint
- Prettier
- TypeScript Importer
- Extension Pack for Java
- Spring Boot Extension Pack

### IntelliJ IDEA

- Use Ultimate for Spring Boot support
- Enable Lombok annotation processing
- Configure code style for Java

## Database Migrations

Currently using `spring.jpa.hibernate.ddl-auto=update` for development.

For production, consider:
- Flyway
- Liquibase

## Useful Commands

```bash
# Backend
./mvnw clean install          # Full build
./mvnw spring-boot:run        # Run app
./mvnw test                   # Run tests
./mvnw dependency:tree        # Show dependencies

# Frontend
npm run dev                   # Start dev server
npm run build                 # Production build
npm run preview               # Preview build
npm run test                  # Run tests
npm run lint                  # Lint code
```
