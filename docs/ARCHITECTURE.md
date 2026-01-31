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
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │ Rate Limit  │  │   Caching    │  │     Flyway              │ │
│  │  (Bucket4j) │  │  (Caffeine)  │  │     (Migrations)        │ │
│  └─────────────┘  └──────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JDBC (HikariCP)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                                │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Directory Structure

```
frontend/src/
├── components/              # Reusable UI components
│   ├── auth/                # Auth guards
│   │   ├── PrivateRoute.tsx # Protected route wrapper
│   │   └── PublicRoute.tsx  # Public-only route wrapper
│   ├── board/               # Board-specific components
│   │   ├── BoardHeader.tsx
│   │   ├── BoardStatsSection.tsx
│   │   ├── BoardFilterSection.tsx
│   │   ├── CreateListModal.tsx
│   │   ├── CreateTaskModal.tsx
│   │   └── CreateSubtaskModal.tsx
│   ├── error/               # Error handling
│   │   ├── ErrorBoundary.tsx
│   │   └── ErrorFallback.tsx
│   ├── settings/            # Settings page sections
│   │   ├── ProfileSection.tsx
│   │   ├── PrivacySection.tsx
│   │   ├── SecuritySection.tsx
│   │   └── AccountSection.tsx
│   ├── ui/                  # Generic UI components
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── FormModal.tsx
│   │   ├── ViewSwitcher.tsx
│   │   ├── NavbarViewSwitcher.tsx
│   │   ├── SortDropdown.tsx
│   │   ├── SortingOptions.tsx
│   │   ├── StatusFilterTabs.tsx
│   │   ├── StatusFilterDropdown.tsx
│   │   └── VerticalStatusFilter.tsx
│   ├── BoardCard.tsx        # Board display card
│   ├── BoardInfoPanel.tsx   # Board information panel
│   ├── BoardMembersSection.tsx
│   ├── CalendarView.tsx     # Calendar visualization
│   ├── FilterBar.tsx        # Filtering controls
│   ├── Layout.tsx           # Main layout wrapper (navbar + footer)
│   ├── MillerColumn.tsx     # Miller columns view
│   ├── MillerPreviewPanel.tsx
│   ├── NotificationBell.tsx # Notification indicator
│   ├── NotificationDropdown.tsx
│   ├── ConnectionButton.tsx # Send/manage connections
│   ├── UserSearchBar.tsx    # User search
│   ├── SortableTask.tsx     # Drag-and-drop task
│   ├── StatCard.tsx         # Statistics display
│   ├── StatsBar.tsx         # Stats overview bar
│   └── ... (modals: TaskEditModal, BoardEditModal, etc.)
├── pages/                   # Route-level components (17 pages)
│   ├── LandingPage.tsx      # Public landing
│   ├── LoginPage.tsx        # Login form
│   ├── RegisterPage.tsx     # Registration form
│   ├── ForgotPasswordPage.tsx
│   ├── HomePage.tsx         # Dashboard
│   ├── BoardsPage.tsx       # Board listing
│   ├── BoardDetailPage.tsx  # Kanban board view
│   ├── BoardInfoPage.tsx    # Board info/settings
│   ├── BoardStatusPage.tsx  # Boards by status
│   ├── CalendarPage.tsx     # Calendar view
│   ├── ProfilePage.tsx      # Own profile
│   ├── UserProfilePage.tsx  # Other user's profile
│   ├── ConnectionsPage.tsx  # Connection management
│   ├── TeamPage.tsx         # Team boards overview
│   ├── TeamStatusPage.tsx   # Team status details
│   ├── NotificationsPage.tsx# Notification center
│   └── SettingsPage.tsx     # App settings
├── hooks/                   # Custom React hooks
│   ├── useClickOutside.ts
│   ├── useFocusTrap.ts
│   └── queries/             # React Query hooks
│       ├── useBoards.ts
│       ├── useBoardMutations.ts
│       ├── useBoardMembers.ts
│       ├── useAssignedBoards.ts
│       ├── useSubtasks.ts
│       ├── useNotifications.ts
│       ├── useConnectionMutations.ts
│       ├── useUserSearch.ts
│       ├── useUserProfile.ts
│       └── useUserProfileStats.ts
├── stores/                  # Zustand state stores
│   ├── authStore.ts         # Authentication state & tokens
│   └── uiStore.ts           # UI preferences (view, sort, pinned boards)
├── services/                # API client layer
│   └── api.ts               # Axios instance & all API methods
├── types/                   # TypeScript interfaces
│   └── index.ts             # All type definitions
├── styles/                  # Design tokens & theming
│   └── tokens.ts            # CSS variables
├── contexts/                # React contexts
│   └── ThemeContext.tsx      # Dark/light theme
├── lib/                     # Library configurations
│   └── queryClient.ts       # React Query client setup
└── utils/                   # Helper functions
    ├── errorHandler.ts      # Global error handling
    ├── apiError.ts          # API error utilities
    ├── validation.ts        # Form validation
    ├── themeColors.ts       # Theme color utilities
    └── progressCalculation.ts # Progress calculation helpers
```

