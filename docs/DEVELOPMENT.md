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

The backend will start at `http://localhost:8080`. Flyway migrations run automatically on startup.

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
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id
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
# Run unit tests (Vitest)
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
| `src/App.tsx` | Root component, routing setup (19 routes) |
| `src/services/api.ts` | Axios client, all API service methods |
| `src/stores/authStore.ts` | Authentication state & token management |
| `src/stores/uiStore.ts` | UI preferences (view mode, sort, pinned boards) |
| `src/hooks/queries/` | React Query hooks for server state |
| `src/components/auth/` | Route guards (PrivateRoute, PublicRoute) |
| `src/components/board/` | Board-specific components & modals |
| `src/components/settings/` | Settings page sections (Profile, Privacy, Security, Account) |
| `src/components/ui/` | Reusable UI components (Skeleton, EmptyState, etc.) |
| `src/components/error/` | Error boundary & fallback components |
| `src/contexts/ThemeContext.tsx` | Dark/light theme context |
| `src/utils/` | Helpers (errorHandler, validation, progressCalculation) |
| `src/styles/tokens.ts` | Design tokens |

### Backend Key Files

| File/Directory | Purpose |
|----------------|---------|
| `BackendApplication.java` | Entry point |
| `SecurityConfig.java` | Security configuration |
| `JwtService.java` | JWT token handling |
| `application.properties` | App configuration |
| `src/main/resources/db/migration/` | 27 Flyway migration files |
| `controller/` | 9 REST controllers (Auth, Board, Task, Subtask, Label, User, BoardMember, Notification, Connection) |
| `hateoas/model/` | HATEOAS resource representations |
| `hateoas/assembler/` | DTO to HATEOAS model converters |

## Common Tasks

### Add a New API Endpoint

1. Create/update DTO in `dto/`
2. Add repository method if needed
3. Implement service method
4. Create controller endpoint
5. Add HATEOAS model and assembler if returning resources
6. Add Swagger annotations
7. Write tests

### Add a New React Component

1. Create component in appropriate `components/` subdirectory
2. Add types if needed in `types/index.ts`
3. Create React Query hook in `hooks/queries/` if fetching data
4. Import and use in pages
5. Write tests

### Add a New Page

1. Create page component in `pages/`
2. Add route in `App.tsx`
3. Wrap with `PrivateRoute` if authenticated-only
4. Add to navigation (Layout.tsx) if needed

### Add a Database Migration

1. Create a new file in `backend/src/main/resources/db/migration/`
2. Name it following the pattern: `V{next_number}__description.sql` (e.g., `V28__add_new_feature.sql`)
3. Write SQL DDL statements
4. Restart the backend - Flyway runs migrations automatically

## Troubleshooting

### Backend Won't Start

1. Check PostgreSQL is running
2. Verify database exists
3. Check environment variables
4. Look for port conflicts (8080)
5. Check Flyway migration errors in logs

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
2. Default allowed origins: `http://localhost:3000,http://localhost:5173,http://localhost:5174`
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
2. Access token expires in 15 minutes, refresh token in 3 days
3. Clear browser storage and re-login

### Flyway Migration Errors

1. Check the migration SQL syntax
2. Ensure migration version numbers are sequential
3. Never modify an already-applied migration - create a new one instead
4. Check `flyway_schema_history` table for applied migrations

```bash
psql -U postgres -d workflow -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank;"
```

## IDE Recommendations

### VS Code Extensions

- ESLint
- TypeScript Importer
- Extension Pack for Java
- Spring Boot Extension Pack

### IntelliJ IDEA

- Use Ultimate for Spring Boot support
- Enable Lombok annotation processing
- Configure code style for Java

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
npm run test                  # Run unit tests
npm run test:coverage         # Run tests with coverage
npm run lint                  # Lint code
npm run cypress:open          # E2E tests (interactive)
npm run cypress:run           # E2E tests (headless)
```
