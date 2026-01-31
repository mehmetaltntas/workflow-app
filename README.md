# Workflow

A modern, full-stack task and project management application built with React and Spring Boot. Features Kanban boards, team collaboration, social connections, and multiple visualization views.

## Features

- **Board Management** - Create, organize, and track project boards (individual & team)
- **Task Lists** - Kanban-style columns for organizing tasks with drag & drop
- **Tasks & Subtasks** - Detailed task management with priority, deadlines, and subtasks
- **Labels** - Color-coded labels for task and list categorization
- **Board Members** - Team collaboration with member roles (Member, Moderator) and task assignments
- **Calendar View** - Visualize deadlines and due dates across boards
- **Miller Columns** - Hierarchical navigation view for boards
- **Team View** - Cross-board task visualization for team boards
- **Board Status View** - Group and filter boards by status
- **User Profiles** - Public/private profiles with avatars, bios, and activity stats
- **Social Connections** - Send/accept connection requests, view connections
- **Notifications** - Real-time notification bell for connections, assignments, and updates
- **Privacy Settings** - Granular privacy controls for profile visibility
- **Dark/Light Theme** - System-aware theme support
- **Authentication** - JWT-based auth with Google OAuth, email verification, and password reset
- **Real-time Filtering** - Filter by status, priority, labels, and dates
- **Account Management** - Profile editing, password changes, and account deletion scheduling

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** (Rolldown) for fast builds
- **React Query** for server state management
- **Zustand** for client state
- **React Router 7** for navigation
- **Axios** for HTTP requests
- **@tanstack/react-virtual** for virtual scrolling
- **Vitest** + **Cypress** for testing

### Backend
- **Spring Boot 4.0** with Java 17
- **PostgreSQL** database
- **Flyway** for database migrations
- **Spring Security** with JWT authentication
- **Spring HATEOAS** for hypermedia-driven APIs
- **SpringDoc OpenAPI** for API documentation
- **Bucket4j** for rate limiting
- **Caffeine** for caching

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

# Run the application (Flyway migrations run automatically)
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

## API Documentation

Once the backend is running, access the interactive API documentation at:
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Project Structure

```
workflow/
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/        # Auth guards (PrivateRoute, PublicRoute)
│   │   │   ├── board/       # Board-specific components
│   │   │   ├── error/       # Error boundary & fallbacks
│   │   │   ├── settings/    # Settings page sections
│   │   │   └── ui/          # Reusable UI components
│   │   ├── pages/           # Route pages (17 pages)
│   │   ├── hooks/           # Custom hooks & React Query
│   │   │   └── queries/     # Server state hooks
│   │   ├── stores/          # Zustand state stores
│   │   ├── services/        # API client (Axios)
│   │   ├── types/           # TypeScript interfaces
│   │   ├── contexts/        # React contexts (Theme)
│   │   ├── lib/             # Library configurations
│   │   ├── utils/           # Helper functions
│   │   └── styles/          # Design tokens
│   └── package.json
│
└── backend/                 # Spring Boot API
    ├── src/main/java/com/workflow/backend/
    │   ├── controller/      # 9 REST controllers
    │   ├── service/         # Business logic
    │   ├── entity/          # 15 JPA entities
    │   ├── repository/      # Data access (JPA)
    │   ├── dto/             # Data transfer objects
    │   ├── security/        # JWT & auth config
    │   ├── hateoas/         # HATEOAS models & assemblers
    │   ├── config/          # App configuration
    │   ├── exception/       # Custom exceptions
    │   ├── validation/      # Custom validators
    │   └── util/            # Utility classes
    ├── src/main/resources/
    │   ├── db/migration/    # 27 Flyway migrations
    │   └── application.properties
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
| `VITE_API_BASE_URL` | Backend API URL (defaults to `http://localhost:8080`) | No |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID for frontend | No |

## Scripts

### Frontend

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage report
npm run lint             # Run ESLint
npm run cypress:open     # Open Cypress for E2E tests (interactive)
npm run cypress:run      # Run Cypress E2E tests (headless)
```

### Backend

```bash
./mvnw spring-boot:run     # Run application
./mvnw test                # Run tests
./mvnw package             # Build JAR
./mvnw package -DskipTests # Build JAR without tests
./mvnw clean install       # Full build
./mvnw dependency:tree     # Show dependencies
```

## License

MIT
