# API Reference

Base URL: `http://localhost:8080`

All protected endpoints require `Authorization: Bearer <token>` header.

## Authentication

### Check Username Availability

```http
GET /auth/check-username?username=john
```

### Send Registration Verification Code

```http
POST /auth/register/send-code
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Register

Create a new user account (requires email verification code).

```http
POST /auth/register
Content-Type: application/json

{
  "username": "john",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "code": "123456"
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
        "boardType": "INDIVIDUAL",
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

### Get Assigned Boards

Get boards where the current user is a member.

```http
GET /boards/assigned
Authorization: Bearer <token>
```

### Get My Team Boards

Get the current user's TEAM type boards.

```http
GET /boards/my-team-boards
Authorization: Bearer <token>
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
  "boardType": "INDIVIDUAL",
  "deadline": "2025-12-31",
  "userId": 1
}
```

**Board types**: `INDIVIDUAL`, `TEAM`

### Get Board Details

Get board with all task lists, tasks, and labels.

```http
GET /boards/{slug}/details
Authorization: Bearer <token>
```

### Update Board

```http
PUT /boards/{identifier}
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
PUT /boards/{identifier}/status
Authorization: Bearer <token>
Content-Type: text/plain

IN_PROGRESS
```

**Valid statuses**: `PLANNED`, `IN_PROGRESS`, `COMPLETED`

### Delete Board

```http
DELETE /boards/{identifier}
Authorization: Bearer <token>
```

**Response** `204 No Content`

### Get Board Labels

```http
GET /boards/{boardId}/labels
Authorization: Bearer <token>
```

---

## Task Lists

### Create Task List

```http
POST /api/lists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "To Do",
  "boardId": 1
}
```

### Update Task List

```http
PUT /api/lists/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 1,
  "name": "Updated Name",
  "position": 0
}
```

### Toggle Task List Completion

```http
PATCH /api/lists/{id}/toggle
Authorization: Bearer <token>
```

### Delete Task List

Deletes the list and all tasks within it.

```http
DELETE /api/lists/{id}
Authorization: Bearer <token>
```

---

## Tasks

### Create Task

```http
POST /api/tasks
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

**Priority values**: `HIGH`, `MEDIUM`, `LOW`, `NONE`

### Update Task

```http
PUT /api/tasks/{id}
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

### Toggle Task Completion

```http
PATCH /api/tasks/{id}/toggle
Authorization: Bearer <token>
```

### Delete Task

```http
DELETE /api/tasks/{id}
Authorization: Bearer <token>
```

### Reorder Task

Move task within list or to another list.

```http
PUT /api/tasks/{id}/reorder
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
PUT /api/tasks/batch-reorder
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

### Get Profile Picture

```http
GET /users/{id}/profile-picture
```

No authentication required.

### Update Profile

```http
PUT /users/{id}/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newusername",
  "firstName": "John",
  "lastName": "Doe"
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

### Search Users

```http
GET /users/search?username=john
Authorization: Bearer <token>
```

### Get Public Profile

```http
GET /users/profile/{username}
Authorization: Bearer <token>
```

### Get Profile Stats

```http
GET /users/profile/{username}/stats
Authorization: Bearer <token>
```

### Get Privacy Settings

```http
GET /users/{id}/privacy
Authorization: Bearer <token>
```

### Update Privacy Settings

```http
PUT /users/{id}/privacy
Authorization: Bearer <token>
Content-Type: application/json

{
  "showProfilePicture": true,
  "showOverallProgress": true,
  "showBoardStats": true,
  "showListStats": true,
  "showTaskStats": true,
  "showSubtaskStats": true,
  "showTeamBoardStats": true,
  "showTopCategories": true,
  "showConnectionCount": true
}
```

### Schedule Account Deletion

```http
POST /users/{id}/schedule-deletion
Authorization: Bearer <token>
```

### Cancel Account Deletion

```http
POST /users/{id}/cancel-deletion
Authorization: Bearer <token>
```

---

## Board Members

### Get Board Members

```http
GET /boards/{boardId}/members?page=0&size=10
Authorization: Bearer <token>
```

### Add Board Member

```http
POST /boards/{boardId}/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 2
}
```

### Remove Board Member

```http
DELETE /boards/{boardId}/members/{memberId}
Authorization: Bearer <token>
```

### Update Member Role

```http
PUT /boards/{boardId}/members/{memberId}/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "MODERATOR"
}
```

**Roles**: `MEMBER`, `MODERATOR`

### Create Member Assignment

Assign a member to a specific task, list, or subtask.

```http
POST /boards/{boardId}/members/{memberId}/assignments
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetType": "TASK",
  "targetId": 1
}
```

**Target types**: `LIST`, `TASK`, `SUBTASK`

### Bulk Create Assignments

```http
POST /boards/{boardId}/members/{memberId}/assignments/bulk
Authorization: Bearer <token>
Content-Type: application/json

[
  { "targetType": "TASK", "targetId": 1 },
  { "targetType": "TASK", "targetId": 2 }
]
```

### Remove Assignment

```http
DELETE /boards/{boardId}/members/{memberId}/assignments/{assignmentId}
Authorization: Bearer <token>
```

---

## Connections

### Send Connection Request

```http
POST /connections
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": 2
}
```

### Accept Connection Request

```http
PATCH /connections/{id}/accept
Authorization: Bearer <token>
```

### Reject Connection Request

```http
PATCH /connections/{id}/reject
Authorization: Bearer <token>
```

### Get Pending Requests

```http
GET /connections/pending?page=0&size=10
Authorization: Bearer <token>
```

### Get Sent Requests

```http
GET /connections/sent?page=0&size=10
Authorization: Bearer <token>
```

### Get Accepted Connections

```http
GET /connections/accepted?page=0&size=10
Authorization: Bearer <token>
```

### Get Connection Count

```http
GET /connections/count
Authorization: Bearer <token>
```

### Remove Connection

```http
DELETE /connections/{id}
Authorization: Bearer <token>
```

---

## Notifications

### Get Notifications

```http
GET /notifications?page=0&size=10
Authorization: Bearer <token>
```

### Get Unread Count

```http
GET /notifications/unread-count
Authorization: Bearer <token>
```

### Mark as Read

```http
PUT /notifications/{id}/read
Authorization: Bearer <token>
```

### Mark All as Read

```http
PATCH /notifications/read-all
Authorization: Bearer <token>
```

### Delete Notification

```http
DELETE /notifications/{id}
Authorization: Bearer <token>
```

**Notification types**: `CONNECTION_REQUEST`, `CONNECTION_ACCEPTED`, `CONNECTION_REJECTED`

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
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Interactive Documentation

For interactive API exploration, access Swagger UI at:

```
http://localhost:8080/swagger-ui.html
```
