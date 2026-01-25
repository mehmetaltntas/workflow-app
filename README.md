# Workflow

A modern task management application built with React and Spring Boot.

## Features

- **Board Management** - Create, organize, and track project boards
- **Task Lists** - Kanban-style columns for organizing tasks
- **Tasks & Subtasks** - Detailed task management with subtasks support
- **Labels** - Color-coded labels for categorization
- **Drag & Drop** - Intuitive task reordering and moving between lists
- **Calendar View** - Visualize deadlines and due dates
- **Miller Columns** - Hierarchical navigation view
- **Dark/Light Theme** - System-aware theme support
- **Authentication** - JWT-based auth with Google OAuth support
- **Real-time Filtering** - Filter by status, priority, labels, and dates

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** (Rolldown) for blazing fast builds
- **React Query** for server state management
- **Zustand** for client state
- **React Router 7** for navigation
- **Axios** for HTTP requests

### Backend
- **Spring Boot 4.0** with Java 17
- **PostgreSQL** database
- **Spring Security** with JWT authentication
- **Spring HATEOAS** for hypermedia-driven APIs
- **SpringDoc OpenAPI** for API documentation

## Quick Start

### Prerequisites
- Node.js 18+
- Java 17+
- PostgreSQL 14+
- Maven 3.9+

### Backend Setup

```bash
cd backend

# Set environment variables
export DB_NAME=workflow
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your_64_character_secret_key_here_make_it_long_and_random

# Run the application
./mvnw spring-boot:run
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:8080`.

## Documentation

- [Development Setup](docs/DEVELOPMENT.md) - Detailed local development guide
- [Architecture](docs/ARCHITECTURE.md) - System architecture and design decisions
- [API Reference](docs/API.md) - REST API endpoints documentation
- [Deployment](docs/DEPLOYMENT.md) - Production deployment guide
- [Contributing](CONTRIBUTING.md) - Contribution guidelines

## API Documentation

Once the backend is running, access the interactive API documentation at:
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Project Structure

```
workflow/
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Route pages
│   │   ├── hooks/           # Custom hooks & React Query
│   │   ├── stores/          # Zustand state stores
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript interfaces
│   │   └── styles/          # Design tokens
│   └── package.json
│
└── backend/                 # Spring Boot API
    ├── src/main/java/com/workflow/backend/
    │   ├── controller/      # REST controllers
    │   ├── service/         # Business logic
    │   ├── entity/          # JPA entities
    │   ├── repository/      # Data access
    │   ├── dto/             # Data transfer objects
    │   ├── security/        # JWT & auth
    │   └── hateoas/         # HATEOAS models
    └── pom.xml
```

## Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_NAME` | PostgreSQL database name | Yes |
| `DB_USERNAME` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | JWT signing key (min 64 chars) | Yes |
| `CORS_ORIGINS` | Allowed CORS origins | No |
| `MAIL_HOST` | SMTP server host | No |
| `MAIL_PORT` | SMTP server port | No |
| `MAIL_USERNAME` | SMTP username | No |
| `MAIL_PASSWORD` | SMTP password | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | No (defaults to localhost:8080) |

## Scripts

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run lint         # Run ESLint
npm run cypress:open # Open Cypress for E2E tests
```

### Backend

```bash
./mvnw spring-boot:run     # Run application
./mvnw test                # Run tests
./mvnw package             # Build JAR
./mvnw package -DskipTests # Build JAR without tests
```

## License

MIT
