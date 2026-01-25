# API Reference

Base URL: `http://localhost:8080`

All protected endpoints require `Authorization: Bearer <token>` header.

## Authentication

### Register

Create a new user account.

```http
POST /auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response** `200 OK`
```json
{
  "userId": 1,
  "username": "john",
  "email": "john@example.com",
  "accessToken": "eyJhbG...",
  "refreshToken": "dGhpcyB..."
}
```

### Login

Authenticate with username and password.

```http
POST /auth/login
Content-Type: application/json

{
  "username": "john",
  "password": "securePassword123"
}
```

**Response** `200 OK`
```json
{
  "userId": 1,
  "username": "john",
  "email": "john@example.com",
  "accessToken": "eyJhbG...",
  "refreshToken": "dGhpcyB..."
}
```

### Google OAuth

Authenticate with Google ID token.

```http
POST /auth/google
Content-Type: application/json

{
  "idToken": "google_id_token_here"
}
```

### Refresh Token

Get a new access token using refresh token.

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "dGhpcyB..."
}
```

**Response** `200 OK`
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "dGhpcyB..."
}
```

### Logout

Invalidate refresh token.

```http
POST /auth/logout
Authorization: Bearer <token>
```

### Forgot Password

Request password reset code via email.

```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Verify Code

Verify the password reset code.

```http
POST /auth/verify-code
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

### Reset Password

Set new password with verified code.

```http
POST /auth/reset-password
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456",
  "newPassword": "newSecurePassword123"
}
```

---

## Boards

### List User Boards

Get paginated list of boards for a user.

```http
GET /boards/user/{userId}?page=0&size=10&sortBy=id&sortDir=desc
Authorization: Bearer <token>
```

**Query Parameters**
| Parameter | Default | Description |
|-----------|---------|-------------|
| page | 0 | Page number (0-indexed) |
| size | 10 | Items per page |
| sortBy | id | Sort field |
| sortDir | desc | Sort direction (asc/desc) |

**Response** `200 OK`
```json
{
  "_embedded": {
    "boards": [
      {
        "id": 1,
        "name": "My Project",
        "slug": "my-project",
        "description": "Project description",
        "status": "IN_PROGRESS",
        "deadline": "2025-12-31",
        "_links": {
          "self": { "href": "/boards/1" },
          "details": { "href": "/boards/my-project/details" }
        }
      }
    ]
  },
  "page": {
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "number": 0
  },
  "_links": {
    "self": { "href": "/boards/user/1?page=0&size=10" }
  }
}
```

### Create Board

```http
POST /boards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "status": "PLANNED",
  "deadline": "2025-12-31",
  "userId": 1
}
```

### Get Board Details

Get board with all task lists, tasks, and labels.

```http
GET /boards/{slug}/details
Authorization: Bearer <token>
```

### Update Board

```http
PUT /boards/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "deadline": "2025-12-31",
  "userId": 1
}
```

### Update Board Status

```http
PUT /boards/{id}/status
Authorization: Bearer <token>
Content-Type: text/plain

IN_PROGRESS
```

**Valid statuses**: `PLANNED`, `IN_PROGRESS`, `COMPLETED`

### Delete Board

```http
DELETE /boards/{id}
Authorization: Bearer <token>
```

**Response** `204 No Content`

---

## Task Lists

### Create Task List

```http
POST /lists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "To Do",
  "boardId": 1
}
```

### Update Task List

```http
PUT /lists/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 1,
  "name": "Updated Name",
  "position": 0
}
```

### Delete Task List

Deletes the list and all tasks within it.

```http
DELETE /lists/{id}
Authorization: Bearer <token>
```

---

## Tasks

### Create Task

```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement feature",
  "description": "Feature description",
  "priority": "HIGH",
  "deadline": "2025-06-15",
  "taskListId": 1,
  "labelIds": [1, 2]
}
```

**Priority values**: `LOW`, `MEDIUM`, `HIGH`

### Update Task

```http
PUT /tasks/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 1,
  "title": "Updated title",
  "description": "Updated description",
  "priority": "MEDIUM",
  "deadline": "2025-06-20",
  "labelIds": [1]
}
```

### Delete Task

```http
DELETE /tasks/{id}
Authorization: Bearer <token>
```

### Reorder Task

Move task within list or to another list.

```http
PUT /tasks/{id}/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetListId": 2,
  "newPosition": 0
}
```

### Batch Reorder

Update positions of multiple tasks at once.

```http
PUT /tasks/batch-reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "taskListId": 1,
  "taskIds": [3, 1, 2]
}
```

---

## Subtasks

### Create Subtask

```http
POST /subtasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Subtask title",
  "taskId": 1
}
```

### Update Subtask

```http
PUT /subtasks/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 1,
  "title": "Updated title",
  "completed": true
}
```

### Delete Subtask

```http
DELETE /subtasks/{id}
Authorization: Bearer <token>
```

### Get Task Subtasks

```http
GET /subtasks/task/{taskId}
Authorization: Bearer <token>
```

### Toggle Subtask Completion

```http
PATCH /subtasks/{id}/toggle
Authorization: Bearer <token>
```

---

## Labels

### Get Board Labels

```http
GET /labels/board/{boardId}
Authorization: Bearer <token>
```

### Create Label

```http
POST /labels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Bug",
  "color": "#FF0000",
  "boardId": 1
}
```

### Update Label

```http
PUT /labels/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 1,
  "name": "Feature",
  "color": "#00FF00"
}
```

### Delete Label

```http
DELETE /labels/{id}
Authorization: Bearer <token>
```

### Get Label Usage

See which task lists use this label.

```http
GET /labels/{id}/usage
Authorization: Bearer <token>
```

---

## Users

### Get User

```http
GET /users/{id}
Authorization: Bearer <token>
```

### Update Profile

```http
PUT /users/{id}/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newusername",
  "profilePicture": "https://example.com/avatar.jpg"
}
```

### Update Password

```http
PUT /users/{id}/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "timestamp": "2025-01-26T12:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/boards"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

---

## Interactive Documentation

For interactive API exploration, access Swagger UI at:

```
http://localhost:8080/swagger-ui.html
```
