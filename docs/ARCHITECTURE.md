# Architecture

This document describes the system architecture and design decisions for the Workflow application.

## Overview

Workflow is a full-stack monorepo application following a client-server architecture with a React SPA frontend and Spring Boot REST API backend.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  React 19 + TypeScript + Vite                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │   Zustand   │  │ React Query  │  │     React Router        │ │
│  │ (UI State)  │  │(Server State)│  │     (Navigation)        │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / REST + HATEOAS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot 4)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Controllers │──│   Services   │──│     Repositories        │ │
│  │  (REST API) │  │(Business)    │  │     (Data Access)       │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Security   │  │   HATEOAS    │  │     Validation          │ │
│  │  (JWT)      │  │  (Hypermedia)│  │     (Bean)              │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JDBC
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                                │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── BoardCard.tsx    # Board display card
│   ├── FilterBar.tsx    # Filtering controls
│   ├── Layout.tsx       # Main layout wrapper
│   └── ...
├── pages/               # Route-level components
│   ├── HomePage.tsx     # Dashboard
│   ├── BoardsPage.tsx   # Board listing
│   ├── BoardDetailPage.tsx
│   └── ...
├── hooks/               # Custom React hooks
│   └── queries/         # React Query hooks
│       ├── useBoards.ts
│       └── useBoardMutations.ts
├── stores/              # Zustand state stores
│   ├── authStore.ts     # Authentication state
│   └── uiStore.ts       # UI preferences
├── services/            # API client layer
│   └── api.ts           # Axios instance & services
├── types/               # TypeScript interfaces
├── styles/              # Design tokens & theming
│   └── tokens.ts        # CSS variables
├── contexts/            # React contexts
│   └── ThemeContext.tsx
├── lib/                 # Library configurations
│   └── queryClient.ts   # React Query setup
└── utils/               # Helper functions
```

### State Management Strategy

The application uses a dual state management approach:

**1. Server State (React Query)**
- All data from the API (boards, tasks, labels)
- Handles caching, background refetching, optimistic updates
- Located in `hooks/queries/`

**2. Client State (Zustand)**
- UI preferences (view mode, sort options)
- Authentication tokens
- Pinned boards
- Persisted to localStorage

### Component Patterns

- **Container/Presentational**: Pages fetch data, components display it
- **Composition**: Complex UIs built from smaller components
- **Hooks-first**: Business logic extracted into custom hooks

### Routing

React Router 7 with protected routes:

```
/                    # Landing page (public)
/login               # Login page (public)
/register            # Register page (public)
/forgot-password     # Password reset (public)
/home                # Dashboard (protected)
/boards              # Board listing (protected)
/boards/:slug        # Board detail (protected)
/calendar            # Calendar view (protected)
/profile             # User profile (protected)
/settings            # Settings (protected)
```

## Backend Architecture

### Directory Structure

```
backend/src/main/java/com/workflow/backend/
├── controller/          # REST endpoints
│   ├── AuthController.java
│   ├── BoardController.java
│   ├── TaskController.java
│   ├── SubtaskController.java
│   ├── LabelController.java
│   └── UserController.java
├── service/             # Business logic
│   ├── BoardService.java
│   ├── TaskService.java
│   ├── UserService.java
│   └── ...
├── repository/          # Data access (JPA)
├── entity/              # Domain models
│   ├── User.java
│   ├── Board.java
│   ├── TaskList.java
│   ├── Task.java
│   ├── Subtask.java
│   └── Label.java
├── dto/                 # Request/Response objects
├── hateoas/             # Hypermedia models
│   ├── model/           # Resource representations
│   └── assembler/       # DTO → Model converters
├── security/            # Auth & JWT
│   ├── JwtService.java
│   ├── JwtFilter.java
│   └── SecurityConfig.java
├── config/              # App configuration
├── exception/           # Custom exceptions
└── validation/          # Custom validators
```

### Layered Architecture

```
Request → Controller → Service → Repository → Database
                ↓
            Assembler → HATEOAS Model → Response
```

**Controller Layer**
- Handles HTTP requests/responses
- Input validation
- Delegates to services
- Returns HATEOAS models

**Service Layer**
- Business logic
- Transaction management
- Authorization checks
- Cross-cutting concerns

**Repository Layer**
- Data access via Spring Data JPA
- Custom queries when needed
- No business logic

### Security

**Authentication Flow**
1. User submits credentials (or Google OAuth token)
2. Backend validates and generates JWT access token + refresh token
3. Access token (15 min) sent with each request
4. Refresh token (7 days) used to get new access tokens

**Authorization**
- Resource ownership verified in service layer
- Users can only access their own boards/tasks
- `AuthorizationService` handles permission checks

### API Design

The API follows REST principles with HATEOAS (Richardson Maturity Level 3):

```json
{
  "id": 1,
  "name": "My Board",
  "status": "IN_PROGRESS",
  "_links": {
    "self": { "href": "/boards/1" },
    "tasks": { "href": "/boards/1/details" },
    "delete": { "href": "/boards/1" }
  }
}
```

**Benefits**:
- Self-documenting responses
- Client-driven navigation
- API evolution without breaking clients

## Data Model

```
┌──────────────────┐
│      User        │
├──────────────────┤
│ id               │
│ username         │
│ email            │
│ password         │
│ profilePicture   │
│ authProvider     │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────┐
│      Board       │ 1:N   │      Label       │
├──────────────────┤◄─────►├──────────────────┤
│ id               │       │ id               │
│ name             │       │ name             │
│ slug             │       │ color            │
│ description      │       │ boardId          │
│ status           │       └──────────────────┘
│ deadline         │
│ userId           │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐
│    TaskList      │
├──────────────────┤
│ id               │
│ name             │
│ position         │
│ boardId          │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐       ┌──────────────────┐
│      Task        │ N:N   │      Label       │
├──────────────────┤◄─────►├──────────────────┤
│ id               │       │ (via task_labels)│
│ title            │       └──────────────────┘
│ description      │
│ priority         │
│ deadline         │
│ position         │
│ taskListId       │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐
│     Subtask      │
├──────────────────┤
│ id               │
│ title            │
│ completed        │
│ taskId           │
└──────────────────┘
```

## Design Decisions

### Why React Query over Redux?

- Server state is inherently different from client state
- Built-in caching and background refetching
- Less boilerplate, more productivity
- Optimistic updates out of the box

### Why Zustand over Context?

- Better performance (no unnecessary re-renders)
- Simpler API
- Built-in persistence
- DevTools support

### Why HATEOAS?

- Self-describing API
- Clients don't need to construct URLs
- API can evolve without breaking clients
- Hypermedia as the engine of application state

### Why Spring Boot 4?

- Latest features and performance
- Virtual threads support (Project Loom)
- Better observability
- GraalVM native image support

## Performance Considerations

### Frontend
- React Query caching (5 min stale time)
- Code splitting with React.lazy (planned)
- Optimistic UI updates
- Debounced search inputs

### Backend
- Database indexes on frequently queried columns
- Pagination for list endpoints
- Rate limiting with Bucket4j
- Connection pooling (HikariCP)

## Security Considerations

- JWT stored in memory (refresh token for persistence)
- CORS restricted to known origins
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping)
- Rate limiting on auth endpoints