### State Management Strategy

The application uses a dual state management approach:

**1. Server State (React Query)**
- All data from the API (boards, tasks, labels, members, connections, notifications)
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
- **Modular components**: Organized by domain (auth, board, settings, ui, error)

### Routing

React Router 7 with protected routes:

```
# Public routes
/                           # Landing page
/login                      # Login page
/register                   # Register page
/forgot-password            # Password reset

# Protected routes (require authentication)
/home                       # Dashboard
/boards                     # Board listing
/boards/:slug               # Board detail (Kanban view)
/boards/:slug/miller        # Miller columns (redirects to board)
/boards/status/:statusSlug  # Boards filtered by status
/boards/info/:slug          # Board info & settings
/calendar                   # Calendar view
/profile                    # Own profile
/profile/:username          # Other user's profile
/connections                # Connection management
/team                       # Team boards overview
/team/status/:section/:statusSlug  # Team status details
/notifications              # Notification center
/settings                   # App settings

# Catch-all
*                           # Redirects to /home
```

## Backend Architecture

### Directory Structure

```
backend/src/main/java/com/workflow/backend/
├── controller/              # REST endpoints (9 controllers)
│   ├── AuthController.java          # Registration, login, OAuth, password reset
│   ├── BoardController.java         # Board CRUD, status, labels
│   ├── TaskController.java          # Task/TaskList CRUD, reorder, toggle
│   ├── SubtaskController.java       # Subtask CRUD, toggle
│   ├── LabelController.java         # Label CRUD, usage
│   ├── UserController.java          # Profile, search, privacy, deletion
│   ├── BoardMemberController.java   # Members, roles, assignments
│   ├── NotificationController.java  # Notifications, read status
│   └── ConnectionController.java    # Connection requests, accept/reject
├── service/                 # Business logic (16+ services)
│   ├── BoardService.java
│   ├── TaskService.java
│   ├── UserService.java
│   ├── AuthorizationService.java
│   ├── ConnectionService.java
│   ├── NotificationService.java
│   └── ...
├── repository/              # Data access (JPA, 15 repositories)
├── entity/                  # Domain models (15 entities)
│   ├── User.java
│   ├── Board.java
│   ├── TaskList.java
│   ├── Task.java
│   ├── Subtask.java
│   ├── Label.java
│   ├── BoardMember.java
│   ├── BoardMemberAssignment.java
│   ├── Connection.java
│   ├── Notification.java
│   ├── UserProfilePicture.java
│   ├── UserPrivacySettings.java
│   ├── RefreshToken.java
│   ├── EmailVerificationToken.java
│   └── PasswordResetToken.java
├── dto/                     # Request/Response objects (49+ DTOs)
├── hateoas/                 # Hypermedia models
│   ├── model/               # Resource representations
│   └── assembler/           # DTO → Model converters
├── security/                # Auth & JWT
│   ├── JwtService.java
│   ├── JwtFilter.java
│   └── SecurityConfig.java
├── config/                  # App configuration (7 configs)
├── exception/               # Custom exceptions (11 types)
├── validation/              # Custom validators
└── util/                    # Utility classes
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
- Authorization checks (via AuthorizationService)
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
4. Refresh token (3 days) used to get new access tokens
5. Email verification required for registration

**Authorization**
- Resource ownership verified in service layer
- Board-level role checks (Member, Moderator)
- `AuthorizationService` handles permission checks
- Rate limiting on auth endpoints (Bucket4j)

### API Design

The API follows REST principles with HATEOAS (Richardson Maturity Level 3):

```json
{
  "id": 1,
  "name": "My Board",
  "status": "IN_PROGRESS",
  "boardType": "TEAM",
  "_links": {
    "self": { "href": "/boards/1" },
    "details": { "href": "/boards/my-board/details" },
    "members": { "href": "/boards/1/members" },
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
┌──────────────────────┐
│        User          │
├──────────────────────┤
│ id                   │
│ username (UNIQUE)    │
│ email (UNIQUE)       │
│ firstName, lastName  │
│ password             │
│ googleId             │
│ authProvider         │
│ privacyMode          │
│ deletionScheduledAt  │
└──┬───────────────────┘
   │ 1:N                    1:1 ┌────────────────────────┐
   │                       ┌───►│  UserProfilePicture    │
   │                       │    │  filePath              │
   │                       │    └────────────────────────┘
   │                       │
   │                       │ 1:1 ┌────────────────────────┐
   │                       ├───►│  UserPrivacySettings   │
   │                       │    │  showProfilePicture    │
   │                       │    │  showOverallProgress   │
   │                       │    │  showBoardStats        │
   │                       │    │  showConnectionCount   │
   │                       │    │  ... (9 privacy flags) │
   │                       │    └────────────────────────┘
   │                       │
   ▼                       │
┌──────────────────────┐   │    ┌────────────────────────┐
│       Board          │   │    │     Connection         │
├──────────────────────┤   │    ├────────────────────────┤
│ id                   │   │    │ id                     │
│ name                 │   │    │ sender_id (FK User)    │
│ slug (UNIQUE)        │   │    │ receiver_id (FK User)  │
│ description          │   │    │ status (PENDING/       │
│ status               │   │    │   ACCEPTED/REJECTED)   │
│ boardType (IND/TEAM) │   │    └────────────────────────┘
│ deadline             │   │
│ category             │   │    ┌────────────────────────┐
│ userId (FK)          │   │    │     Notification       │
└──┬───────────────────┘   │    ├────────────────────────┤
   │                       │    │ id                     │
   │ 1:N                   │    │ recipient_id (FK User) │
   ├───────────────────────┤    │ actor_id (FK User)     │
   │                       │    │ type                   │
   │  ┌───────────────────┐│    │ message                │
   │  │   BoardMember     ││    │ isRead                 │
   │  ├───────────────────┤│    │ referenceId            │
   │  │ board_id (FK)     ││    └────────────────────────┘
   │  │ user_id (FK)      ││
   │  │ role (MEMBER/MOD) ││
   │  │ status            ││
   │  └──┬────────────────┘│
   │     │ 1:N             │
   │     ▼                 │
   │  ┌───────────────────┐│
   │  │BoardMemberAssign  ││
   │  │ targetType        ││
   │  │ targetId          ││
   │  └───────────────────┘│
   │                       │
   │ 1:N                   │
   ▼                       │
┌──────────────────────┐   │    ┌────────────────────────┐
│      TaskList        │   │    │       Label            │
├──────────────────────┤   │    ├────────────────────────┤
│ id                   │   │    │ id                     │
│ name                 │   │    │ name                   │
│ position             │   │    │ color                  │
│ isCompleted          │   │    │ isDefault              │
│ boardId (FK)         │   │    │ boardId (FK)           │
└──┬───────────────────┘   │    └────────────────────────┘
   │ 1:N                   │        ▲ N:N with Task/TaskList
   ▼                       │
┌──────────────────────┐   │
│       Task           │   │
├──────────────────────┤   │
│ id                   │   │
│ title                │   │
│ description          │   │
│ priority (HIGH/MED/  │   │
│   LOW/NONE)          │   │
│ deadline             │   │
│ position             │   │
│ isCompleted          │   │
│ assignee_id (FK User)│   │
│ taskListId (FK)      │   │
└──┬───────────────────┘   │
   │ 1:N                   │
   ▼                       │
┌──────────────────────┐   │
│      Subtask         │   │
├──────────────────────┤   │
│ id                   │   │
│ title                │   │
│ completed            │   │
│ position             │   │
│ taskId (FK)          │   │
└──────────────────────┘
```

### Join Tables
- **task_labels**: Task ↔ Label (N:N)
- **task_list_labels**: TaskList ↔ Label (N:N)

### Enums
- **Priority**: HIGH, MEDIUM, LOW, NONE
- **BoardType**: INDIVIDUAL, TEAM
- **BoardMemberRole**: MEMBER, MODERATOR
- **ConnectionStatus**: PENDING, ACCEPTED, REJECTED
- **NotificationType**: CONNECTION_REQUEST, CONNECTION_ACCEPTED, CONNECTION_REJECTED
- **PrivacyMode**: HIDDEN, PUBLIC, PRIVATE
- **AuthProvider**: LOCAL, GOOGLE
- **AssignmentTargetType**: LIST, TASK, SUBTASK

## Database Migrations

The project uses **Flyway** for database migrations with 27 versioned migration files (`V1` through `V27`). Migrations run automatically on application startup.

Key migration milestones:
- **V1**: Baseline schema (users, boards, task_lists, tasks, subtasks, labels, auth tokens)
- **V2**: Profile picture storage separated to its own table
- **V3**: Connections, notifications, and privacy features
- **V8**: Board types (individual vs team)
- **V9**: User first/last name fields
- **V12**: Board member assignments for task/list responsibility tracking
- **V15**: File-based profile picture storage (replaced Base64)
- **V16**: Granular privacy settings (9 individual flags)
- **V22**: Board member roles (Member, Moderator)
- **V25-V26**: Unique constraints and cascade delete rules

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

### Why Flyway?

- Version-controlled database schema
- Repeatable and auditable migrations
- Team-friendly (no conflicts from auto-generated DDL)
- Production-safe rollout

## Performance Considerations

### Frontend
- React Query caching (configurable stale time)
- Virtual scrolling with @tanstack/react-virtual for large lists
- Optimistic UI updates
- Debounced search inputs
- Component memoization

### Backend
- Database indexes on frequently queried columns (user_id, board_id, slug, etc.)
- Pagination for all list endpoints
- Rate limiting with Bucket4j on auth endpoints
- Connection pooling (HikariCP)
- Caffeine cache for frequently accessed data

## Security Considerations

- JWT stored in memory (refresh token for persistence)
- CORS restricted to known origins
- Input validation on all endpoints
- SQL injection prevention (parameterized queries via JPA)
- XSS prevention (React escaping)
- Rate limiting on auth endpoints
- Email verification for new accounts
- Granular privacy settings per user
- Board-level role-based access control
- Optimistic locking (@Version) on all entities to prevent concurrent update conflicts
