# Contributing to Workflow

Thank you for your interest in contributing to Workflow! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person

## Getting Started

1. Fork the repository
2. Clone your fork
3. Set up the development environment (see [DEVELOPMENT.md](docs/DEVELOPMENT.md))
4. Create a new branch for your feature/fix

## Development Workflow

### 1. Create a Branch

```bash
# Feature
git checkout -b feature/your-feature-name

# Bug fix
git checkout -b fix/issue-description

# Documentation
git checkout -b docs/what-you-documented
```

### 2. Make Your Changes

- Follow the existing code style
- Write clear, descriptive commit messages
- Add tests for new functionality
- Update documentation if needed

### 3. Commit Guidelines

Use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(boards): add board duplication feature
fix(auth): resolve token refresh race condition
docs(api): add label endpoints documentation
```

### 4. Run Tests

```bash
# Frontend
cd frontend
npm run lint
npm run test

# Backend
cd backend
./mvnw test
```

### 5. Submit Pull Request

1. Push your branch to your fork
2. Open a PR against the `main` branch
3. Fill out the PR template
4. Wait for review

## Pull Request Guidelines

### Title

Use the same format as commits:
```
feat(boards): add board duplication feature
```

### Description

Include:
- What changes were made
- Why the changes were needed
- How to test the changes
- Screenshots (for UI changes)

### Checklist

Before submitting:
- [ ] Code follows project style
- [ ] Tests pass locally
- [ ] New code has test coverage
- [ ] Documentation updated
- [ ] No merge conflicts

## Code Style

### TypeScript/React

- Use TypeScript strict mode
- Prefer functional components
- Use hooks for state and effects
- Extract reusable logic into custom hooks

```typescript
// Good
const BoardCard: React.FC<BoardCardProps> = ({ board }) => {
  const { mutate: deleteBoard } = useDeleteBoard();

  return (
    <div className="board-card">
      <h3>{board.name}</h3>
    </div>
  );
};

// Avoid
function BoardCard(props: any) {
  // ...
}
```

### Java/Spring

- Use Lombok for boilerplate
- Follow Spring conventions
- Use constructor injection
- Keep services focused

```java
// Good
@Service
@RequiredArgsConstructor
public class BoardService {
    private final BoardRepository boardRepository;
    private final AuthorizationService authService;

    public BoardResponse createBoard(CreateBoardRequest request) {
        // ...
    }
}
```

## Reporting Issues

### Bug Reports

Include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, versions)
- Screenshots or logs if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case / problem it solves
- Proposed implementation (optional)
- Alternatives considered

## Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be in the next release

## Questions?

- Open a GitHub issue for questions
- Tag it with `question` label

## Recognition

Contributors are recognized in release notes. Thank you for helping improve Workflow!
